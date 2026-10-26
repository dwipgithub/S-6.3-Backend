import axios from "axios";
import Joi from "joi";
import joiDate from "@joi/date";

import { databaseSIRS } from "../config/Database.js";

import {
  rlTigaTitikDuaBelasDetail,
  rlTigaTitikDuaBelasHeader,
  rlTigaTitikDuaBelasSatuSehat,
  get,
  show,
} from "../models/RLTigaTitikDuaBelasModel.js";

import { SpesialisasiRLTigaTitikDuaBelas } from "../models/RLTigaTitikDuaBelasSpesialisasiModel.js";
import { syncLog } from "../models/SyncLogModel.js";
import { satu_sehat_id } from "../models/UserModel.js";

import { fetchRL312FromSatuSehat } from "../services/satusehat.service.js";
import {
  getLastSyncInfo,
  isStale,
  isSyncing,
} from "../services/rlSync.service.js";

// ======================================================
// SSE CLIENTS
// ======================================================

const sseClients = new Map();

// ======================================================
// HELPER IDENTITAS RUMAH SAKIT
// ======================================================

const ambilObjekResponse = (responseData) => {
  let result = responseData;

  for (let i = 0; i < 3; i++) {
    if (
      result &&
      !Array.isArray(result) &&
      typeof result === "object" &&
      result.data !== undefined
    ) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
};

const ambilNamaWilayah = (obj, keys) => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((current, part) => current?.[part], obj);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

const ambilIdentitasRsRL312 = async (rsId, namaRsDefault = "") => {
  const identitas = {
    kodeRs: rsId || "",
    namaRs: namaRsDefault || "",
    provinsiNama: "",
    kabKotaNama: "",
  };

  const baseUrl = process.env.API_FASKES;
  const username = process.env.username_API_FASKES;
  const password = process.env.password_API_FASKES;

  if (!baseUrl || !username || !password) {
    console.warn("[RL 3.12] Konfigurasi API Faskes belum lengkap.");

    return identitas;
  }

  try {
    const loginResponse = await axios.post(
      `${baseUrl}/faskes/login`,
      {
        userName: username,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const token =
      loginResponse.data?.access_token ||
      loginResponse.data?.data?.access_token;

    if (!token) {
      throw new Error("Access token API Faskes tidak ditemukan");
    }

    const rsResponse = await axios.get(
      `${baseUrl}/faskes/rumahsakit/${encodeURIComponent(rsId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const detail = ambilObjekResponse(rsResponse.data);

    if (!detail) {
      return identitas;
    }

    identitas.namaRs =
      detail.nama ||
      detail.namaRs ||
      detail.nama_rumah_sakit ||
      detail.nama_rs ||
      namaRsDefault ||
      "";

    identitas.provinsiNama = ambilNamaWilayah(detail, [
      "provinsiNama",
      "provinsi_nama",
      "namaProvinsi",
      "nama_provinsi",
      "provinsi.nama",
      "provinsi.name",
      "provinsi.label",
    ]);

    identitas.kabKotaNama = ambilNamaWilayah(detail, [
      "kabKotaNama",
      "kab_kota_nama",
      "kabupatenKotaNama",
      "kabupaten_kota_nama",
      "namaKabKota",
      "namaKabupatenKota",
      "nama_kabupaten_kota",
      "kabkota.nama",
      "kabkota.name",
      "kabKota.nama",
      "kabKota.name",
      "kabupatenKota.nama",
      "kabupaten_kota.nama",
    ]);
  } catch (error) {
    // Data RL tetap bisa ditampilkan apabila API identitas gagal.
    console.error(
      `[RL 3.12] Gagal mengambil identitas RS ${rsId}:`,
      error.message,
    );
  }

  return identitas;
};

// ======================================================
// INSERT DATA RL 3.12
// ======================================================

export const insertDataRLTigaTitikDuaBelas = async (req, res) => {
  const schema = Joi.object({
    periodeBulan: Joi.number().greater(0).less(13).required(),
    periodeTahun: Joi.number().greater(2023).required(),
    data: Joi.array()
      .items(
        Joi.object()
          .keys({
            SpesialisasiId: Joi.number().required(),
            Khusus: Joi.number().required(),
            Besar: Joi.number().required(),
            Sedang: Joi.number().required(),
            Kecil: Joi.number().required(),
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

  const periodeBulan = String(req.body.periodeBulan);
  const periodeTahun = String(req.body.periodeTahun);

  const periode = `${periodeTahun}-${periodeBulan}-1`;

  let transaction;

  try {
    transaction = await databaseSIRS.transaction();

    const resultInsertHeader = await rlTigaTitikDuaBelasHeader.create(
      {
        rs_id: req.user.satKerId,
        periode,
        user_id: req.user.id,
      },
      { transaction },
    );

    const dataDetail = req.body.data.map((value) => {
      const total = value.Khusus + value.Besar + value.Sedang + value.Kecil;

      return {
        rs_id: req.user.satKerId,
        periode,
        rl_tiga_titik_dua_belas_id: resultInsertHeader.id,
        rl_tiga_titik_dua_belas_spesialisasi_id: value.SpesialisasiId,
        khusus: value.Khusus,
        besar: value.Besar,
        sedang: value.Sedang,
        kecil: value.Kecil,
        total,
        user_id: req.user.id,
      };
    });

    await rlTigaTitikDuaBelasDetail.bulkCreate(dataDetail, {
      transaction,
      updateOnDuplicate: ["khusus", "besar", "sedang", "kecil", "total"],
    });

    await transaction.commit();

    return res.status(201).send({
      status: true,
      message: "Data Success Created",
      data: {
        id: resultInsertHeader,
      },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).send({
        status: false,
        message: "Gagal Input Data, Spesialisasi Salah.",
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).send({
        status: false,
        message: "Duplicate Data Periode.",
      });
    }

    console.error(error);

    return res.status(400).send({
      status: false,
      message: "Gagal Input Data.",
      error: error.name,
    });
  }
};

// ======================================================
// GET RL 3.12
// ======================================================

export const getRLTigaTitikDuaBelas = (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
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

  const periode = req.query.periode;
  const year = periode.substring(0, 4);
  const month = periode.substring(5, 7);
  const lastDay = new Date(year, month, 0).getDate();

  req.query.periode = `${year}-${month}-${lastDay}`;

  get(req, (err, results) => {
    if (err) {
      return res.status(422).send({
        status: false,
        message: err,
      });
    }

    const data = results || [];

    return res.status(200).send({
      status: true,
      message: data.length ? "data found" : "data not found",
      data,
    });
  });
};

// ======================================================
// SHOW RL 3.12
// ======================================================

export const showRLTigaTitikDuaBelas = (req, res) => {
  show(req.params.id, (err, results) => {
    if (err) {
      return res.status(422).send({
        status: false,
        message: err,
      });
    }

    const data = results?.length ? results[0] : null;

    return res.status(200).send({
      status: true,
      message: data ? "data found" : "data not found",
      data,
    });
  });
};

// ======================================================
// GET DATA RL 3.12 DARI DATABASE INTERNAL
// ======================================================

export const getDataRLTigaTitikDuaBelas = async (req, res) => {
  try {
    const results = await rlTigaTitikDuaBelasHeader.findAll({
      attributes: ["id", "tahun"],
      where: {
        rs_id: req.user.rsId,
        tahun: req.query.tahun,
      },
      include: {
        model: rlTigaTitikDuaBelasDetail,
        attributes: [
          "id",
          "rs_id",
          "tahun",
          "rl_tiga_titik_dua_belas_spesialisasi_id",
          "khusus",
          "besar",
          "sedang",
          "kecil",
          "total",
        ],
        include: {
          model: SpesialisasiRLTigaTitikDuaBelas,
        },
      },
      order: [
        [
          {
            model: rlTigaTitikDuaBelasDetail,
          },
          "rl_tiga_titik_dua_belas_spesialisasi_id",
          "ASC",
        ],
      ],
    });

    return res.status(200).send({
      status: true,
      message: "Data Found",
      data: results,
    });
  } catch (error) {
    return res.status(422).send({
      status: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET DATA RL 3.12 BY ID
// ======================================================

export const getRLTigaTitikDuaBelasById = async (req, res) => {
  try {
    const results = await rlTigaTitikDuaBelasDetail.findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: SpesialisasiRLTigaTitikDuaBelas,
      },
    });

    return res.status(200).send({
      status: true,
      message: results ? "data found" : "data not found",
      data: results,
    });
  } catch (error) {
    return res.status(422).send({
      status: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE DATA RL 3.12
// ======================================================

export const updateDataRLTigaTitikDuaBelas = async (req, res) => {
  const schema = Joi.object({
    khusus: Joi.number().required(),
    besar: Joi.number().required(),
    sedang: Joi.number().required(),
    kecil: Joi.number().required(),
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
    const data = {
      ...req.body,
      total:
        Number(req.body.khusus) +
        Number(req.body.besar) +
        Number(req.body.sedang) +
        Number(req.body.kecil),
    };

    transaction = await databaseSIRS.transaction();

    const update = await rlTigaTitikDuaBelasDetail.update(data, {
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
      transaction,
    });

    if (update[0] === 0) {
      await transaction.rollback();

      return res.status(400).send({
        status: false,
        message: "Gagal Memperbaharui Data",
      });
    }

    await transaction.commit();

    return res.status(201).send({
      status: true,
      message: "Data Diperbaharui",
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error(error);

    return res.status(400).send({
      status: false,
      message: "Gagal Memperbaharui Data",
    });
  }
};

// ======================================================
// DELETE DATA RL 3.12
// ======================================================

export const deleteDataRLTigaTitikDuaBelas = async (req, res) => {
  let transaction;

  try {
    transaction = await databaseSIRS.transaction();

    const count = await rlTigaTitikDuaBelasDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
      transaction,
    });

    if (count === 0) {
      await transaction.rollback();

      return res.status(404).send({
        status: false,
        message: "Gagal Menghapus Data",
      });
    }

    await transaction.commit();

    return res.status(201).send({
      status: true,
      message: "data deleted successfully",
      data: {
        deleted_rows: count,
      },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error(error);

    return res.status(404).send({
      status: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET DATA RL 3.12 SATUSEHAT + IDENTITAS RS
// ======================================================

export const getDataRLTigaTitikDuaBelasWithSatuSehat = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
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

  const namaRsUser = req.user.jenisUserId == 4 ? req.user.nama : "";

  try {
    const offset = (page - 1) * limit;

    // Ambil kode RS dan Organization ID.
    const satuSehat = await satu_sehat_id.findOne({
      where: {
        kode_baru_faskes: rsIdFinal,
      },
      attributes: ["kode_baru_faskes", "organization_id"],
    });

    if (!satuSehat) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }

    const organization_id = satuSehat.organization_id?.substring(0, 9);

    if (!organization_id) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId tidak valid",
      });
    }

    // Ambil identitas RS dari API Faskes.
    const identitasRs = await ambilIdentitasRsRL312(
      satuSehat.kode_baru_faskes || rsIdFinal,
      namaRsUser,
    );

    const where = {
      organization_id,
      periode_laporan: periode,
    };

    const [rows, totalRows, syncInfo, currentlySyncing] = await Promise.all([
      rlTigaTitikDuaBelasSatuSehat.findAll({
        where,
        limit,
        offset,
        order: [["id", "ASC"]],
        include: {
          model: SpesialisasiRLTigaTitikDuaBelas,
          as: "jenis_spesialisasi",
          attributes: ["nama_spesialisasi"],
        },
      }),

      rlTigaTitikDuaBelasSatuSehat.count({
        where,
      }),

      getLastSyncInfo(organization_id, periode, "rl_3_12"),

      isSyncing(organization_id, periode, "rl_3_12"),
    ]);

    // Sisipkan identitas RS ke setiap baris agar dapat digunakan
    // oleh fungsi export Excel pada frontend.
    const dataWithIdentity = rows.map((row) => {
      const item = typeof row.toJSON === "function" ? row.toJSON() : { ...row };

      return {
        ...item,
        kodeRs: identitasRs.kodeRs,
        namaRs: identitasRs.namaRs || item.organization_name || "",
        provinsiNama: identitasRs.provinsiNama,
        kabKotaNama: identitasRs.kabKotaNama,
      };
    });

    // Kirim response sebelum memulai background sync.
    res.status(200).send({
      status: true,
      message: dataWithIdentity.length ? "data found" : "data not found",
      data: dataWithIdentity,
      rumahSakit: identitasRs,
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

    // Periksa apakah data perlu disinkronkan.
    const stale = await isStale(organization_id, periode, "rl_3_12");

    if (stale && !currentlySyncing) {
      doSync(organization_id, periode, identitasRs.namaRs || namaRsUser)
        .then(() => notifySseClients(organization_id, periode))
        .catch((err) => {
          console.error(
            `[RL 3.12 Sync BG Error] RS ${rsIdFinal}:`,
            err.message,
          );
        });
    }
  } catch (error) {
    console.error("[RL 3.12] Error mengambil data:", error);

    if (!res.headersSent) {
      return res.status(500).send({
        status: false,
        message: error.message,
      });
    }
  }
};

// ======================================================
// MANUAL SYNC RL 3.12
// ======================================================

export const manualSyncRL312 = async (req, res) => {
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

  if (!/^\d{4}-\d{2}$/.test(String(periode))) {
    return res.status(400).send({
      status: false,
      message: "Format periode harus YYYY-MM",
    });
  }

  try {
    const satuSehat = await satu_sehat_id.findOne({
      where: {
        kode_baru_faskes: rsId,
      },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }

    const organization_id = satuSehat.organization_id?.substring(0, 9);

    const namaRs = req.user.jenisUserId == 4 ? req.user.nama : "";

    const syncing = await isSyncing(organization_id, periode, "rl_3_12");

    if (syncing) {
      return res.status(200).send({
        status: true,
        message: "Sedang dalam proses sync",
      });
    }

    doSync(organization_id, periode, namaRs)
      .then(() => notifySseClients(organization_id, periode))
      .catch((err) => {
        console.error("[RL 3.12 Manual Sync Error]", err.message);
      });

    return res.status(200).send({
      status: true,
      message: "Sync dimulai",
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

// ======================================================
// SUBSCRIBE STATUS SYNC VIA SSE
// ======================================================

export const subscribeSyncStatusRL312 = (req, res) => {
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
    if (!res.writableEnded) {
      res.write(": ping\n\n");
    }
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
// PROSES SINKRONISASI RL 3.12
// ======================================================

const doSync = async (organization_id, periode, namaRs) => {
  const logEntry = await syncLog.create({
    orgId: organization_id,
    tipe_rl: "rl_3_12",
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL312FromSatuSehat(organization_id, periode);

    if (!rawData || rawData.status === 404 || rawData.error) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
        error_msg: rawData?.message ?? "data not found",
      });

      return {
        success: true,
        total: 0,
      };
    }

    const dataArray = Array.isArray(rawData.data?.spesialisasi)
      ? rawData.data.spesialisasi
      : [];

    if (dataArray.length === 0) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
      });

      return {
        success: true,
        total: 0,
      };
    }

    const mapped = dataArray
      .filter((item) => item.spesialisasi_id != null)
      .map((item) => ({
        organization_id,
        organization_name: namaRs || "",
        periode_laporan: periode,
        jenis_spesialisasi_id: item.spesialisasi_id,
        khusus: item.khusus ?? 0,
        besar: item.besar ?? 0,
        sedang: item.sedang ?? 0,
        kecil: item.kecil ?? 0,
        total:
          item.total ??
          Number(item.khusus ?? 0) +
            Number(item.besar ?? 0) +
            Number(item.sedang ?? 0) +
            Number(item.kecil ?? 0),
      }));

    await rlTigaTitikDuaBelasSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: [
        "organization_name",
        "khusus",
        "besar",
        "sedang",
        "kecil",
        "total",
        "updated_at",
      ],
    });

    await logEntry.update({
      status: "success",
      total_data: mapped.length,
      synced_at: new Date(),
    });

    return {
      success: true,
      total: mapped.length,
    };
  } catch (error) {
    const errStatus = error.response?.status || error.status;

    const errData = error.response?.data;

    if (errStatus === 404 || errData?.status === 404) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
        error_msg: errData?.message ?? "data not found",
      });

      return {
        success: true,
        total: 0,
      };
    }

    await logEntry.update({
      status: "failed",
      error_msg: error.message,
    });

    throw error;
  }
};

// ======================================================
// NOTIFIKASI SSE
// ======================================================

const notifySseClients = (rsId, periode) => {
  const key = `${rsId}_${periode}`;
  const clients = sseClients.get(key);

  if (!clients?.size) {
    return;
  }

  const payload = JSON.stringify({
    event: "sync_done",
    rsId,
    periode,
    at: new Date(),
  });

  clients.forEach((client) => {
    if (!client.writableEnded) {
      client.write(`data: ${payload}\n\n`);
    }
  });
};
