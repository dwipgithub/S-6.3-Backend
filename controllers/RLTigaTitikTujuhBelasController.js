import axios from "axios";
import Joi from "joi";
import joiDate from "@joi/date";

import { databaseSIRS } from "../config/Database.js";

import {
  get,
  show,
  rlTigaTitikTujuhBelasDetail,
  rlTigaTitikTujuhBelas,
  rlTigaTitikTujuhBelasSatuSehat,
} from "../models/RLTigaTitikTitikTujuhBelasModel.js";

import { satu_sehat_id } from "../models/UserModel.js";
import { syncLog } from "../models/SyncLogModel.js";

import {
  getLastSyncInfo,
  isStale,
  isSyncing,
} from "../services/rlSync.service.js";

import { fetchRL317FromSatuSehat } from "../services/satusehat.service.js";

import { golonganObatRLTigaTitikTujuhBelas } from "../models/RLTigaTitikTujuhBelasGolonganObatModel.js";

const sseClients = new Map();

// ======================================================
// HELPER IDENTITAS RUMAH SAKIT DARI API FASKES
// ======================================================

const ambilObjekResponseRL317 = (responseData) => {
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

const ambilNamaWilayahRL317 = (obj, keys) => {
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

const ambilIdentitasRsRL317 = async (rsId, namaRsDefault = "") => {
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
    console.warn("[RL 3.17] Konfigurasi API Faskes belum lengkap.");

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

    const response = await axios.get(
      `${baseUrl}/faskes/rumahsakit/${encodeURIComponent(rsId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const detail = ambilObjekResponseRL317(response.data);

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

    identitas.provinsiNama = ambilNamaWilayahRL317(detail, [
      "provinsiNama",
      "provinsi_nama",
      "namaProvinsi",
      "nama_provinsi",
      "provinsi.nama",
      "provinsi.name",
      "provinsi.label",
    ]);

    identitas.kabKotaNama = ambilNamaWilayahRL317(detail, [
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
    // Data RL tetap dapat diakses jika API identitas gagal.
    console.error(
      `[RL 3.17] Gagal mengambil identitas RS ${rsId}:`,
      error.message,
    );
  }

  return identitas;
};

// ======================================================
// GET RL 3.17
// ======================================================

export const getRLTigaTitikTujuhBelas = (req, res) => {
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
      return res.status(422).send({
        status: false,
        message: err.message || err,
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
// SHOW RL 3.17
// ======================================================

export const showRLTigaTitikTujuhBelas = (req, res) => {
  show(req.params.id, (err, results) => {
    if (err) {
      return res.status(422).send({
        status: false,
        message: err.message || err,
      });
    }

    const data = results && results.length ? results[0] : null;

    return res.status(200).send({
      status: true,
      message: data ? "data found" : "data not found",
      data,
    });
  });
};

// ======================================================
// INSERT DATA RL 3.17
// ======================================================

export const insertDataRLTigaTitikTujuhBelas = async (req, res) => {
  const schema = Joi.object({
    periodeTahun: Joi.number().greater(2022).required(),
    data: Joi.array()
      .items(
        Joi.object()
          .keys({
            golonganObatId: Joi.number(),
            jumlahItemObat: Joi.number().min(0),
            jumlahItemObatRs: Joi.number().min(0),
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

  const periode = String(req.body.periodeTahun);

  const transaction = await databaseSIRS.transaction();

  try {
    const resultInsertHeader = await rlTigaTitikTujuhBelas.create(
      {
        rs_id: req.user.satKerId,
        periode,
        user_id: req.user.id,
      },
      {
        transaction,
      },
    );

    const dataDetail = req.body.data.map((value) => ({
      rs_id: req.user.satKerId,
      periode,
      rl_tiga_titik_tujuh_belas_id: resultInsertHeader.id,
      golongan_obat_id: value.golonganObatId,
      jumlah_item_obat: value.jumlahItemObat,
      jumlah_item_obat_rs: value.jumlahItemObatRs,
      user_id: req.user.id,
    }));

    await rlTigaTitikTujuhBelasDetail.bulkCreate(dataDetail, {
      transaction,
    });

    await transaction.commit();

    return res.status(201).send({
      status: true,
      message: "data created",
      data: {
        id: resultInsertHeader.id,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).send({
        status: false,
        message: "Duplicate Entry",
      });
    }

    return res.status(400).send({
      status: false,
      message: error.message || error,
    });
  }
};

// ======================================================
// UPDATE DATA RL 3.17
// ======================================================

export const updateRLTigaTitikTujuhBelas = async (req, res) => {
  try {
    const update = await rlTigaTitikTujuhBelasDetail.update(
      {
        golongan_obat_id: req.body.golonganObatId,
        jumlah_item_obat: req.body.jumlahItemObat,
        jumlah_item_obat_rs: req.body.jumlahItemObatRs,
        user_id: req.user.id,
      },
      {
        where: {
          id: req.params.id,
          rs_id: req.user.satKerId,
        },
      },
    );

    if (update[0] === 0) {
      return res.status(404).json({
        status: false,
        message: "Data tidak ditemukan atau tidak berubah",
      });
    }

    return res.status(200).json({
      status: true,
      message: update,
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE DATA RL 3.17
// ======================================================

export const deleteRLTigaTitikTujuhBelas = async (req, res) => {
  try {
    const count = await rlTigaTitikTujuhBelasDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
    });

    if (count === 0) {
      return res.status(404).send({
        status: false,
        message: "Data Not Found",
        data: {
          deleted_rows: count,
        },
      });
    }

    return res.status(201).send({
      status: true,
      message: "data deleted successfully",
      data: {
        deleted_rows: count,
      },
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message || error,
    });
  }
};

// ======================================================
// GET DATA RL 3.17 SATUSEHAT + IDENTITAS RS
// ======================================================

export const getDataRLTigaTitikTujuhBelasWithSatuSehat = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string()
      .pattern(/^\d{4}$/)
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

  // Validasi akses akun rumah sakit.
  if (req.user.jenisUserId == 4 && rsId != req.user.satKerId) {
    return res.status(403).send({
      status: false,
      message: "Kode RS Tidak Sesuai",
    });
  }

  const rsIdFinal = req.user.jenisUserId == 4 ? req.user.satKerId : rsId;

  const namaRsDefault = req.user.jenisUserId == 4 ? req.user.nama : "";

  try {
    const offset = (page - 1) * limit;

    // Ambil mapping kode RS dan Organization ID.
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

    // Ambil identitas rumah sakit dari API Faskes.
    const identitasRs = await ambilIdentitasRsRL317(
      satuSehat.kode_baru_faskes || rsIdFinal,
      namaRsDefault,
    );

    const where = {
      organization_id,
      periode,
    };

    // Ambil data, jumlah data, dan status sinkronisasi.
    const [rows, totalRows, syncInfo, currentlySyncing] = await Promise.all([
      rlTigaTitikTujuhBelasSatuSehat.findAll({
        where,
        limit,
        offset,
        order: [["id", "ASC"]],
        include: {
          model: golonganObatRLTigaTitikTujuhBelas,
          attributes: ["nama"],
        },
      }),

      rlTigaTitikTujuhBelasSatuSehat.count({
        where,
      }),

      getLastSyncInfo(organization_id, periode, "rl_3_17"),

      isSyncing(organization_id, periode, "rl_3_17"),
    ]);

    // Tambahkan identitas RS pada setiap baris data.
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

    return res.status(200).send({
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
  } catch (error) {
    console.error("[RL 3.17] Gagal mengambil data:", error);

    if (!res.headersSent) {
      return res.status(500).send({
        status: false,
        message: error.message,
      });
    }
  }

  // Tidak dijalankan di sini karena response sudah dikirim.
  // Sinkronisasi otomatis ditangani sebelum response jika diperlukan.
};

// ======================================================
// MANUAL SYNC RL 3.17
// ======================================================

export const manualSyncRL317 = async (req, res) => {
  const { rsId, periode } = req.body;

  if (!rsId || !periode) {
    return res.status(400).send({
      status: false,
      message: "rsId dan periode wajib diisi",
    });
  }

  if (!/^\d{4}$/.test(String(periode))) {
    return res.status(400).send({
      status: false,
      message: "Format periode harus YYYY",
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

    const syncing = await isSyncing(organization_id, periode, "rl_3_17");

    if (syncing) {
      return res.status(200).send({
        status: true,
        message: "Sedang dalam proses sync",
      });
    }

    doSync(organization_id, periode, namaRs)
      .then(() => notifySseClients(organization_id, periode))
      .catch((error) => {
        console.error("[Manual Sync Error]", error.message);
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

export const subscribeSyncStatusRL317 = (req, res) => {
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
// PROSES SINKRONISASI RL 3.17
// ======================================================

const doSync = async (organization_id, periode, namaRs) => {
  const logEntry = await syncLog.create({
    orgId: organization_id,
    tipe_rl: "rl_3_17",
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL317FromSatuSehat(organization_id, periode);

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

    const dataArray = Array.isArray(rawData.data?.golongan_obat)
      ? rawData.data.golongan_obat
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

    const mapped = dataArray.map((item) => ({
      organization_id,
      organization_name: namaRs || "",
      periode,
      golongan_obat_id: item.golongan_obat_id,
      jumlah_item_obat: item.jumlah_item_obat ?? 0,
      jumlah_item_obat_rs: item.jumlah_item_obat_rs ?? 0,
    }));

    await rlTigaTitikTujuhBelasSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: [
        "organization_name",
        "jumlah_item_obat",
        "jumlah_item_obat_rs",
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
