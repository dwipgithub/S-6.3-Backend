import Joi from "joi";
import axios from "axios";

import { databaseSIRS } from "../config/Database.js";

import {
  rlTigaTitikSebelasHeader,
  rlTigaTitikSebelasDetail,
  get,
  show,
  rlTigaTitikSebelasSatuSehat,
} from "../models/RLTigaTitikSebelasModel.js";

import { JenisKegiatanRLTigaTitikSebelas } from "../models/JenisKegiatanRLTigaTitikSebelasModel.js";
import { satu_sehat_id } from "../models/UserModel.js";

import {
  getLastSyncInfo,
  isStale,
  isSyncing,
} from "../services/rlSync.service.js";

import { fetchRL311FromSatuSehat } from "../services/satusehat.service.js";
import { syncLog } from "../models/SyncLogModel.js";

// ======================================================
// SSE CLIENTS
// ======================================================

const sseClients = new Map();

// ======================================================
// IDENTITAS RUMAH SAKIT DARI API FASKES
// ======================================================

const ambilSemuaRsRL311 = async (baseUrl, token, params = {}) => {
  const semuaRs = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axios.get(`${baseUrl}/faskes/rumahsakit`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { ...params, page, limit: 1000 },
    });

    const responseData = response.data;
    const body = responseData?.data;

    const daftarRs = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(responseData?.data?.data)
          ? responseData.data.data
          : [];

    semuaRs.push(...daftarRs);

    totalPages = Number(
      body?.pagination?.totalNumberOfPages ??
        responseData?.pagination?.totalNumberOfPages ??
        responseData?.data?.pagination?.totalNumberOfPages ??
        1,
    );

    page += 1;
  } while (page <= totalPages);

  return semuaRs;
};

