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

  const { error, value } = schema.validate(req.body);

  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }

  const periodeBulan = String(req.body.periodeBulan);
  const periodeTahun = String(req.body.periodeTahun);
  const periode = periodeTahun
    .concat("-")
    .concat(periodeBulan)
    .concat("-")
    .concat("1");

  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
    const resultInsertHeader = await rlTigaTitikDuaBelasHeader.create(
      {
        rs_id: req.user.satKerId,
        periode: periode,
        user_id: req.user.id,
      },
      {
        transaction,
      },
    );

    const dataDetail = req.body.data.map((value, index) => {
      let totalall = value.Khusus + value.Besar + value.Sedang + value.Kecil;
      return {
        rs_id: req.user.satKerId,
        periode: periode,
        rl_tiga_titik_dua_belas_id: resultInsertHeader.id,
        rl_tiga_titik_dua_belas_spesialisasi_id: value.SpesialisasiId,
        khusus: value.Khusus,
        besar: value.Besar,
        sedang: value.Sedang,
        kecil: value.Kecil,
        total: totalall,
        user_id: req.user.id,
      };
    });

    const resultInsertDetail = await rlTigaTitikDuaBelasDetail.bulkCreate(
      dataDetail,
      {
        transaction,
        updateOnDuplicate: ["khusus", "besar", "sedang", "kecil", "total"],
      },
    );

    await transaction.commit();
    res.status(201).send({
      status: true,
      message: "Data Success Created",
      data: {
        id: resultInsertHeader,
      },
    });
  } catch (error) {
    if (transaction) {
      if (error.name == "SequelizeForeignKeyConstraintError") {
        res.status(400).send({
          status: false,
          message: "Gagal Input Data, Spesialisasi Salah.",
        });
      } else if (error.name == "SequelizeUniqueConstraintError") {
        res.status(400).send({
          status: false,
          message: "Duplicate Data Periode.",
        });
      } else {
        res.status(400).send({
          status: false,
          message: "Gagal Input Data.",
          error: error.name,
        });
        console.log(error);
      }
      await transaction.rollback();
    }
  }
};

export const getRLTigaTitikDuaBelas = (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
    page: Joi.number(),
    limit: Joi.number(),
  });

  const { error, value } = schema.validate(req.query);
  const periode = req.query.periode;
  const year = periode.substring(0, 4);
  const month = periode.substring(5, 7);
  const lastDay = new Date(year, month, 0).getDate();

  req.query.periode = `${year}-${month}-${lastDay}`;

  if (error) {
    res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }

  get(req, (err, results) => {
    // console.log(results);
    const message = results.length ? "data found" : "data not found";
    res.status(200).send({
      status: true,
      message: message,
      data: results,
    });
  });
};

export const showRLTigaTitikDuaBelas = (req, res) => {
  show(req.params.id, (err, results) => {
    if (err) {
      res.status(422).send({
        status: false,
        message: err,
      });
      return;
    }

    const message = results.length ? "data found" : "data not found";
    const data = results.length ? results[0] : null;

    res.status(200).send({
      status: true,
      message: message,
      data: data,
    });
  });
};

export const getDataRLTigaTitikDuaBelas = async (req, res) => {
  rlTigaTitikDuaBelasHeader
    .findAll({
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
      return;
    });
};

export const getRLTigaTitikDuaBelasById = async (req, res) => {
  rlTigaTitikDuaBelasDetail
    .findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: SpesialisasiRLTigaTitikDuaBelas,
      },
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
      return;
    });
};

export const updateDataRLTigaTitikDuaBelas = async (req, res) => {
  const schema = Joi.object({
    khusus: Joi.number().required(),
    besar: Joi.number().required(),
    sedang: Joi.number().required(),
    kecil: Joi.number().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }
  let transaction;
  try {
    const data = req.body;
    data["total"] = data.khusus + data.besar + data.sedang + data.kecil;
    try {
      transaction = await databaseSIRS.transaction();
      const update = await rlTigaTitikDuaBelasDetail.update(data, {
        where: {
          id: req.params.id,
          rs_id: req.user.satKerId,
        },
      });
      if (update[0] != 0) {
        await transaction.commit();
        res.status(201).send({
          status: true,
          message: "Data Diperbaharui",
        });
      } else {
        await transaction.rollback();
        res.status(400).send({
          status: false,
          message: "Gagal Memperbaharui Data",
        });
      }
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(400).send({
        status: false,
        message: "Gagal Memperbaharui Data",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).send({
      status: false,
      message: "Gagal Memperbaharui Data",
    });
  }
};

export const deleteDataRLTigaTitikDuaBelas = async (req, res) => {
  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
    const count = await rlTigaTitikDuaBelasDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
    });
    if (count != 0) {
      await transaction.commit();
      res.status(201).send({
        status: true,
        message: "data deleted successfully",
        data: {
          deleted_rows: count,
        },
      });
    } else {
      await transaction.rollback();
      res.status(404).send({
        status: false,
        message: "Gagal Menghapus Data",
      });
    }
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    res.status(404).send({
      status: false,
      message: error,
    });
  }
};

