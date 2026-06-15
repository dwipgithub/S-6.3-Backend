// services/rlSync.service.js
import { syncLog } from "../models/SyncLogModel.js";
import { rlEmpatTitikSatuSatuSehat } from "../models/RLEmpatTitikSatuSatuSehatModel.js";
import { fetchRL41FromSatuSehat } from "./satusehat.service.js";
import { Op } from "sequelize"; // ← tambahkan ini

const STALE_MINUTES = parseInt(process.env.SYNC_STALE_MINUTES) || 30;
const TIPE_RL = "rl_4_1";

export const isStale = async (orgId, periode) => {
  const log = await syncLog.findOne({
    where: { orgId: orgId, tipe_rl: TIPE_RL, periode, status: "success" },
    order: [["synced_at", "DESC"]],
  });
  if (!log) return true;
  return (
    (Date.now() - new Date(log.synced_at).getTime()) / 60000 > STALE_MINUTES
  );
};

export const isSyncing = async (orgId, periode) => {
  const log = await syncLog.findOne({
    where: {
      orgId: orgId,
      tipe_rl: TIPE_RL,
      periode,
      status: "syncing",
      createdAt: { [Op.gte]: new Date(Date.now() - 5 * 60000) },
    },
  });
  return !!log;
};

export const getLastSyncInfo = async (orgId, periode) => {
  return await syncLog.findOne({
    where: { orgId: orgId, tipe_rl: TIPE_RL, periode },
    order: [["synced_at", "DESC"]],
    attributes: ["status", "synced_at", "total_data", "error_msg"],
  });
};

export const doSync = async (organization_id, periode) => {
  const logEntry = await syncLog.create({
    orgId: organization_id,
    tipe_rl: TIPE_RL,
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL41FromSatuSehat(organization_id, periode);

    if (!rawData || rawData.status === 404 || rawData.data === null) {
      await logEntry.update({
        status: "success", // tetap success, bukan failed
        total_data: 0,
        synced_at: new Date(),
        error_msg: rawData?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    const dataArray = Array.isArray(rawData.data) ? rawData.data : [];

    if (dataArray.length === 0) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
      });
      return { success: true, total: 0 };
    }

    const mapped = dataArray.map(transformItem);
    await rlEmpatTitikSatuSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: Object.keys(mapped[0]).filter((k) => k !== "id"),
    });

    await logEntry.update({
      status: "success",
      total_data: mapped.length,
      synced_at: new Date(),
    });
    return { success: true, total: mapped.length };
  } catch (err) {
    const errStatus = err.response?.status || err.status;
    const errData = err.response?.data;

    // Jika terdeteksi 404 dari response SatuSehat, handle sebagai "success" dengan 0 data
    if (errStatus === 404 || errData?.status === 404) {
      await logEntry.update({
        status: "success", // Tetap dianggap sukses karena hanya data kosong/tidak ada
        total_data: 0,
        synced_at: new Date(),
        error_msg: errData?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    // Jika benar-benar error sistem (misal: network timeout, DB error, dll) baru set failed
    await logEntry.update({ status: "failed", error_msg: err.message });
    throw err;
  }
};

// ── tambahkan RENTANG_MAP dan transformItem di sini ──
const RENTANG_MAP = {
  "0 - < 1 jam": "0_1jam",
  "1 - < 24 jam": "1_23jam",
  "1-7 hari": "1_7hr",
  "8-28 hari": "8_28hr",
  "29 hari - < 3 bulan": "29hr_3bln",
  "3 - < 6 bulan": "3_6bln",
  "6-11 bulan": "6_11bln",
  "1-4 tahun": "1_4th",
  "5-9 tahun": "5_9th",
  "10-14 tahun": "10_14th",
  "15-19 tahun": "15_19th",
  "20-24 tahun": "20_24th",
  "25-29 tahun": "25_29th",
  "30-34 tahun": "30_34th",
  "35-39 tahun": "35_39th",
  "40-44 tahun": "40_44th",
  "45-49 tahun": "45_49th",
  "50-54 tahun": "50_54th",
  "55-59 tahun": "55_59th",
  "60-64 tahun": "60_64th",
  "65-69 tahun": "65_69th",
  "70-74 tahun": "70_74th",
  "75-79 tahun": "75_79th",
  "80-84 tahun": "80_84th",
  "≥ 85 tahun": "lebih85th",
};

const transformItem = (item) => {
  const result = {
    id: item.id,
    organization_id: item.organization_id,
    bulan_laporan: item.bulan_laporan,
    kode_icd: item.kode_icd,
    diagnosis: item.diagnosis,
    keluar_hidup_mati_l: item.jumlah_keluar_hidup_mati?.L ?? 0,
    keluar_hidup_mati_p: item.jumlah_keluar_hidup_mati?.P ?? 0,
    keluar_hidup_mati_total: item.jumlah_keluar_hidup_mati?.total ?? 0,
    keluar_mati_l: item.jumlah_keluar_mati?.L ?? 0,
    keluar_mati_p: item.jumlah_keluar_mati?.P ?? 0,
    keluar_mati_total: item.jumlah_keluar_mati?.total ?? 0,
  };

  Object.values(RENTANG_MAP).forEach((suffix) => {
    result[`jmlh_pas_hidup_mati_umur_gen_${suffix}_l`] = 0;
    result[`jmlh_pas_hidup_mati_umur_gen_${suffix}_p`] = 0;
    result[`jmlh_pas_mati_umur_gen_${suffix}_l`] = 0;
    result[`jmlh_pas_mati_umur_gen_${suffix}_p`] = 0;
  });

  (item.kelompok_umur ?? []).forEach(({ rentang, L, P }) => {
    const suffix = RENTANG_MAP[rentang];
    if (!suffix) {
      console.warn(`[Mapping] Rentang tidak dikenal: "${rentang}"`);
      return;
    }
    result[`jmlh_pas_hidup_mati_umur_gen_${suffix}_l`] = L ?? 0;
    result[`jmlh_pas_hidup_mati_umur_gen_${suffix}_p`] = P ?? 0;
  });

  return result;
};
