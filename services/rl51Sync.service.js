import { syncLog } from "../models/SyncLogModel.js";
import { rlLimaTitikSatuSatuSehat } from "../models/RLLimaTitikSatuModel.js";
import { AgeGroups } from "../models/AgeGroups.js";
import { Op } from "sequelize";
import axios from "axios";

const STALE_MINUTES = parseInt(process.env.SYNC_STALE_MINUTES) || 1440; // default 1 hari
const TIPE_RL = "rl_5_1";

// ─────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────

export const isStaleRL51 = async (orgId, periode) => {
  const log = await syncLog.findOne({
    where: { orgId, tipe_rl: TIPE_RL, periode, status: "success" },
    order: [["synced_at", "DESC"]],
  });
  if (!log) return true;
  return (
    (Date.now() - new Date(log.synced_at).getTime()) / 60000 > STALE_MINUTES
  );
};

export const isSyncingRL51 = async (orgId, periode) => {
  const log = await syncLog.findOne({
    where: {
      orgId,
      tipe_rl: TIPE_RL,
      periode,
      status: "syncing",
      createdAt: { [Op.gte]: new Date(Date.now() - 5 * 60000) }, // max 5 menit
    },
  });
  return !!log;
};

export const getLastSyncInfoRL51 = async (orgId, periode) => {
  return await syncLog.findOne({
    where: { orgId, tipe_rl: TIPE_RL, periode },
    order: [["synced_at", "DESC"]],
    attributes: ["status", "synced_at", "total_data", "error_msg"],
  });
};

// ─────────────────────────────────────────────
// CORE SYNC
// ─────────────────────────────────────────────

export const doSyncRL51 = async (organization_id, periode) => {
  // Buat log entry: sedang sync
  const logEntry = await syncLog.create({
    orgId: organization_id,
    tipe_rl: TIPE_RL,
    periode,
    status: "syncing",
  });

  try {
    // ── Fetch dari SatuSehat ──
    const response = await fetchRL51FromSatuSehat(organization_id, periode);

    // Jika null / 404 / tidak ada data → tetap success dengan 0 data
    if (!response || response.status === 404 || response.data === null) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
        error_msg: response?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const records = Array.isArray(response.data?.records)
      ? response.data.records
      : [];

    const chunks = chunkArray(records, 100);
    let totalSaved = 0;

    for (const chunk of chunks) {
      const saved = await saveRecordsRL51(
        chunk,
        organization_id,
        `${periode}-01`,
      );
      totalSaved += saved;
    }

    if (records.length === 0) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
      });
      return { success: true, total: 0 };
    }

    // ── Simpan ke DB ──
    // const totalSaved = await saveRecordsRL51(
    //   records,
    //   organization_id,
    //   `${periode}-01`,
    // );

    await logEntry.update({
      status: "success",
      total_data: totalSaved,
      synced_at: new Date(),
    });

    console.log(
      `[RL51 Sync] ✅ org=${organization_id} periode=${periode} total=${totalSaved}`,
    );
    return { success: true, total: totalSaved };
  } catch (err) {
    const errStatus = err.response?.status || err.status;
    const errData = err.response?.data;

    // 404 dari SatuSehat → bukan error sistem, anggap data kosong
    if (errStatus === 404 || errData?.status === 404) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
        error_msg: errData?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    // Error sistem (network, DB, dsb) → tandai failed
    await logEntry.update({
      status: "failed",
      error_msg: err.message,
    });
    throw err;
  }
};

// ─────────────────────────────────────────────
// FETCH DARI SATUSEHAT
// ─────────────────────────────────────────────

const fetchRL51FromSatuSehat = async (organization_id, periode) => {
  const response = await axios.get(
    `${process.env.SATUSEHAT_BASE_URL}/rl51?month=${periode}&organization_id=${organization_id}`,
    { headers: { "X-API-Key": process.env.SATUSEHAT_API_KEY } },
  );
  return response.data; // { status, message, data: { records: [...] } }
};

// ─────────────────────────────────────────────
// SAVE RECORDS KE DB
// ─────────────────────────────────────────────

const saveRecordsRL51 = async (records, organization_id, periode) => {
  // 1. Load semua AgeGroups yang sudah ada
  const existingAges = await AgeGroups.findAll();
  const ageMap = new Map(existingAges.map((a) => [a.id, a.name]));

  const newAgeGroups = [];
  const dataToUpsert = [];

  for (const record of records) {
    for (const newCase of record.new_cases) {
      const { age_id, age_name } = newCase;

      // Tambahkan age group baru jika belum ada
      if (!ageMap.has(age_id)) {
        newAgeGroups.push({ id: age_id, name: age_name });
        ageMap.set(age_id, age_name);
      }

      dataToUpsert.push({
        organization_id,
        periode,
        icd_10: record.icd10,
        age_id,
        diagnosis: record.diagnosis,
        male_new_cases: newCase.male_new_cases,
        females_new_cases: newCase.female_new_cases,
        total_new_cases: newCase.male_new_cases + newCase.female_new_cases,
        male_visits: record.male_visits,
        female_visits: record.female_visits,
        total_visits: record.total_visits,
      });
    }
  }

  // 2. Bulk insert AgeGroups baru (jika ada)
  if (newAgeGroups.length > 0) {
    await AgeGroups.bulkCreate(newAgeGroups, { ignoreDuplicates: true });
  }

  // 3. Bulk upsert records
  if (dataToUpsert.length > 0) {
    await rlLimaTitikSatuSatuSehat.bulkCreate(dataToUpsert, {
      updateOnDuplicate: [
        "diagnosis",
        "male_new_cases",
        "females_new_cases",
        "total_new_cases",
        "male_visits",
        "female_visits",
        "total_visits",
      ],
    });
  }

  return dataToUpsert.length;
};
