import { syncLog } from "../models/SyncLogModel.js";
import { golonganObatTigaTitikSembilanBelas } from "../models/GolonganObatTigaTitikSembilanBelas.js";
import { fetchRL319FromSatuSehat } from "./satusehat.service.js";
import { rlTigaTitikSembilanBelasSatuSehat } from "../models/RLTigaTitikSembilanBelasSatuSehatModel.js";
import { Op } from "sequelize"; // ← tambahkan ini

const STALE_MINUTES = parseInt(process.env.SYNC_STALE_MINUTES) || 1440;
const TIPE_RL = "rl_3_19";

export const isStale = async (orgId, periode, tipe_rl = "rl_3_19") => {
  const log = await syncLog.findOne({
    where: { orgId: orgId, tipe_rl, periode, status: "success" },
    order: [["synced_at", "DESC"]],
  });
  if (!log) return true;
  return (
    (Date.now() - new Date(log.synced_at).getTime()) / 60000 > STALE_MINUTES
  );
};

export const isSyncing = async (orgId, periode, tipe_rl = "rl_3_19") => {
  const log = await syncLog.findOne({
    where: {
      orgId: orgId,
      tipe_rl,
      periode,
      status: "syncing",
      createdAt: { [Op.gte]: new Date(Date.now() - 5 * 60000) },
    },
  });
  return !!log;
};

export const getLastSyncInfo = async (orgId, periode, tipe_rl = "rl_3_19") => {
  return await syncLog.findOne({
    where: { orgId: orgId, tipe_rl, periode },
    order: [["synced_at", "DESC"]],
    attributes: ["status", "synced_at", "total_data", "error_msg"],
  });
};

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
const CHUNK_SIZE_RL319 = 100;

const transformItem = (item) => {
  const golongan = item.golongan_obat_rl_tiga_titik_sembilan_belas || {};

  return {
    organization_id: item.organization_id,
    tahun: item.tahun,
    golongan_obat_id: item.golongan_obat_rl_tiga_titik_sembilan_belas_id,
    golongan_no: golongan.no ?? null,
    golongan_nama: golongan.nama ?? null,
    ranap_pasien_keluar: item.ranap_pasien_keluar ?? 0,
    ranap_lama_dirawat: item.ranap_lama_dirawat ?? 0,
    jumlah_pasien_rajal: item.jumlah_pasien_rajal ?? 0,
    rajal_lab: item.rajal_lab ?? 0,
    rajal_radiologi: item.rajal_radiologi ?? 0,
    rajal_lain_lain: item.rajal_lain_lain ?? 0,
  };
};

export const doSync = async (organization_id, periode) => {
  const logEntry = await syncLog.create({
    orgId: organization_id,
    tipe_rl: TIPE_RL,
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL319FromSatuSehat(organization_id, periode);

    if (!rawData || rawData.status === 404 || rawData.data === null) {
      await logEntry.update({
        status: "success",
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

    // ---- Chunking: pecah jadi batch kecil sebelum bulkCreate ----
    const chunks = chunkArray(mapped, CHUNK_SIZE_RL319);

    const updateFields = Object.keys(mapped[0]).filter((k) => k !== "id");

    for (let i = 0; i < chunks.length; i++) {
      const tBatchStart = Date.now();
      await rlTigaTitikSembilanBelasSatuSehat.bulkCreate(chunks[i], {
        updateOnDuplicate: updateFields,
      });
      const tBatchEnd = Date.now();
    }

    await logEntry.update({
      status: "success",
      total_data: mapped.length,
      synced_at: new Date(),
    });
    return { success: true, total: mapped.length };
  } catch (err) {
    const errStatus = err.response?.status || err.status;
    const errData = err.response?.data;

    if (errStatus === 404 || errData?.status === 404) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
        error_msg: errData?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    await logEntry.update({ status: "failed", error_msg: err.message });
    throw err;
  }
};
