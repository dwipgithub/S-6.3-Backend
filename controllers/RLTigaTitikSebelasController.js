import Joi from "joi";

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
      return;
    });
};

export const getRLTigaTitikSebelas = (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.number().required(),
    page: Joi.number(),
    limit: Joi.number(),
  });

  const { error, value } = schema.validate(req.query);

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

export const showRLTigaTitikSebelas = (req, res) => {
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
      return;
    });
};

export const getRLTigaTitikSebelasById = async (req, res) => {
  rlTigaTitikSebelasDetail
    .findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: JenisKegiatanRLTigaTitikSebelas,
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
    transaction = await databaseSIRS.transaction();
    const resultInsertHeader = await rlTigaTitikSebelasHeader.create(
      {
        rs_id: req.user.satKerId,
        periode: req.body.tahun,
        user_id: req.user.id,
      },
      {
        transaction,
      },
    );

    const dataDetail = req.body.data.map((value, index) => {
      return {
        rs_id: req.user.satKerId,
        periode: req.body.tahun,
        rl_tiga_titik_sebelas_id: resultInsertHeader.id,
        rl_tiga_titik_sebelas_jenis_kegiatan_id: value.jenisKegiatanId,
        jumlah: value.jumlah,
        user_id: req.user.id,
      };
    });

    const resultInsertDetail = await rlTigaTitikSebelasDetail.bulkCreate(
      dataDetail,
      {
        transaction,
        updateOnDuplicate: ["jumlah"],
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
          message: "Gagal Input Data, Jenis Kegiatan Salah.",
        });
      } else {
        res.status(400).send({
          status: false,
          message: "Gagal Input Data.",
          error: error,
        });
      }
      await transaction.rollback();
    }
  }
};

export const updateDataRLTigaTitikSebelas = async (req, res) => {
  const schema = Joi.object({
    jumlah: Joi.number().required(),
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
    try {
      transaction = await databaseSIRS.transaction();
      const update = await rlTigaTitikSebelasDetail.update(data, {
        where: {
          id: req.params.id,
          rs_id: req.user.satKerId,
        },
      });
      //   console.log(update[0] ==);
      if (update[0] != 0) {
        console.log(update);
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
          error: update,
        });
      }
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(400).send({
        status: false,
        message: "Gagal Memperbaharui Data",
        error: error,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).send({
      status: false,
      message: "Gagal Memperbaharui Data",
      error: error,
    });
  }

  //   console.log(req.body);
};

export const deleteDataRLTigaTitikSebelas = async (req, res) => {
  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
    const count = await rlTigaTitikSebelasDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
    });

    if (count != 0) {
      console.log("atas");
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

export const getDataRLTigaTitikSebelasWithSatuSehat = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string().min(4).max(4).required(),
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
      isSyncing(organization_id, periode, "rl_3_11"), // ← cukup panggil sekali di sini
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
    const stale = await isStale(organization_id, periode, "rl_3_11");

    if (stale && !currentlySyncing) {
      doSync(organization_id, periode)
        .then(() => notifySseClients(organization_id, periode))
        .catch((err) =>
          console.error(`[Sync BG Error] RS ${rsIdFinal}:`, err.message),
        );
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

export const manualSyncRL311 = async (req, res) => {
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

    const organization_id = satuSehat.organization_id?.substring(0, 9);

    // Cegah dobel sync
    const syncing = await isSyncing(organization_id, periode, "rl_3_11");
    if (syncing) {
      return res
        .status(200)
        .send({ status: true, message: "Sedang dalam proses sync" });
    }

    // Langsung sync tanpa cek isStale (ini manual, jadi force)
    doSync(organization_id, periode)
      .then(() => notifySseClients(organization_id, periode))
      .catch((err) => console.error("[Manual Sync Error]", err.message));

    return res.status(200).send({ status: true, message: "Sync dimulai" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

export const subscribeSyncStatusRL311 = (req, res) => {
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

const doSync = async (organization_id, periode) => {
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
        status: "success", // tetap success, bukan failed
        total_data: 0,
        synced_at: new Date(),
        error_msg: rawData?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    const dataArray = Array.isArray(rawData.data.kegiatan)
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
