import Joi from "joi";

import { databaseSIRS } from "../config/Database.js";

import {
  rlTigaTitikSepuluh,
  rlTigaTitikSepuluhDetail,
  rlTigaTitikSepuluhSatuSehat,
} from "../models/RLTigaTitikSepuluh.js";
import { jenisSpesialisTigaTitikSepuluh } from "../models/JenisSpesialisTigaTitikSepuluh.js";
import { syncLog } from "../models/SyncLogModel.js";
import { satu_sehat_id } from "../models/UserModel.js";

import { fetchRL310FromSatuSehat } from "../services/satusehat.service.js";
import {
  getLastSyncInfo,
  isStale,
  isSyncing,
} from "../services/rlSync.service.js";

//new-----------------------------------------------------------------------------------------------------------
export const getDataRLTigaTitikSepuluh = (req, res) => {
  // let where = { rs_id: req.user.satKerId };
  const { rsId, tahun, bulan } = req.query;

  let whereClause = {};

  if (req.user.jenisUserId == 4) {
    if (rsId != req.user.satKerId) {
      return res.status(403).send({
        status: false,
        message: "Kode RS Tidak Sesuai",
      });
    }

    whereClause = {
      rs_id: req.user.satKerId,
      tahun: tahun,
      bulan: bulan,
    };
  } else {
    whereClause = {
      rs_id: rsId,
      tahun: tahun,
      bulan: bulan,
    };
  }

  // if (req.query.tahun) where.tahun = req.query.tahun;
  // if (req.query.bulan) where.bulan = req.query.bulan;

  rlTigaTitikSepuluh
    .findAll({
      attributes: ["id", "tahun", "bulan"],
      where: whereClause,
      include: {
        model: rlTigaTitikSepuluhDetail,
        include: {
          model: jenisSpesialisTigaTitikSepuluh,
          attributes: ["id", "no", "nama"],
          as: "jenis_spesialis_rl_tiga_titik_sepuluh",
        },
      },
      order: [
        [
          rlTigaTitikSepuluhDetail,
          {
            model: jenisSpesialisTigaTitikSepuluh,
            as: "jenis_spesialis_rl_tiga_titik_sepuluh",
          },
          "no",
          "ASC",
        ],
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

// Unknown
export const getDataRLTigaTitikSepuluhDetailSpesialis = (req, res) => {
  rlTigaTitikSepuluhDetail
    .findAll({
      attributes: [
        "id",
        "rl_tiga_titik_sepuluh_id",
        "rm_dikembalikan_puskesmas",
        "rm_diterima_rs",
        "rm_diterima_faskes_lain",
        "rm_diterima_total_rm",
        "rm_dikembalikan_puskesmas",
        "rm_dikembalikan_rs",
        "rm_dikembalikan_faskes_lain",
        "rm_dikembalikan_total_rm",
        "keluar_pasien_rujukan",
        "keluar_pasien_datang_sendiri",
        "keluar_total_keluar",
      ],
      where: {
        rs_id: req.user.satKerId,
        tahun: req.query.tahun,
      },
      include: {
        model: jenisSpesialisTigaTitikSepuluh,
        attributes: ["id", "no", "nama"],
        as: "jenis_spesialis_rl_tiga_titik_sepuluh",
      },
      order: [
        [
          {
            model: jenisSpesialisTigaTitikSepuluh,
            as: "jenis_spesialis_rl_tiga_titik_sepuluh",
          },
          "id",
          "ASC",
        ],
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
      console.log(err);
      res.status(422).send({
        status: false,
        message: err,
      });
      return;
    });
};

// Done
export const getDataRLTigaTitikSepuluhById = (req, res) => {
  rlTigaTitikSepuluhDetail
    .findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: jenisSpesialisTigaTitikSepuluh,
        attributes: ["id", "no", "nama"],
        as: "jenis_spesialis_rl_tiga_titik_sepuluh",
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

// Unknown
export const getDataRLTigaTitikSepuluhDetails = (req, res) => {
  rlTigaTitikSepuluh
    .findAll({
      include: [
        {
          model: rlTigaTitikSepuluhDetail,
          include: [jenisSpesialisTigaTitikSepuluh],
        },
      ],
      attributes: ["id", "tahun"],
      where: {
        rs_id: req.user.satKerId,
        user_id: req.user.id,
        tahun: req.param.tahun,
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

// Done
export const insertDataRLTigaTitikSepuluh = async (req, res) => {
  const schema = Joi.object({
    tahun: Joi.number().required(),
    bulan: Joi.number().required(),
    data: Joi.array()
      .items(
        Joi.object().keys({
          jenisSpesialisTigaTitikSepuluhId: Joi.number().required(),
          rm_diterima_puskesmas: Joi.number().min(0),
          rm_diterima_rs: Joi.number().min(0),
          rm_diterima_faskes_lain: Joi.number().min(0),
          rm_diterima_total_rm: Joi.number().min(0),
          rm_dikembalikan_puskesmas: Joi.number().min(0),
          rm_dikembalikan_rs: Joi.number().min(0),
          rm_dikembalikan_faskes_lain: Joi.number().min(0),
          rm_dikembalikan_total_rm: Joi.number().min(0),
          keluar_pasien_rujukan: Joi.number().min(0),
          keluar_pasien_datang_sendiri: Joi.number().min(0),
          keluar_total_keluar: Joi.number().min(0),
          keluar_diterima_kembali: Joi.number().min(0),
        }),
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

  const transaction = await databaseSIRS.transaction();

  try {
    // transaction = await databaseSIRS.transaction();
    // let rlTigaTitikSepuluhID;

    // const dataExisted = await rlTigaTitikSepuluh.findOne({
    //   where: {
    //     tahun: req.body.tahun,
    //     bulan: req.body.bulan,
    //     user_id: req.user.id,
    //   },
    // });

    // if (dataExisted) {
    //   rlTigaTitikSepuluhID = dataExisted.id;
    // } else {
    //   const rlInsertHeader = await rlTigaTitikSepuluh.create(
    //     {
    //       rs_id: req.user.satKerId,
    //       user_id: req.user.id,
    //       tahun: req.body.tahun,
    //       bulan: req.body.bulan,
    //     },
    //     { transaction }
    //   );

    //   rlTigaTitikSepuluhID = rlInsertHeader.id;
    // }

    const rlInsertHeader = await rlTigaTitikSepuluh.create(
      {
        rs_id: req.user.satKerId,
        user_id: req.user.id,
        tahun: req.body.tahun,
        bulan: req.body.bulan,
      },
      { transaction },
    );

    const dataDetail = req.body.data.map((value, index) => {
      const now = new Date();
      const date = now.getDate();
      return {
        tahun: `${req.body.tahun}-${req.body.bulan}-01`,
        bulan: req.body.bulan,
        rs_id: req.user.satKerId,
        rl_tiga_titik_sepuluh_id: rlInsertHeader.id,
        jenis_spesialis_rl_tiga_titik_sepuluh_id:
          value.jenisSpesialisTigaTitikSepuluhId,
        rm_diterima_puskesmas: value.rm_diterima_puskesmas,
        rm_diterima_rs: value.rm_diterima_rs,
        rm_diterima_faskes_lain: value.rm_diterima_faskes_lain,
        rm_diterima_total_rm: value.rm_diterima_total_rm,
        rm_dikembalikan_puskesmas: value.rm_dikembalikan_puskesmas,
        rm_dikembalikan_rs: value.rm_dikembalikan_rs,
        rm_dikembalikan_faskes_lain: value.rm_dikembalikan_faskes_lain,
        rm_dikembalikan_total_rm: value.rm_dikembalikan_total_rm,
        keluar_pasien_rujukan: value.keluar_pasien_rujukan,
        keluar_pasien_datang_sendiri: value.keluar_pasien_datang_sendiri,
        keluar_total_keluar: value.keluar_total_keluar,
        keluar_diterima_kembali: value.keluar_diterima_kembali,
        user_id: req.user.id,
      };
    });

    await rlTigaTitikSepuluhDetail.bulkCreate(dataDetail, {
      transaction,
      updateOnDuplicate: ["rm_diterima_puskesmas"],
      updateOnDuplicate: ["rm_diterima_rs"],
      updateOnDuplicate: ["rm_diterima_faskes_lain"],
      updateOnDuplicate: ["rm_diterima_total_rm"],
      updateOnDuplicate: ["rm_dikembalikan_puskesmas"],
      updateOnDuplicate: ["rm_dikembalikan_rs"],
      updateOnDuplicate: ["rm_dikembalikan_faskes_lain"],
      updateOnDuplicate: ["rm_dikembalikan_total_rm"],
      updateOnDuplicate: ["keluar_pasien_rujukan"],
      updateOnDuplicate: ["keluar_pasien_datang_sendiri"],
      updateOnDuplicate: ["keluar_total_keluar"],
      updateOnDuplicate: ["keluar_diterima_kembali"],
    });

    await transaction.commit();
    res.status(201).send({
      status: true,
      message: "data created",
      data: {
        id: rlInsertHeader.id,
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
    // if (transaction) {
    //   if (error.name == "SequelizeForeignKeyConstraintError") {
    //     res.status(400).send({
    //       status: false,
    //       message: "Gagal Input Data, Jenis Spesialisasi Salah.",
    //     });
    //   } else {
    //     res.status(400).send({
    //       status: false,
    //       message: error,
    //     });
    //   }
    //   await transaction.rollback();
    // }
  }
};

// Done
export const updateDataRLTigaTitikSepuluh = async (req, res) => {
  const schema = Joi.object({
    rm_diterima_puskesmas: Joi.number().required(),
    rm_diterima_rs: Joi.number().required(),
    rm_diterima_faskes_lain: Joi.number().required(),
    rm_diterima_total_rm: Joi.number().required(),
    rm_dikembalikan_puskesmas: Joi.number().required(),
    rm_dikembalikan_rs: Joi.number().required(),
    rm_dikembalikan_faskes_lain: Joi.number().required(),
    rm_dikembalikan_total_rm: Joi.number().required(),
    keluar_pasien_rujukan: Joi.number().required(),
    keluar_pasien_datang_sendiri: Joi.number().required(),
    keluar_total_keluar: Joi.number().required(),
    keluar_diterima_kembali: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }

  // let transaction;
  // try {
  //   transaction = await databaseSIRS.transaction();

  //   const existingData = await rlTigaTitikSepuluhDetail.findOne({
  //     where: {
  //       id: req.params.id,
  //       rs_id: req.user.satKerId,
  //     },
  //   });

  //   if (existingData) {
  //     if (existingData.rm_diterima_puskesmas !== req.body.rm_diterima_puskesmas)
  //       existingData.rm_diterima_puskesmas = req.body.rm_diterima_puskesmas;
  //     if (existingData.rm_diterima_rs !== req.body.rm_diterima_rs)
  //       existingData.rm_diterima_rs = req.body.rm_diterima_rs;
  //     if (
  //       existingData.rm_diterima_faskes_lain !==
  //       req.body.rm_diterima_faskes_lain
  //     )
  //       existingData.rm_diterima_faskes_lain = req.body.rm_diterima_faskes_lain;
  //     if (existingData.rm_diterima_total_rm !== req.body.rm_diterima_total_rm)
  //       existingData.rm_diterima_total_rm = req.body.rm_diterima_total_rm;
  //     if (
  //       existingData.rm_dikembalikan_puskesmas !==
  //       req.body.rm_dikembalikan_puskesmas
  //     )
  //       existingData.rm_dikembalikan_puskesmas =
  //         req.body.rm_dikembalikan_puskesmas;
  //     if (existingData.rm_dikembalikan_rs !== req.body.rm_dikembalikan_rs)
  //       existingData.rm_dikembalikan_rs = req.body.rm_dikembalikan_rs;
  //     if (
  //       existingData.rm_dikembalikan_faskes_lain !==
  //       req.body.rm_dikembalikan_faskes_lain
  //     )
  //       existingData.rm_dikembalikan_faskes_lain =
  //         req.body.rm_dikembalikan_faskes_lain;
  //     if (
  //       existingData.rm_dikembalikan_total_rm !==
  //       req.body.rm_dikembalikan_total_rm
  //     )
  //       existingData.rm_dikembalikan_total_rm =
  //         req.body.rm_dikembalikan_total_rm;
  //     if (existingData.keluar_pasien_rujukan !== req.body.keluar_pasien_rujukan)
  //       existingData.keluar_pasien_rujukan = req.body.keluar_pasien_rujukan;
  //     if (
  //       existingData.keluar_pasien_datang_sendiri !==
  //       req.body.keluar_pasien_datang_sendiri
  //     )
  //       existingData.keluar_pasien_datang_sendiri =
  //         req.body.keluar_pasien_datang_sendiri;
  //     if (existingData.keluar_total_keluar !== req.body.keluar_total_keluar)
  //       existingData.keluar_total_keluar = req.body.keluar_total_keluar;
  //     if (
  //       existingData.keluar_diterima_kembali !==
  //       req.body.keluar_diterima_kembali
  //     )
  //       existingData.keluar_diterima_kembali = req.body.keluar_diterima_kembali;

  //     await existingData.save();
  //     await transaction.commit();

  //     res.status(201).send({
  //       status: true,
  //       message: "Data berhasil diperbaharui.",
  //     });
  //   } else {
  //     await transaction.rollback();
  //     res.status(400).send({
  //       status: false,
  //       message: "Data tidak ditemukan",
  //     });
  //   }
  // } catch (error) {
  //   if (transaction) {
  //     await transaction.rollback();
  //   }
  //   res.status(500).send({
  //     status: false,
  //     message: "Gagal Memperbaharui Data",
  //   });
  // }

  try {
    const update = await rlTigaTitikSepuluhDetail.update(
      {
        rm_diterima_puskesmas: req.body.rm_diterima_puskesmas,
        rm_diterima_rs: req.body.rm_diterima_rs,
        rm_diterima_faskes_lain: req.body.rm_diterima_faskes_lain,
        rm_diterima_total_rm: req.body.rm_diterima_total_rm,
        rm_dikembalikan_puskesmas: req.body.rm_dikembalikan_puskesmas,
        rm_dikembalikan_rs: req.body.rm_dikembalikan_rs,
        rm_dikembalikan_faskes_lain: req.body.rm_dikembalikan_faskes_lain,
        rm_dikembalikan_total_rm: req.body.rm_dikembalikan_total_rm,
        keluar_pasien_rujukan: req.body.keluar_pasien_rujukan,
        keluar_pasien_datang_sendiri: req.body.keluar_pasien_datang_sendiri,
        keluar_total_keluar: req.body.keluar_total_keluar,
        keluar_diterima_kembali: req.body.keluar_diterima_kembali,
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
      message: "Data berhasil diperbaharui.",
    });
  } catch (error) {
    // console.log(error.message);
    res.status(500).send({
      status: false,
      message: "Gagal Memperbaharui Data" + error,
    });
  }
};

// Done
export const deleteDataRLTigaTitikSepuluh = async (req, res) => {
  try {
    const count = await rlTigaTitikSepuluhDetail.destroy({
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
    // await transaction.rollback();
    res.status(500).send({
      status: false,
      message: error,
    });
  }
};

export const getDataRLTigaTitikSepuluhWithSatuSehat = async (req, res) => {
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
      rlTigaTitikSepuluhSatuSehat.findAll({
        where: { organization_id, periode_laporan: periode },
        limit,
        offset,
        order: [["id", "ASC"]],
        include: {
          model: jenisSpesialisTigaTitikSepuluh,
          as: "jenis_spesialisasi",
          attributes: ["nama"],
        },
      }),
      rlTigaTitikSepuluhSatuSehat.count({
        where: { organization_id, periode_laporan: periode },
      }),
      getLastSyncInfo(organization_id, periode, "rl_3_10"),
      isSyncing(organization_id, periode, "rl_3_10"), // ← cukup panggil sekali di sini
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
    const stale = await isStale(organization_id, periode, "rl_3_10");

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

export const manualSyncRL310 = async (req, res) => {
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
    const syncing = await isSyncing(organization_id, periode, "rl_3_10");
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

export const subscribeSyncStatusRL310 = (req, res) => {
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
    tipe_rl: "rl_3_10",
    periode,
    status: "syncing",
  });

  try {
    const rawData = await fetchRL310FromSatuSehat(organization_id, periode);

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

    const mapped = dataArray.map((item) => ({
      organization_id,
      periode_laporan: periode,
      jenis_spesialisasi_id: item.jenis_spesialisasi_id,
      rm_diterima_puskesmas: item.diterima_dari.diterima_dari_puskesmas ?? 0,
      rm_diterima_rs: item.diterima_dari.diterima_dari_rs ?? 0,
      rm_diterima_faskes_lain:
        item.diterima_dari.diterima_dari_faskes_lain ?? 0,
      rm_diterima_total_rm: item.diterima_dari.total_rujukan_masuk ?? 0,
      rm_dikembalikan_puskesmas:
        item.dikembalikan_ke.dikembalikan_ke_puskesmas ?? 0,
      rm_dikembalikan_rs: item.dikembalikan_ke.dikembalikan_ke_rs ?? 0,
      rm_dikembalikan_faskes_lain:
        item.dikembalikan_ke.dikembalikan_ke_faskes_lain ?? 0,
      rm_dikembalikan_total_rm:
        item.dikembalikan_ke.total_rujukan_masuk_dikembalikan ?? 0,
      keluar_pasien_rujukan: item.dirujuk_keluar.pasien_rujukan ?? 0,
      keluar_pasien_datang_sendiri:
        item.dirujuk_keluar.pasien_datang_sendiri ?? 0,
      keluar_total_keluar: item.dirujuk_keluar.total_dirujuk_keluar ?? 0,
      keluar_diterima_kembali: item.dirujuk_keluar.diterima_kembali ?? 0,
    }));

    await rlTigaTitikSepuluhSatuSehat.bulkCreate(mapped, {
      updateOnDuplicate: [
        "rm_diterima_puskesmas",
        "rm_diterima_rs",
        "rm_diterima_faskes_lain",
        "rm_diterima_total_rm",
        "rm_dikembalikan_puskesmas",
        "rm_dikembalikan_rs",
        "rm_dikembalikan_faskes_lain",
        "rm_dikembalikan_total_rm",
        "keluar_pasien_rujukan",
        "keluar_pasien_datang_sendiri",
        "keluar_total_keluar",
        "keluar_diterima_kembali",
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