const ambilIdentitasRsRL311 = async (rsId) => {
  const identitasKosong = {
    kodeRs: rsId ?? "-",
    namaRs: "-",
    provinsiNama: "-",
    kabKotaNama: "-",
  };

  try {
    const baseUrl = process.env.API_FASKES;
    const username = process.env.username_API_FASKES;
    const password = process.env.password_API_FASKES;

    if (!baseUrl || !username || !password) {
      console.warn("[RL 3.11] Konfigurasi API Faskes belum lengkap.");
      return identitasKosong;
    }

    const loginResponse = await axios.post(
      `${baseUrl}/faskes/login`,
      {
        userName: username,
        password,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const token =
      loginResponse.data?.access_token ??
      loginResponse.data?.data?.access_token;

    if (!token) {
      console.warn("[RL 3.11] Token API Faskes tidak ditemukan.");
      return identitasKosong;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Coba endpoint detail terlebih dahulu.
    try {
      const detailResponse = await axios.get(
        `${baseUrl}/faskes/rumahsakit/${encodeURIComponent(rsId)}`,
        { headers },
      );

      const detail =
        detailResponse.data?.data?.data ??
        detailResponse.data?.data ??
        detailResponse.data;

      if (detail && (detail.kode || detail.nama)) {
        return {
          kodeRs: detail.kode ?? rsId ?? "-",
          namaRs: detail.nama ?? "-",
          provinsiNama:
            detail.provinsiNama ??
            detail.provinsi_nama ??
            detail.provinsi?.nama ??
            detail.provinsi?.name ??
            "-",
          kabKotaNama:
            detail.kabKotaNama ??
            detail.kab_kota_nama ??
            detail.kabupatenKotaNama ??
            detail.kabupaten_kota?.nama ??
            detail.kabupaten_kota?.name ??
            detail.kabupaten?.nama ??
            detail.kota?.nama ??
            "-",
        };
      }
    } catch (error) {
      console.warn(
        `[RL 3.11] Endpoint detail Faskes tidak berhasil untuk RS ${rsId}:`,
        error.response?.status ?? error.message,
      );
    }

    // Fallback: cari RS pada daftar seluruh fasilitas.
    const daftarRs = await ambilSemuaRsRL311(baseUrl, token);

    const rs = daftarRs.find(
      (item) => String(item.kode ?? "") === String(rsId ?? ""),
    );

    if (!rs) {
      console.warn(`[RL 3.11] RS ${rsId} tidak ditemukan di API Faskes.`);
      return identitasKosong;
    }

    return {
      kodeRs: rs.kode ?? rsId ?? "-",
      namaRs: rs.nama ?? "-",
      provinsiNama:
        rs.provinsiNama ??
        rs.provinsi_nama ??
        rs.provinsi?.nama ??
        rs.provinsi?.name ??
        "-",
      kabKotaNama:
        rs.kabKotaNama ??
        rs.kab_kota_nama ??
        rs.kabupatenKotaNama ??
        rs.kabupaten_kota?.nama ??
        rs.kabupaten_kota?.name ??
        rs.kabupaten?.nama ??
        rs.kota?.nama ??
        "-",
    };
  } catch (error) {
    console.error(
      `[RL 3.11] Gagal mengambil identitas RS ${rsId}:`,
      error.response?.data ?? error.message,
    );

    return identitasKosong;
  }
};

// ======================================================
// DATA RL 3.11 REGULER
// ======================================================

export const getDataRLTigaTitikSebelas = (req, res) => {
  rlTigaTitikSebelasHeader
    .findAll({
      attributes: ["id", "periode"],
      where: {
        rs_id: req.query.rsId,
        periode: req.query.tahun,
      },
      include: {
        model: rlTigaTitikSebelasDetail,
        attributes: [
          "id",
          "rs_id",
          "periode",
          "rl_tiga_titik_sebelas_jenis_kegiatan_id",
          "jumlah",
        ],
        include: {
          model: JenisKegiatanRLTigaTitikSebelas,
        },
      },
      order: [
        [
          { model: rlTigaTitikSebelasDetail },
          "rl_tiga_titik_sebelas_jenis_kegiatan_id",
          "ASC",
        ],
      ],
    })
    .then((results) => {
      res.status(200).send({
        status: true,
        message: "Data Found",
        data: results,
      });
    })
    .catch((err) => {
      res.status(422).send({
        status: false,
        message: err,
      });
    });
};

export const getRLTigaTitikSebelas = (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.number().required(),
    page: Joi.number(),
    limit: Joi.number(),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }

  get(req, (err, results) => {
    if (err) {
      return res.status(500).send({
        status: false,
        message: err.message ?? err,
      });
    }

    const message = results?.length ? "data found" : "data not found";

    return res.status(200).send({
      status: true,
      message,
      data: results,
    });
  });
};

export const showRLTigaTitikSebelas = (req, res) => {
  show(req.params.id, (err, results) => {
    if (err) {
      return res.status(422).send({
        status: false,
        message: err,
      });
    }

    const message = results?.length ? "data found" : "data not found";
    const data = results?.length ? results[0] : null;

    return res.status(200).send({
      status: true,
      message,
      data,
    });
  });
};

export const getDataRLTigaTitikSebelasDetail = (req, res) => {
  rlTigaTitikSebelasDetail
    .findAll({
      attributes: [
        "id",
        "rl_tiga_titik_sebelas_id",
        "jeniskegiatan_rl_tigatitiksebelas_id",
        "jumlah",
      ],
    })
    .then((results) => {
      res.status(200).send({
        status: true,
        message: "data found",
        data: results,
      });
    })
    .catch((err) => {
      res.status(422).send({
        status: false,
        message: err,
      });
    });
};

export const getRLTigaTitikSebelasById = async (req, res) => {
  rlTigaTitikSebelasDetail
    .findOne({
      where: { id: req.params.id },
      include: { model: JenisKegiatanRLTigaTitikSebelas },
    })
    .then((results) => {
      res.status(200).send({
        status: true,
        message: "data found",
        data: results,
      });
    })
    .catch((err) => {
      res.status(422).send({
        status: false,
        message: err,
      });
    });
};

// ======================================================
// INSERT DATA RL 3.11
// ======================================================

export const insertDataRLTigaTitikSebelas = async (req, res) => {
  const schema = Joi.object({
    tahun: Joi.number().required(),
    data: Joi.array()
      .items(
        Joi.object()
          .keys({
            jenisKegiatanId: Joi.number().required(),
            jumlah: Joi.number().required(),
          })
          .required(),
      )
      .required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
  }

  let transaction;

  try {
    transaction = await databaseSIRS.transaction();

    const resultInsertHeader = await rlTigaTitikSebelasHeader.create(
      {
        rs_id: req.user.satKerId,
        periode: req.body.tahun,
        user_id: req.user.id,
      },
      { transaction },
    );

    const dataDetail = req.body.data.map((item) => ({
      rs_id: req.user.satKerId,
      periode: req.body.tahun,
      rl_tiga_titik_sebelas_id: resultInsertHeader.id,
      rl_tiga_titik_sebelas_jenis_kegiatan_id: item.jenisKegiatanId,
      jumlah: item.jumlah,
      user_id: req.user.id,
    }));

    await rlTigaTitikSebelasDetail.bulkCreate(dataDetail, {
      transaction,
      updateOnDuplicate: ["jumlah"],
    });

    await transaction.commit();

    return res.status(201).send({
      status: true,
      message: "Data Success Created",
      data: { id: resultInsertHeader },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).send({
        status: false,
        message: "Gagal Input Data, Jenis Kegiatan Salah.",
      });
    }

    return res.status(400).send({
      status: false,
      message: "Gagal Input Data.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE DATA RL 3.11
// ======================================================

export const updateDataRLTigaTitikSebelas = async (req, res) => {
  const schema = Joi.object({
    jumlah: Joi.number().required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
  }

  let transaction;

  try {
    transaction = await databaseSIRS.transaction();

    const update = await rlTigaTitikSebelasDetail.update(req.body, {
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
      transaction,
    });

    if (update[0] !== 0) {
      await transaction.commit();

      return res.status(201).send({
        status: true,
        message: "Data Diperbaharui",
      });
    }

    await transaction.rollback();

    return res.status(400).send({
      status: false,
      message: "Gagal Memperbaharui Data",
      error: update,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(400).send({
      status: false,
      message: "Gagal Memperbaharui Data",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE DATA RL 3.11
// ======================================================

export const deleteDataRLTigaTitikSebelas = async (req, res) => {
  let transaction;

  try {
    transaction = await databaseSIRS.transaction();

    const count = await rlTigaTitikSebelasDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
      transaction,
    });

    if (count !== 0) {
      await transaction.commit();

      return res.status(201).send({
        status: true,
        message: "data deleted successfully",
        data: { deleted_rows: count },
      });
    }

    await transaction.rollback();

    return res.status(404).send({
      status: false,
      message: "Gagal Menghapus Data",
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(404).send({
      status: false,
      message: error.message,
    });
  }
};

// ======================================================
// RL 3.11 SATUSEHAT + IDENTITAS RUMAH SAKIT
// ======================================================

export const getDataRLTigaTitikSebelasWithSatuSehat = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string().length(4).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(50),
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }

  const { rsId, periode, page, limit } = value;

  if (req.user.jenisUserId == 4 && rsId != req.user.satKerId) {
    return res.status(403).send({
      status: false,
      message: "Kode RS Tidak Sesuai",
    });
  }

  const rsIdFinal = req.user.jenisUserId == 4 ? req.user.satKerId : rsId;
  const namaRsUser = req.user.jenisUserId == 4 ? req.user.nama : null;

  try {
    const offset = (page - 1) * limit;

    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: rsIdFinal },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }

    const organization_id = satuSehat.organization_id?.substring(0, 9);

    const [rows, totalRows, syncInfo, currentlySyncing, identitasRs] =
      await Promise.all([
        rlTigaTitikSebelasSatuSehat.findAll({
          where: { organization_id, periode },
          limit,
          offset,
          order: [["id", "ASC"]],
          include: {
            model: JenisKegiatanRLTigaTitikSebelas,
            attributes: ["nama_jenis_kegiatan"],
          },
        }),

        rlTigaTitikSebelasSatuSehat.count({
          where: { organization_id, periode },
        }),

        getLastSyncInfo(organization_id, periode, "rl_3_11"),
        isSyncing(organization_id, periode, "rl_3_11"),
        ambilIdentitasRsRL311(rsIdFinal),
      ]);

    const identitasFinal = {
      kodeRs:
        identitasRs.kodeRs && identitasRs.kodeRs !== "-"
          ? identitasRs.kodeRs
          : rsIdFinal,

      namaRs:
        identitasRs.namaRs && identitasRs.namaRs !== "-"
          ? identitasRs.namaRs
          : (namaRsUser ?? "-"),

      provinsiNama: identitasRs.provinsiNama ?? "-",
      kabKotaNama: identitasRs.kabKotaNama ?? "-",
    };

    const dataDenganIdentitas = rows.map((row) => ({
      ...row.toJSON(),
      kodeRs: identitasFinal.kodeRs,
      namaRs: identitasFinal.namaRs,
      provinsiNama: identitasFinal.provinsiNama,
      kabKotaNama: identitasFinal.kabKotaNama,
    }));

    res.status(200).send({
      status: true,
      message: rows.length ? "data found" : "data not found",
      data: dataDenganIdentitas,
      rumahSakit: identitasFinal,
      pagination: {
        page,
        limit,
        totalRows,
        totalPages: Math.ceil(totalRows / limit),
      },
      sync: {
        lastSync: syncInfo?.synced_at ?? null,
        status: syncInfo?.status ?? "never",
        totalData: syncInfo?.total_data ?? 0,
        isUpdating: currentlySyncing,
      },
    });

    // Sinkronisasi latar belakang tetap berjalan seperti sebelumnya.
    const stale = await isStale(organization_id, periode, "rl_3_11");

    if (stale && !currentlySyncing) {
      doSync(organization_id, periode, namaRsUser ?? identitasFinal.namaRs)
        .then(() => notifySseClients(organization_id, periode))
        .catch((err) =>
          console.error(`[Sync BG Error] RS ${rsIdFinal}:`, err.message),
        );
    }
  } catch (err) {
    return res.status(500).send({
      status: false,
      message: err.message,
    });
  }
};

// ======================================================
// MANUAL SYNC RL 3.11
// ======================================================

export const manualSyncRL311 = async (req, res) => {
  const { rsId, periode } = req.body;

  if (!rsId || !periode) {
    return res.status(400).send({
      status: false,
      message: "rsId dan periode wajib diisi",
    });
  }

  if (req.user.jenisUserId == 4 && rsId != req.user.satKerId) {
    return res.status(403).send({
      status: false,
      message: "Kode RS Tidak Sesuai",
    });
  }

  try {
    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: rsId },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }

    const namaRs = req.user.jenisUserId == 4 ? req.user.nama : null;
    const organization_id = satuSehat.organization_id?.substring(0, 9);

    const syncing = await isSyncing(organization_id, periode, "rl_3_11");

    if (syncing) {
      return res.status(200).send({
        status: true,
        message: "Sedang dalam proses sync",
      });
    }

    doSync(organization_id, periode, namaRs)
      .then(() => notifySseClients(organization_id, periode))
      .catch((err) => console.error("[Manual Sync Error]", err.message));

    return res.status(200).send({
      status: true,
      message: "Sync dimulai",
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      message: err.message,
    });
  }
};

// ======================================================
// SSE STATUS SYNC RL 3.11
// ======================================================

export const subscribeSyncStatusRL311 = (req, res) => {
  const { rsId, periode } = req.query;
  const key = `${rsId}_${periode}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!sseClients.has(key)) {
    sseClients.set(key, new Set());
  }

  sseClients.get(key).add(res);

  const ping = setInterval(() => {
    res.write(": ping\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(ping);
    sseClients.get(key)?.delete(res);

    if (sseClients.get(key)?.size === 0) {
      sseClients.delete(key);
    }
  });
};

// ======================================================
// PROSES SINKRONISASI SATUSEHAT
// ======================================================

const doSync = async (organization_id, periode, namaRs) => {
  const logEntry = await syncLog.create({
    orgId: organization_id,
    tipe_rl: "rl_3_11",
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL311FromSatuSehat(organization_id, periode);

    if (!rawData || rawData.status === 404 || rawData.error) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
        error_msg: rawData?.message ?? "data not found",
      });

      return { success: true, total: 0 };
    }

    const dataArray = Array.isArray(rawData.data?.kegiatan)
      ? rawData.data.kegiatan
      : [];

    if (dataArray.length === 0) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
      });

      return { success: true, total: 0 };
    }

    const mapped = dataArray.map((item) => ({
      organization_id,
      organization_name: namaRs,
      periode,
      jenis_kegiatan_id: item.jenis_kegiatan_id,
      jumlah: item.jumlah ?? 0,
    }));

    await rlTigaTitikSebelasSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: ["jumlah", "updated_at"],
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

    if (errStatus === 404 || errData?.status === 404) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
        error_msg: errData?.message ?? "data not found",
      });

      return { success: true, total: 0 };
    }

    await logEntry.update({
      status: "failed",
      error_msg: err.message,
    });

    throw err;
  }
};

// ======================================================
// NOTIFIKASI SSE
// ======================================================

const notifySseClients = (rsId, periode) => {
  const key = `${rsId}_${periode}`;
  const clients = sseClients.get(key);

  if (!clients?.size) return;

  const payload = JSON.stringify({
    event: "sync_done",
    rsId,
    periode,
    at: new Date(),
  });

  clients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
};
