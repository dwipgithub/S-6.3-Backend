import axios from "axios";
import Joi from "joi";

import { databaseSIRS } from "../config/Database.js";

import {
  get,
  show,
  rlTigaTitikDelapanBelas,
  rlTigaTitikDelapanBelasDetail,
  rlTigaTitikDelapanBelasSatuSehat,
  golonganObatRLTigaTitikDelapanBelas,
} from "../models/RLTigaTitikDelapanBelasModel.js";

import { satu_sehat_id } from "../models/UserModel.js";
import { syncLog } from "../models/SyncLogModel.js";

import {
  getLastSyncInfo,
  isStale,
  isSyncing,
} from "../services/rlSync.service.js";

import { fetchRL318FromSatuSehat } from "../services/satusehat.service.js";

// ==========================================================
// KONFIGURASI SSE
// ==========================================================

const sseClients = new Map();

// ==========================================================
// HELPER API FASKES
// ==========================================================

const ambilSemuaRsRL318 = async (baseUrl, token, params = {}) => {
  const hasil = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axios.get(`${baseUrl}/faskes/rumahsakit`, {
      params: {
        ...params,
        page,
        limit: 1000,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    const body = response.data;
    const daftar = body?.data;

    if (Array.isArray(daftar)) {
      hasil.push(...daftar);
    }

    totalPages = Number(body?.pagination?.totalNumberOfPages ?? 1);
    page++;
  } while (page <= totalPages);

  return hasil;
};

// ==========================================================
// IDENTITAS RUMAH SAKIT DARI API FASKES
// Mengikuti pola yang digunakan pada controller RL 3.10
// ==========================================================

const ambilIdentitasRsRL318 = async (kodeRs, namaRsUser = "") => {
  const identitasDefault = {
    kodeRs: kodeRs ?? "-",
    namaRs: namaRsUser || "-",
    provinsiNama: "-",
    kabKotaNama: "-",
  };

  if (!kodeRs) {
    return identitasDefault;
  }

  const baseUrl = process.env.API_FASKES;
  const username = process.env.username_API_FASKES;
  const password = process.env.password_API_FASKES;

  if (!baseUrl || !username || !password) {
    console.warn("[RL 3.18] Konfigurasi API FASKES belum lengkap.");
    return identitasDefault;
  }

  const ambilNama = (...values) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }

    return "";
  };

  try {
    // Login API Faskes.
    // Gunakan userName sesuai implementasi RL 3.10.
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
      loginResponse.data?.access_token ??
      loginResponse.data?.data?.access_token;

    if (!token) {
      throw new Error("Access token API FASKES tidak ditemukan.");
    }

    let rsDetail = null;
    let rsDariDaftar = null;

    // ------------------------------------------------------
    // 1. Ambil detail rumah sakit berdasarkan kode RS
    // ------------------------------------------------------

    try {
      const detailResponse = await axios.get(
        `${baseUrl}/faskes/rumahsakit/${encodeURIComponent(kodeRs)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        },
      );

      const body = detailResponse.data;

      rsDetail = body?.data?.data ?? body?.data ?? body;

      if (Array.isArray(rsDetail)) {
        rsDetail = rsDetail[0] ?? null;
      }
    } catch (detailError) {
      console.warn(
        `[RL 3.18] Gagal mengambil detail RS ${kodeRs}:`,
        detailError.response?.data ?? detailError.message,
      );
    }

    // ------------------------------------------------------
    // 2. Fallback: cari rumah sakit dari endpoint daftar RS
    // ------------------------------------------------------

    try {
      const daftarRs = await ambilSemuaRsRL318(baseUrl, token);

      rsDariDaftar =
        daftarRs.find((rs) => {
          const kode =
            rs?.kode ?? rs?.kodeRs ?? rs?.kode_rs ?? rs?.kode_baru_faskes;

          return String(kode ?? "") === String(kodeRs);
        }) ?? null;
    } catch (listError) {
      console.warn(
        "[RL 3.18] Gagal mengambil daftar RS:",
        listError.response?.data ?? listError.message,
      );
    }

    const detail = rsDetail ?? {};
    const daftar = rsDariDaftar ?? {};

    // ------------------------------------------------------
    // 3. Ambil nama provinsi
    // ------------------------------------------------------

    const provinsiNama = ambilNama(
      daftar.provinsiNama,
      daftar.provinsi_nama,
      daftar.namaProvinsi,
      daftar.nama_provinsi,
      daftar.provinsi?.nama,
      daftar.provinsi?.name,
      typeof daftar.provinsi === "string" ? daftar.provinsi : "",

      detail.provinsiNama,
      detail.provinsi_nama,
      detail.namaProvinsi,
      detail.nama_provinsi,
      detail.provinsi?.nama,
      detail.provinsi?.name,
      typeof detail.provinsi === "string" ? detail.provinsi : "",
    );

    // ------------------------------------------------------
    // 4. Ambil nama kabupaten/kota
    // ------------------------------------------------------

    const kabKotaNama = ambilNama(
      daftar.kabKotaNama,
      daftar.kab_kota_nama,
      daftar.kabupatenKotaNama,
      daftar.kabupaten_kota_nama,
      daftar.namaKabKota,
      daftar.namaKabupatenKota,
      daftar.kabkota?.nama,
      daftar.kabkota?.name,
      daftar.kabKota?.nama,
      daftar.kabKota?.name,
      daftar.kabupatenKota?.nama,
      daftar.kabupaten_kota?.nama,
      typeof daftar.kabupaten_kota === "string" ? daftar.kabupaten_kota : "",

      detail.kabKotaNama,
      detail.kab_kota_nama,
      detail.kabupatenKotaNama,
      detail.kabupaten_kota_nama,
      detail.namaKabKota,
      detail.namaKabupatenKota,
      detail.kabkota?.nama,
      detail.kabkota?.name,
      detail.kabKota?.nama,
      detail.kabKota?.name,
      detail.kabupatenKota?.nama,
      detail.kabupaten_kota?.nama,
      typeof detail.kabupaten_kota === "string" ? detail.kabupaten_kota : "",
    );

    // ------------------------------------------------------
    // 5. Susun identitas rumah sakit
    // ------------------------------------------------------

    const namaRs = ambilNama(
      detail.nama,
      detail.namaRs,
      detail.nama_rumah_sakit,
      detail.nama_rs,
      detail.nama_faskes,

      daftar.nama,
      daftar.namaRs,
      daftar.nama_rumah_sakit,
      daftar.nama_rs,

      namaRsUser,
    );

    const identitasRs = {
      kodeRs: ambilNama(
        detail.kode,
        detail.kodeRs,
        detail.kode_rs,
        detail.kode_rumah_sakit,

        daftar.kode,
        daftar.kodeRs,
        daftar.kode_rs,
        daftar.kode_baru_faskes,

        kodeRs,
      ),

      namaRs: namaRs || "-",
      provinsiNama: provinsiNama || "-",
      kabKotaNama: kabKotaNama || "-",
    };

    if (identitasRs.provinsiNama === "-" || identitasRs.kabKotaNama === "-") {
      console.warn(
        `[RL 3.18] Identitas wilayah belum lengkap untuk RS ${kodeRs}.`,
        {
          detailDitemukan: Boolean(rsDetail),
          daftarDitemukan: Boolean(rsDariDaftar),
          provinsiNama: identitasRs.provinsiNama,
          kabKotaNama: identitasRs.kabKotaNama,
        },
      );
    }

    return identitasRs;
  } catch (error) {
    console.error(
      `[RL 3.18] Gagal mengambil identitas RS ${kodeRs}:`,
      error.response?.data ?? error.message,
    );

    return identitasDefault;
  }
};

// ==========================================================
// GET DATA RL 3.18 MANUAL
// ==========================================================

export const getRLTigaTitikDelapanBelas = (req, res) => {
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
        message: err.message ?? "Gagal mengambil data RL 3.18.",
      });
    }

    const data = results ?? [];

    return res.status(200).send({
      status: true,
      message: data.length ? "data found" : "data not found",
      data,
    });
  });
};

// ==========================================================
// DETAIL RL 3.18
// ==========================================================

export const showRLTigaTitikDelapanBelas = (req, res) => {
  show(req.params.id, (err, results) => {
    if (err) {
      return res.status(422).send({
        status: false,
        message: err.message ?? err,
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

// ==========================================================
// INSERT DATA RL 3.18 MANUAL
// ==========================================================

export const insertDataRLTigaTitikDelapanBelas = async (req, res) => {
  const schema = Joi.object({
    periodeTahun: Joi.number().greater(2022).required(),

    data: Joi.array()
      .items(
        Joi.object({
          golonganObatId: Joi.number(),
          rawatJalan: Joi.number().min(0),
          igd: Joi.number().min(0),
          rawatInap: Joi.number().min(0),
        }).required(),
      )
      .required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }

  const periode = String(req.body.periodeTahun);
  const transaction = await databaseSIRS.transaction();

  try {
    const resultInsertHeader = await rlTigaTitikDelapanBelas.create(
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
      rl_tiga_titik_delapan_belas_id: resultInsertHeader.id,
      golongan_obat_id: value.golonganObatId,
      rawat_jalan: value.rawatJalan,
      igd: value.igd,
      rawat_inap: value.rawatInap,
      user_id: req.user.id,
    }));

    await rlTigaTitikDelapanBelasDetail.bulkCreate(dataDetail, {
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

    console.error("[RL 3.18] Gagal menyimpan data:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).send({
        status: false,
        message: "Duplicate Entry",
      });
    }

    return res.status(400).send({
      status: false,
      message: error.message ?? "Gagal menyimpan data RL 3.18.",
    });
  }
};

// ==========================================================
// UPDATE DATA RL 3.18 MANUAL
// ==========================================================

export const updateRLTigaTitikDelapanBelas = async (req, res) => {
  try {
    const update = await rlTigaTitikDelapanBelasDetail.update(
      {
        golongan_obat_id: req.body.golonganObatId,
        rawat_jalan: req.body.rawatJalan,
        igd: req.body.igd,
        rawat_inap: req.body.rawatInap,
        user_id: req.user.id,
      },
      {
        where: {
          id: req.params.id,
          rs_id: req.user.satKerId,
        },
      },
    );

    return res.status(200).json({
      status: true,
      message: update,
    });
  } catch (error) {
    console.error("[RL 3.18] Gagal memperbarui data:", error.message);

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================================
// DELETE DATA RL 3.18 MANUAL
// ==========================================================

export const deleteRLTigaTitikDelapanBelas = async (req, res) => {
  try {
    const count = await rlTigaTitikDelapanBelasDetail.destroy({
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

    return res.status(200).send({
      status: true,
      message: "data deleted successfully",
      data: {
        deleted_rows: count,
      },
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message ?? "Gagal menghapus data RL 3.18.",
    });
  }
};

// ==========================================================
// GET DATA RL 3.18 SATUSEHAT + IDENTITAS RS + STATUS SYNC
// ==========================================================

export const getDataRLTigaTitikDelapanBelasWithSatuSehat = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string().min(4).max(4).required(),
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
  const namaRs = req.user.jenisUserId == 4 ? req.user.nama : null;

  try {
    const offset = (page - 1) * limit;

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
        message: "OrganizationId Tidak Valid",
      });
    }

    const [rows, totalRows, syncInfo, currentlySyncing, identitasRs] =
      await Promise.all([
        rlTigaTitikDelapanBelasSatuSehat.findAll({
          where: {
            organization_id,
            periode,
          },
          limit,
          offset,
          order: [["id", "ASC"]],
          include: {
            model: golonganObatRLTigaTitikDelapanBelas,
            attributes: ["nama"],
          },
        }),

        rlTigaTitikDelapanBelasSatuSehat.count({
          where: {
            organization_id,
            periode,
          },
        }),

        getLastSyncInfo(organization_id, periode, "rl_3_18"),

        isSyncing(organization_id, periode, "rl_3_18"),

        ambilIdentitasRsRL318(
          satuSehat.kode_baru_faskes || rsIdFinal,
          namaRs || "",
        ),
      ]);

    const enrichedRows = rows.map((row) => {
      const item = typeof row.toJSON === "function" ? row.toJSON() : row;

      return {
        ...item,
        kodeRs: identitasRs.kodeRs,
        namaRs:
          identitasRs.namaRs !== "-"
            ? identitasRs.namaRs
            : (item.organization_name ?? namaRs ?? "-"),
        provinsiNama: identitasRs.provinsiNama,
        kabKotaNama: identitasRs.kabKotaNama,
      };
    });

    // Kirim respons terlebih dahulu agar permintaan data tidak menunggu sync.
    res.status(200).send({
      status: true,
      message: enrichedRows.length ? "data found" : "data not found",
      data: enrichedRows,
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

    // Pertahankan sinkronisasi otomatis jika data sudah kedaluwarsa.
    const stale = await isStale(organization_id, periode, "rl_3_18");

    if (stale && !currentlySyncing) {
      doSync(organization_id, periode, namaRs)
        .then(() => notifySseClients(organization_id, periode))
        .catch((err) =>
          console.error(
            `[RL 3.18 Sync BG Error] RS ${rsIdFinal}:`,
            err.message,
          ),
        );
    }
  } catch (err) {
    console.error("[RL 3.18] Gagal mengambil data SATUSEHAT:", err);

    if (!res.headersSent) {
      return res.status(500).send({
        status: false,
        message: err.message,
      });
    }
  }
};

// ==========================================================
// MANUAL SYNC RL 3.18
// ==========================================================

export const manualSyncRL318 = async (req, res) => {
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

    const namaRs = req.user.jenisUserId == 4 ? req.user.nama : null;
    const organization_id = satuSehat.organization_id?.substring(0, 9);

    if (!organization_id) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId Tidak Valid",
      });
    }

    const syncing = await isSyncing(organization_id, periode, "rl_3_18");

    if (syncing) {
      return res.status(200).send({
        status: true,
        message: "Sedang dalam proses sync",
      });
    }

    doSync(organization_id, String(periode), namaRs)
      .then(() => notifySseClients(organization_id, String(periode)))
      .catch((err) =>
        console.error("[RL 3.18 Manual Sync Error]", err.message),
      );

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

// ==========================================================
// SSE STATUS SYNC RL 3.18
// ==========================================================

export const subscribeSyncStatusRL318 = (req, res) => {
  const { rsId, periode } = req.query;

  if (!rsId || !periode) {
    return res.status(400).send({
      status: false,
      message: "rsId dan periode wajib diisi",
    });
  }

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

    const clients = sseClients.get(key);

    if (clients) {
      clients.delete(res);

      if (clients.size === 0) {
        sseClients.delete(key);
      }
    }
  });
};

// ==========================================================
// PROSES SINKRONISASI RL 3.18
// ==========================================================

const doSync = async (organization_id, periode, namaRs) => {
  const logEntry = await syncLog.create({
    orgId: organization_id,
    tipe_rl: "rl_3_18",
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL318FromSatuSehat(organization_id, periode);

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
      organization_name: namaRs,
      periode,
      golongan_obat_id: item.golongan_obat_id,
      rawat_inap: item.rawat_inap ?? 0,
      rawat_jalan: item.rawat_jalan ?? 0,
      igd: item.igd ?? 0,
      total_resep: item.total_resep ?? 0,
    }));

    await rlTigaTitikDelapanBelasSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: [
        "rawat_inap",
        "rawat_jalan",
        "igd",
        "total_resep",
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

      return {
        success: true,
        total: 0,
      };
    }

    await logEntry.update({
      status: "failed",
      error_msg: err.message,
    });

    throw err;
  }
};

// ==========================================================
// NOTIFIKASI CLIENT SSE
// ==========================================================

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
