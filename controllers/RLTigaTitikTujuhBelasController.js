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

export const getRLTigaTitikTujuhBelas = (req, res) => {
  // const joi = Joi.extend(joi)

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
    // console.log(req.user)
    // console.log(results)
    const message = results.length ? "data found" : "data not found";
    res.status(200).send({
      status: true,
      message: message,
      data: results,
    });
  });
};

export const showRLTigaTitikTujuhBelas = (req, res) => {
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

export const insertDataRLTigaTitikTujuhBelas = async (req, res) => {
  const schema = Joi.object({
    // periodeBulan: Joi.number().greater(0).less(13).required(),
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

  const { error, value } = schema.validate(req.body);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }

  // const periodeBulan = String(req.body.periodeBulan)
  const periode = String(req.body.periodeTahun);
  // const periode = periodeTahun

  const transaction = await databaseSIRS.transaction();
  try {
    const resultInsertHeader = await rlTigaTitikTujuhBelas.create(
      {
        rs_id: req.user.satKerId,
        periode: periode,
        user_id: req.user.id,
      },
      {
        transaction: transaction,
      },
    );

    const dataDetail = req.body.data.map((value, index) => {
      return {
        rs_id: req.user.satKerId,
        periode: periode,
        rl_tiga_titik_tujuh_belas_id: resultInsertHeader.id,
        golongan_obat_id: value.golonganObatId,
        jumlah_item_obat: value.jumlahItemObat,
        jumlah_item_obat_rs: value.jumlahItemObatRs,

        user_id: req.user.id,
      };
    });

    await rlTigaTitikTujuhBelasDetail.bulkCreate(dataDetail, {
      transaction: transaction,
    });

    await transaction.commit();
    res.status(201).send({
      status: true,
      message: "data created",
      data: {
        id: resultInsertHeader.id,
      },
    });
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).send({
        status: false,
        message: "Duplicate Entry",
      });
    } else {
      res.status(400).send({
        status: false,
        message: error,
      });
    }
  }
};

export const updateRLTigaTitikTujuhBelas = async (req, res) => {
  // console.log(req)
  try {
    const update = await rlTigaTitikTujuhBelasDetail.update(
      {
        // rl_tiga_titik_tujuh_belas_id: resultInsertHeader.id,
        golongan_obat_id: req.body.golonganObatId,
        jumlah_item_obat: req.body.jumlahItemObat,
        jumlah_item_obat_rs: req.body.jumlahItemObatRs,
        // rs_id: req.user.rsId,
        // periode: req.body.periode,
        user_id: req.user.id,
      },
      {
        where: {
          id: req.params.id,
          rs_id: req.user.satKerId,
        },
      },
    );
    res.status(200).json({
      status: true,
      message: update,
    });
  } catch (error) {
    console.log(error.message);
  }
};

export const deleteRLTigaTitikTujuhBelas = async (req, res) => {
  try {
    const count = await rlTigaTitikTujuhBelasDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
    });
    if (count == 0) {
      res.status(404).send({
        status: true,
        message: "Data Not Found",
        data: {
          deleted_rows: count,
        },
      });
    } else {
      res.status(201).send({
        status: true,
        message: "data deleted successfully",
        data: {
          deleted_rows: count,
        },
      });
    }
  } catch (error) {
    res.status(404).send({
      status: false,
      message: error,
    });
  }
};

export const getDataRLTigaTitikTujuhBelasWithSatuSehat = async (req, res) => {
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
      rlTigaTitikTujuhBelasSatuSehat.findAll({
        where: { organization_id, periode },
        limit,
        offset,
        order: [["id", "ASC"]],
        include: {
          model: golonganObatRLTigaTitikTujuhBelas,
          attributes: ["nama"],
        },
      }),
      rlTigaTitikTujuhBelasSatuSehat.count({
        where: { organization_id, periode },
      }),
      getLastSyncInfo(organization_id, periode, "rl_3_17"),
      isSyncing(organization_id, periode, "rl_3_17"), // ← cukup panggil sekali di sini
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
    const stale = await isStale(organization_id, periode, "rl_3_17");

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

export const manualSyncRL317 = async (req, res) => {
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
    const syncing = await isSyncing(organization_id, periode, "rl_3_17");
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

export const subscribeSyncStatusRL317 = (req, res) => {
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
    tipe_rl: "rl_3_17",
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL317FromSatuSehat(organization_id, periode);

    if (!rawData || rawData.status === 404 || rawData.error) {
      await logEntry.update({
        status: "success", // tetap success, bukan failed
        total_data: 0,
        synced_at: new Date(),
        error_msg: rawData?.message ?? "data not found",
      });
      return { success: true, total: 0 };
    }

    const dataArray = Array.isArray(rawData.data.golongan_obat)
      ? rawData.data.golongan_obat
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
      golongan_obat_id: item.golongan_obat_id,
      jumlah_item_obat: item.jumlah_item_obat ?? 0,
      jumlah_item_obat_rs: item.jumlah_item_obat_rs ?? 0,
    }));

    await rlTigaTitikTujuhBelasSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: [
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