export const getDataRLTigaTitikDuaBelasWithSatuSehat = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string().min(7).max(7).required(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(200).default(50),
  });

  const { error, value } = schema.validate(req.query);
  if (error)
    return res
      .status(400)
      .send({ status: false, message: error.details[0].message });

  const { rsId, periode, page, limit } = value;

  if (req.user.jenisUserId == 4 && rsId != req.user.satKerId) {
    return res
      .status(403)
      .send({ status: false, message: "Kode RS Tidak Sesuai" });
  }

  const rsIdFinal = req.user.jenisUserId == 4 ? req.user.satKerId : rsId;
  const namaRs = req.user.jenisUserId == 4 ? req.user.nama : null;

  try {
    const offset = (page - 1) * limit;

    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: rsIdFinal },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res
        .status(404)
        .send({ status: false, message: "OrganizationId Tidak Ada" });
    }

    const organization_id = satuSehat.organization_id?.substring(0, 9);

    // Jalankan semua query DB + cek sync status secara paralel
    const [rows, totalRows, syncInfo, currentlySyncing] = await Promise.all([
      rlTigaTitikDuaBelasSatuSehat.findAll({
        where: { organization_id, periode_laporan: periode },
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
        where: { organization_id, periode_laporan: periode },
      }),
      getLastSyncInfo(organization_id, periode, "rl_3_12"),
      isSyncing(organization_id, periode, "rl_3_12"), // ← cukup panggil sekali di sini
    ]);

    // Kirim response ke FE
    res.status(200).send({
      status: true,
      message: rows.length ? "data found" : "data not found",
      data: rows,
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
        isUpdating: currentlySyncing, // ← pakai hasil yang sudah ada
      },
    });

    // Cek stale & trigger background sync jika perlu
    const stale = await isStale(organization_id, periode, "rl_3_12");

    if (stale && !currentlySyncing) {
      doSync(organization_id, periode, namaRs)
        .then(() => notifySseClients(organization_id, periode))
        .catch((err) =>
          console.error(`[Sync BG Error] RS ${rsIdFinal}:`, err.message),
        );
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

export const manualSyncRL312 = async (req, res) => {
  const { rsId, periode } = req.body;

  if (!rsId || !periode) {
    return res
      .status(400)
      .send({ status: false, message: "rsId dan periode wajib diisi" });
  }

  // Validasi akses jika user RS (jenisUserId == 4)
  if (req.user.jenisUserId == 4 && rsId != req.user.satKerId) {
    return res
      .status(403)
      .send({ status: false, message: "Kode RS Tidak Sesuai" });
  }

  try {
    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: rsId },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res
        .status(404)
        .send({ status: false, message: "OrganizationId Tidak Ada" });
    }

    const namaRs = req.user.jenisUserId == 4 ? req.user.nama : null;
    const organization_id = satuSehat.organization_id?.substring(0, 9);

    // Cegah dobel sync
    const syncing = await isSyncing(organization_id, periode, "rl_3_12");
    if (syncing) {
      return res
        .status(200)
        .send({ status: true, message: "Sedang dalam proses sync" });
    }

    // Langsung sync tanpa cek isStale (ini manual, jadi force)
    doSync(organization_id, periode, namaRs)
      .then(() => notifySseClients(organization_id, periode))
      .catch((err) => console.error("[Manual Sync Error]", err.message));

    return res.status(200).send({ status: true, message: "Sync dimulai" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

export const subscribeSyncStatusRL312 = (req, res) => {
  const { rsId, periode } = req.query;
  const key = `${rsId}_${periode}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Simpan koneksi
  if (!sseClients.has(key)) sseClients.set(key, new Set());
  sseClients.get(key).add(res);

  // Ping tiap 30 detik supaya koneksi tidak putus
  const ping = setInterval(() => res.write(": ping\n\n"), 30000);

  req.on("close", () => {
    clearInterval(ping);
    sseClients.get(key)?.delete(res);
  });
};

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
        status: "success", // tetap success, bukan failed
        total_data: 0,
        synced_at: new Date(),
        error_msg: rawData?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    const dataArray = Array.isArray(rawData.data.spesialisasi)
      ? rawData.data.spesialisasi
      : [];

    if (dataArray.length === 0) {
      await logEntry.update({
        status: "success",
        total_data: 0,
        synced_at: new Date(),
      });
      return { success: true, total: 0 };
    }

    const mapped = dataArray
      .filter((item) => item.spesialisasi_id != null)
      .map((item) => ({
        organization_id,
        organization_name: namaRs,
        periode_laporan: periode,
        jenis_spesialisasi_id: item.spesialisasi_id,
        khusus: item.khusus ?? 0,
        besar: item.besar ?? 0,
        sedang: item.sedang ?? 0,
        kecil: item.kecil ?? 0,
        total: item.total ?? 0,
      }));

    await rlTigaTitikDuaBelasSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: [
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
  clients.forEach((client) => client.write(`data: ${payload}\n\n`));
};
