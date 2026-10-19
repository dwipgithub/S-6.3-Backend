import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import joiDate from "@joi/date";
import {
  rlTigaTitikSembilanBelas,
  rlTigaTitikSembilanBelasDetail,
} from "../models/RLTigaTitikSembilanBelas.js";
import { golonganObatTigaTitikSembilanBelas } from "../models/GolonganObatTigaTitikSembilanBelas.js";
import { satu_sehat_id, users_sso } from "../models/UserModel.js";
import { rlTigaTitikSembilanBelasSatuSehat } from "../models/RLTigaTitikSembilanBelasSatuSehatModel.js";
import {
  isStale,
  isSyncing,
  doSync,
  getLastSyncInfo,
} from "../services/rl319Sync.service.js";

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import ExcelJS from "exceljs";
import { Op } from "sequelize";

const sseClients = new Map();

//new

// Done
export const getDataRLTigaTitikSembilanBelas = (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    tahun: joi.date().format("YYYY").required(),
  });
  const { error, value } = schema.validate(req.query);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }
  let whereClause = {};

  if (req.user.jenisUserId == 4) {
    if (req.query.rsId != req.user.satKerId) {
      res.status(404).send({
        status: false,
        message: "Kode RS Tidak Sesuai",
      });
      return;
    }
    whereClause = {
      rs_id: req.user.satKerId,
      tahun: req.query.tahun,
    };
  } else {
    whereClause = {
      rs_id: req.query.rsId,
      tahun: req.query.tahun,
    };
  }
  // let where = { rs_id: req.user.satKerId };
  // if (req.query.tahun) where.tahun = req.query.tahun;

  rlTigaTitikSembilanBelas
    .findAll({
      attributes: ["id", "tahun"],
      where: whereClause,
      include: {
        model: rlTigaTitikSembilanBelasDetail,
        include: {
          model: golonganObatTigaTitikSembilanBelas,
          attributes: ["id", "no", "nama"],
          as: "golongan_obat_rl_tiga_titik_sembilan_belas",
        },
      },
      order: [
        [
          rlTigaTitikSembilanBelasDetail,
          {
            model: golonganObatTigaTitikSembilanBelas,
            as: "golongan_obat_rl_tiga_titik_sembilan_belas",
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
export const getDataRLTigaTitikSembilanBelasDetailGolonganObat = (req, res) => {
  rlTigaTitikSembilanBelasDetail
    .findAll({
      attributes: [
        "id",
        "rl_tiga_titik_sembilan_belas_id",
        "ranap_pasien_keluar",
        "ranap_lama_dirawat",
        "jumlah_pasien_rajal",
        "rajal_lab",
        "rajal_radiologi",
        "rajal_lain_lain",
      ],
      where: {
        rs_id: req.user.satKerId,
        tahun: req.query.tahun,
      },
      include: {
        model: golonganObatTigaTitikSembilanBelas,
        attributes: ["id", "no", "nama"],
        as: "golongan_obat_rl_tiga_titik_sembilan_belas",
      },
      order: [
        [
          {
            model: golonganObatTigaTitikSembilanBelas,
            as: "golongan_obat_rl_tiga_titik_sembilan_belas",
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
export const getDataRLTigaTitikSembilanBelasById = (req, res) => {
  rlTigaTitikSembilanBelasDetail
    .findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: golonganObatTigaTitikSembilanBelas,
        attributes: ["id", "no", "nama"],
        as: "golongan_obat_rl_tiga_titik_sembilan_belas",
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

export const getDataRLTigaTitikSembilanBelasDetails = (req, res) => {
  rlTigaTitikSembilanBelasDetail
    .findOne({
      where: {
        rs_id: req.user.satKerId,
        user_id: req.user.id,
        tahun: req.query.tahun,
        golongan_obat_rl_tiga_titik_sembilan_belas_id: req.query.specificId,
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
export const insertDataRLTigaTitikSembilanBelas = async (req, res) => {
  const schema = Joi.object({
    tahun: Joi.number().required(),
    data: Joi.array()
      .items(
        Joi.object().keys({
          golonganObatTigaTitikSembilanBelasId: Joi.number().required(),
          ranap_pasien_keluar: Joi.number().min(0),
          ranap_lama_dirawat: Joi.number().min(0),
          jumlah_pasien_rajal: Joi.number().min(0),
          rajal_lab: Joi.number().min(0),
          rajal_radiologi: Joi.number().min(0),
          rajal_lain_lain: Joi.number().min(0),
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

  let transaction;

  try {
    transaction = await databaseSIRS.transaction();
    let rlTigaTitikSembilanBelasID;

    const dataExisted = await rlTigaTitikSembilanBelas.findOne({
      where: {
        tahun: req.body.tahun,
        rs_id: req.user.satKerId,
        user_id: req.user.id,
      },
    });

    if (dataExisted) {
      rlTigaTitikSembilanBelasID = dataExisted.id;
    } else {
      const rlInsertHeader = await rlTigaTitikSembilanBelas.create(
        {
          rs_id: req.user.satKerId,
          user_id: req.user.id,
          tahun: req.body.tahun,
        },
        { transaction },
      );

      rlTigaTitikSembilanBelasID = rlInsertHeader.id;
    }

    const dataDetail = req.body.data.map((value, index) => {
      return {
        tahun: req.body.tahun,
        rs_id: req.user.satKerId,
        rl_tiga_titik_sembilan_belas_id: rlTigaTitikSembilanBelasID,
        golongan_obat_rl_tiga_titik_sembilan_belas_id:
          value.golonganObatTigaTitikSembilanBelasId,
        ranap_pasien_keluar: value.ranap_pasien_keluar,
        ranap_lama_dirawat: value.ranap_lama_dirawat,
        jumlah_pasien_rajal: value.jumlah_pasien_rajal,
        rajal_lab: value.rajal_lab,
        rajal_radiologi: value.rajal_radiologi,
        rajal_lain_lain: value.rajal_lain_lain,
        user_id: req.user.id,
      };
    });

    await rlTigaTitikSembilanBelasDetail.bulkCreate(dataDetail, {
      transaction,
      updateOnDuplicate: [
        "ranap_pasien_keluar",
        "ranap_lama_dirawat",
        "jumlah_pasien_rajal",
        "rajal_lab",
        "rajal_radiologi",
        "rajal_lain_lain",
      ],
    });

    await transaction.commit();
    res.status(201).send({
      status: true,
      message: "data created",
      data: {
        id: rlTigaTitikSembilanBelasID,
      },
    });
  } catch (error) {
    if (transaction) {
      if (error.name == "SequelizeForeignKeyConstraintError") {
        res.status(400).send({
          status: false,
          message: "Gagal Input Data, Jenis Kegiatan Salah.",
          data: error,
        });
      } else {
        console.log(error);
        res.status(400).send({
          status: false,
          message: error,
        });
      }
      await transaction.rollback();
    }
  }
};

// Done
export const updateDataRLTigaTitikSembilanBelas = async (req, res) => {
  const schema = Joi.object({
    ranap_pasien_keluar: Joi.number().required(),
    ranap_lama_dirawat: Joi.number().required(),
    jumlah_pasien_rajal: Joi.number().required(),
    rajal_lab: Joi.number().required(),
    rajal_radiologi: Joi.number().required(),
    rajal_lain_lain: Joi.number().required(),
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

    const existingData = await rlTigaTitikSembilanBelasDetail.findOne({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
    });

    if (existingData) {
      if (existingData.ranap_pasien_keluar !== req.body.ranap_pasien_keluar)
        existingData.ranap_pasien_keluar = req.body.ranap_pasien_keluar;
      if (existingData.ranap_lama_dirawat !== req.body.ranap_lama_dirawat)
        existingData.ranap_lama_dirawat = req.body.ranap_lama_dirawat;
      if (existingData.jumlah_pasien_rajal !== req.body.jumlah_pasien_rajal)
        existingData.jumlah_pasien_rajal = req.body.jumlah_pasien_rajal;
      if (existingData.rajal_lab !== req.body.rajal_lab)
        existingData.rajal_lab = req.body.rajal_lab;
      if (existingData.rajal_radiologi !== req.body.rajal_radiologi)
        existingData.rajal_radiologi = req.body.rajal_radiologi;
      if (existingData.rajal_lain_lain !== req.body.rajal_lain_lain)
        existingData.rajal_lain_lain = req.body.rajal_lain_lain;

      await existingData.save();
      await transaction.commit();

      res.status(201).send({
        status: true,
        message: "Data berhasil diperbaharui.",
      });
    } else {
      await transaction.rollback();
      res.status(400).send({
        status: false,
        message: "Data tidak ditemukan",
      });
    }
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    res.status(500).send({
      status: false,
      message: "Gagal Memperbaharui Data",
    });
  }
};

// Done
export const deleteDataRLTigaTitikSembilanBelas = async (req, res) => {
  let transaction;

  try {
    const deleted = await rlTigaTitikSembilanBelasDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
    });

    if (deleted) {
      res.status(201).send({
        status: true,
        message: "Data Berhasil Dihapus",
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

export const subscribeSyncStatus = (req, res) => {
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

export const manualSyncRL319 = async (req, res) => {
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
    const syncing = await isSyncing(organization_id, periode);
    if (syncing) {
      return res
        .status(200)
        .send({ status: true, message: "Sedang dalam proses sync" });
    }

    // // Langsung sync tanpa cek isStale (ini manual, jadi force)
    doSync(organization_id, periode)
      .then(() => notifySseClients(organization_id, periode))
      .catch((err) => console.error("[Manual Sync Error]", err.message));

    return res.status(200).send({ status: true, message: "Sync dimulai" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

export const getDataRLTigaTitikSembilanBelasWithSatuSehat = async (
  req,
  res,
) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY").required(),
    page: joi.number().min(1).default(1),
    limit: joi.number().min(1).max(200).default(50),
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
  const periodeFormatted = req.query.periode;
  const periodeShort = req.query.periode;

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
      rlTigaTitikSembilanBelasSatuSehat.findAll({
        where: { organization_id, tahun: periodeFormatted },
        limit,
        offset,
        order: [["id", "ASC"]],
      }),
      rlTigaTitikSembilanBelasSatuSehat.count({
        where: { organization_id, tahun: periodeFormatted },
      }),
      getLastSyncInfo(organization_id, periodeShort),
      isSyncing(organization_id, periodeShort), // ← cukup panggil sekali di sini
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
    const stale = await isStale(organization_id, periodeShort);
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const ambilSemuaRs = async (baseUrl, token, params) => {
  const hasil = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axios.get(`${baseUrl}/faskes/rumahsakit`, {
      params: { ...params, page, limit: 1000 },
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = response.data;
    hasil.push(...(body.data ?? []));
    totalPages = body.pagination?.totalNumberOfPages ?? 1;
    page++;
  } while (page <= totalPages);

  return hasil;
};

export const downloadDataRLTigaTitikSembilanBelasSatuSehat = async (
  req,
  res,
) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    provId: joi.string().allow("", null).optional(),
    kabId: joi.string().allow("", null).optional(),
    rsId: joi.string().allow("", null).optional(),
    periode: joi.date().format("YYYY").required(),
  });

  const { error, value } = schema.validate(req.query);
  if (error)
    return res
      .status(400)
      .send({ status: false, message: error.details[0].message });

  const jenisUserId = req.user.jenisUserId;

  if (jenisUserId === 2) {
    value.provId = req.user.satKerId;
  } else if (jenisUserId === 3) {
    value.kabId = req.user.satKerId;
    value.provId = undefined;
  }

  try {
    const baseUrl = process.env.API_FASKES;
    const username = process.env.username_API_FASKES;
    const password = process.env.password_API_FASKES;

    // Login selalu dilakukan di awal, dipakai oleh semua role (termasuk role 4)
    const loginResponse = await axios.post(
      `${baseUrl}/faskes/login`,
      { userName: username, password: password },
      { headers: { "Content-Type": "application/json" } },
    );

    const token =
      loginResponse.data.access_token || loginResponse.data.data.access_token;

    let rsList = [];
    let orgToRsMap = new Map();
    let orgIdList = [];

    if (jenisUserId === 4) {
      // ---- RS sendiri: ambil detail RS lewat endpoint /faskes/rumahsakit/{kodeRs} ----
      const kodeRsSendiri = req.user.satKerId;

      const rsDetailResponse = await axios.get(
        `${baseUrl}/faskes/rumahsakit/${kodeRsSendiri}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const rsDetail = rsDetailResponse.data.data ?? rsDetailResponse.data;

      const satuSehatMapping = await satu_sehat_id.findOne({
        where: { kode_baru_faskes: kodeRsSendiri },
        attributes: ["kode_baru_faskes", "organization_id"],
      });

      if (!satuSehatMapping) {
        return res.status(404).send({
          status: false,
          message: "Tidak ada mapping OrganizationId untuk RS ini",
        });
      }

      const orgIdShort = satuSehatMapping.organization_id?.substring(0, 9);

      rsList = [
        {
          kodeRs: kodeRsSendiri,
          namaRs: rsDetail?.nama ?? "",
          provinsiNama: rsDetail?.provinsiNama ?? "",
          kabKotaNama: rsDetail?.kabKotaNama ?? "",
        },
      ];

      orgToRsMap.set(orgIdShort, rsList[0]);
      orgIdList = [orgIdShort];
    } else if (value.rsId) {
      // ---- Role 1/2/3 memilih RS spesifik: ambil detail 1 RS itu saja ----
      const rsDetailResponse = await axios.get(
        `${baseUrl}/faskes/rumahsakit/${value.rsId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const rsDetail = rsDetailResponse.data.data ?? rsDetailResponse.data;

      if (!rsDetail) {
        return res.status(404).send({
          status: false,
          message: "Rumah sakit tidak ditemukan",
        });
      }

      if (
        jenisUserId === 2 &&
        String(rsDetail.provinsiId) !== String(req.user.satKerId)
      ) {
        return res.status(403).send({
          status: false,
          message: "RS yang dipilih bukan berada di wilayah Anda",
        });
      }
      if (
        jenisUserId === 3 &&
        String(rsDetail.kabKotaId) !== String(req.user.satKerId)
      ) {
        return res.status(403).send({
          status: false,
          message: "RS yang dipilih bukan berada di wilayah Anda",
        });
      }

      rsList = [
        {
          kodeRs: value.rsId,
          namaRs: rsDetail?.nama ?? "",
          provinsiId: rsDetail?.provinsiId ?? null,
          kabKotaId: rsDetail?.kabKotaId ?? null,
          provinsiNama: rsDetail?.provinsiNama ?? "",
          kabKotaNama: rsDetail?.kabKotaNama ?? "",
        },
      ];

      const kodeRsList = rsList.map((rs) => rs.kodeRs);

      const satuSehatMappings = await satu_sehat_id.findAll({
        where: {
          kode_baru_faskes: { [Op.in]: kodeRsList },
        },
        attributes: ["kode_baru_faskes", "organization_id"],
      });

      if (satuSehatMappings.length === 0) {
        return res.status(404).send({
          status: false,
          message:
            "Tidak ada mapping OrganizationId untuk wilayah yang dipilih",
        });
      }

      satuSehatMappings.forEach((mapping) => {
        const orgIdShort = mapping.organization_id?.substring(0, 9);
        const rsInfo = rsList.find(
          (rs) => String(rs.kodeRs) === String(mapping.kode_baru_faskes),
        );
        if (orgIdShort && rsInfo) {
          orgToRsMap.set(orgIdShort, rsInfo);
        }
      });

      orgIdList = Array.from(orgToRsMap.keys());

      if (orgIdList.length === 0) {
        return res.status(404).send({
          status: false,
          message: "Tidak ada data SatuSehat untuk wilayah yang dipilih",
        });
      }
    } else {
      const params = {};

      switch (jenisUserId) {
        case 1:
          if (value.provId) params.provinsiId = value.provId;
          if (value.kabId) params.kabKotaId = value.kabId;
          break;
        case 2:
          params.provinsiId = req.user.satKerId;
          if (value.kabId) params.kabKotaId = value.kabId;
          break;
        case 3:
          params.kabKotaId = req.user.satKerId;
          break;
      }

      const listRs = await ambilSemuaRs(baseUrl, token, params);

      rsList = listRs
        .filter((rs) => rs.statusAktivasi === 1)
        .map((rs) => ({
          kodeRs: rs.kode,
          namaRs: rs.nama,
          provinsiId: rs.provinsi_id,
          kabKotaId: rs.kab_kota_id,
          provinsiNama: rs.provinsiNama,
          kabKotaNama: rs.kabKotaNama,
        }));

      if (rsList.length === 0) {
        return res.status(404).send({
          status: false,
          message: "Tidak ada rumah sakit aktif pada wilayah yang dipilih",
        });
      }

      const kodeRsList = rsList.map((rs) => rs.kodeRs);

      const satuSehatMappings = await satu_sehat_id.findAll({
        where: {
          kode_baru_faskes: { [Op.in]: kodeRsList },
        },
        attributes: ["kode_baru_faskes", "organization_id"],
      });

      if (satuSehatMappings.length === 0) {
        return res.status(404).send({
          status: false,
          message:
            "Tidak ada mapping OrganizationId untuk wilayah yang dipilih",
        });
      }

      satuSehatMappings.forEach((mapping) => {
        const orgIdShort = mapping.organization_id?.substring(0, 9);
        const rsInfo = rsList.find(
          (rs) => String(rs.kodeRs) === String(mapping.kode_baru_faskes),
        );
        if (orgIdShort && rsInfo) {
          orgToRsMap.set(orgIdShort, rsInfo);
        }
      });

      orgIdList = Array.from(orgToRsMap.keys());

      if (orgIdList.length === 0) {
        return res.status(404).send({
          status: false,
          message: "Tidak ada data SatuSehat untuk wilayah yang dipilih",
        });
      }
    }

    // ---- Generate nama file & set header ----
    const tahun = req.query.periode;
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const namaFile = `RL_3_19_SatuSehat_${tahun}_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);

    await tulisExcelRL319SatuSehat({
      res,
      orgToRsMap,
      orgIdList,
      periode: req.query.periode,
      judul: "RL 3.19 Cara Bayar - SATU SEHAT",
      modelDetail: rlTigaTitikSembilanBelasSatuSehat,
      tampilkanOrgId: jenisUserId === 4,
    });
  } catch (err) {
    console.error(
      "downloadDataRLTigaTitikSembilanBelasSatuSehat:",
      err.message,
    );
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).send({
      status: false,
      message: "Gagal mengunduh data",
    });
  }
};

const RS_PER_BATCH_319 = 200; // 200 RS x ±12 baris = ±2.400 baris per query

const BORDER_TIPIS_319 = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

// Label mengikuti nama field; samakan dengan judul kolom di layar RL 3.19 yang sudah ada.
const KOLOM_ANGKA_319 = [
  {
    header: "Jumlah Pasien Keluar",
    group: "PASIEN RAWAT INAP",
    key: "ranap_pasien_keluar",
    width: 16,
  },
  {
    header: "Jumlah Lama Dirawat",
    group: "PASIEN RAWAT INAP",
    key: "ranap_lama_dirawat",
    width: 16,
  },
  {
    header: "Jumlah Pasien Rawat Jalan",
    group: null,
    key: "jumlah_pasien_rajal",
    width: 18,
  },
  {
    header: "Laboratorium",
    group: "PASIEN RAWAT JALAN",
    key: "rajal_lab",
    width: 14,
  },
  {
    header: "Radiologi",
    group: "PASIEN RAWAT JALAN",
    key: "rajal_radiologi",
    width: 14,
  },
  {
    header: "Lain-lain",
    group: "PASIEN RAWAT JALAN",
    key: "rajal_lain_lain",
    width: 14,
  },
];

export const tulisExcelRL319SatuSehat = async ({
  res,
  orgToRsMap,
  orgIdList,
  periode, // string "YYYY"
  judul = "RL 3.19 Cara Bayar - SATU SEHAT",
  modelDetail,
  tampilkanOrgId = false,
}) => {
  const tahun = parseInt(periode, 10);

  // ---- Kolom (identitas dinamis: Organization ID hanya untuk role 4) ----
  const kolomIdentitas = [
    { header: "No", group: null, key: "no", width: 5 },
    { header: "Kode RS", group: null, key: "kodeRs", width: 12 },
    { header: "Nama RS", group: null, key: "namaRs", width: 35 },
    // ...(tampilkanOrgId
    //   ? [
    //       {
    //         header: "Organization ID",
    //         group: null,
    //         key: "organizationId",
    //         width: 20,
    //       },
    //     ]
    //   : []),
    { header: "Provinsi", group: null, key: "provinsi", width: 22 },
    { header: "Kab/Kota", group: null, key: "kabKota", width: 22 },
    // { header: "Tahun", group: null, key: "tahun", width: 8 },
    { header: "No. Cara Bayar", group: null, key: "golonganNo", width: 14 },
    { header: "Cara Pembayaran", group: null, key: "golonganNama", width: 38 },
  ];
  const semuaKolom = [...kolomIdentitas, ...KOLOM_ANGKA_319];
  const totalKolom = semuaKolom.length;

  // ---- Workbook & sheet (2 baris header, 4 baris judul -> beku sampai baris 6) ----
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });
  const sheet = workbook.addWorksheet("RL 3.19 SatuSehat", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 6 }],
  });
  sheet.columns = semuaKolom.map((k) => ({ key: k.key, width: k.width }));

  // ---- Blok judul ----
  const rJudul = sheet.addRow([judul]);
  rJudul.font = { bold: true, size: 16 };
  sheet.mergeCells(1, 1, 1, 4);
  rJudul.commit();

  const rPeriodeLabel = sheet.addRow(["Periode Data"]);
  rPeriodeLabel.font = { bold: true };
  sheet.mergeCells(2, 1, 2, 2);
  rPeriodeLabel.commit();

  const rTahun = sheet.addRow(["Tahun :", periode]);
  rTahun.getCell(1).font = { bold: true }; // Hanya sel label "Tahun :" yang bold
  rTahun.getCell(2).font = { bold: false }; // Memastikan nilai tahunStr tidak bold
  rTahun.commit();

  sheet.addRow([]).commit();
  // ---- Header 2 baris ----
  // Kolom tanpa group di-merge vertikal; teksnya HARUS di baris atas (sel kiri-atas merge),
  // karena Excel hanya mempertahankan nilai sel tersebut.
  // Teks group hanya di kolom pertama tiap group.
  const baris0 = semuaKolom.map((k, i) => {
    if (!k.group) return k.header;
    return i > 0 && semuaKolom[i - 1].group === k.group ? "" : k.group;
  });
  const baris1 = semuaKolom.map((k) => (k.group ? k.header : ""));

  const r0 = sheet.addRow(baris0);
  const r1 = sheet.addRow(baris1);

  let c = 1;
  while (c <= totalKolom) {
    const k = semuaKolom[c - 1];
    if (!k.group) {
      sheet.mergeCells(r0.number, c, r1.number, c); // vertikal 2 baris
      c += 1;
    } else {
      let akhir = c; // kolom terakhir (1-based) dari group yang sama
      while (akhir < totalKolom && semuaKolom[akhir].group === k.group) akhir++;
      if (akhir > c) sheet.mergeCells(r0.number, c, r0.number, akhir); // horizontal
      c = akhir + 1;
    }
  }

  [r0, r1].forEach((r) => {
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = BORDER_TIPIS_319;
    });
    r.commit();
  });

  // ---- Isi data ----
  // Tiap RS hanya ±12 baris, jadi data dibaca per kelompok RS (bukan OFFSET/LIMIT):
  // tidak ada OFFSET yang makin lambat, dan urutan Excel = urut kode RS.
  const orgUrut = [...orgIdList].sort((a, b) =>
    String(orgToRsMap.get(a)?.kodeRs ?? "").localeCompare(
      String(orgToRsMap.get(b)?.kodeRs ?? ""),
      undefined,
      { numeric: true },
    ),
  );

  let totalBaris = 0;
  let no = 1;

  for (let i = 0; i < orgUrut.length; i += RS_PER_BATCH_319) {
    const chunk = orgUrut.slice(i, i + RS_PER_BATCH_319);

    const rows = await modelDetail.findAll({
      where: { organization_id: { [Op.in]: chunk }, tahun },
      raw: true,
    });

    // Urut: RS sesuai urutan chunk -> golongan naik -> baris TOTAL (id 0) paling bawah
    const posisiOrg = new Map(chunk.map((id, idx) => [id, idx]));
    rows.sort(
      (a, b) =>
        posisiOrg.get(a.organization_id) - posisiOrg.get(b.organization_id) ||
        Number(a.golongan_obat_id === 0) - Number(b.golongan_obat_id === 0) ||
        a.golongan_obat_id - b.golongan_obat_id,
    );

    for (const data of rows) {
      const rs = orgToRsMap.get(String(data.organization_id));
      const baris = {
        no: no++,
        kodeRs: rs?.kodeRs ?? "",
        namaRs: rs?.namaRs ?? "",
        // ...(tampilkanOrgId ? { organizationId: data.organization_id } : {}),
        provinsi: rs?.provinsiNama ?? "",
        kabKota: rs?.kabKotaNama ?? "",
        // tahun: data.tahun,
        golonganNo: data.golongan_no ?? "", // string, supaya "2.1" tidak jadi angka
        golonganNama: data.golongan_nama ?? "",
      };
      KOLOM_ANGKA_319.forEach((k) => {
        baris[k.key] = data[k.key] ?? 0;
      });

      const isTotal = Number(data.golongan_obat_id) === 0;
      const excelRow = sheet.addRow(baris);

      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = BORDER_TIPIS_319;
        cell.alignment = { vertical: "middle" };

        if (isTotal) {
          // Ambil konfigurasi kolom berdasarkan indeks (1-based index)
          const kolomAktif = semuaKolom[colNumber - 1];

          // Kolom yang TIDAK di-bold: no, kodeRs, namaRs, organizationId, provinsi, kabKota, tahun
          const isIdentitasRS = [
            "no",
            "kodeRs",
            "namaRs",
            // "organizationId",
            "provinsi",
            "kabKota",
            "tahun",
          ].includes(kolomAktif?.key);

          // Jika BUKAN identitas RS (berarti golonganNo, golonganNama, dan kolom-kolom angka), buat BOLD
          if (!isIdentitasRS) {
            cell.font = { bold: true };
          } else {
            cell.font = { bold: false };
          }
        }
      });

      excelRow.commit();
      totalBaris++;
    }
  }

  await sheet.commit();
  await workbook.commit();
  return totalBaris;
};

export const downloadDataRLTigaTitikSembilanBelas = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    provId: joi.string().allow("", null).optional(),
    kabId: joi.string().allow("", null).optional(),
    rsId: joi.string().allow("", null).optional(),
    periode: joi.date().format("YYYY").required(),
  });

  const { error, value } = schema.validate(req.query);
  if (error)
    return res
      .status(400)
      .send({ status: false, message: error.details[0].message });

  const jenisUserId = req.user.jenisUserId;

  if (jenisUserId === 2) {
    value.provId = req.user.satKerId;
  } else if (jenisUserId === 3) {
    value.kabId = req.user.satKerId;
    value.provId = undefined;
  }

  try {
    const baseUrl = process.env.API_FASKES;
    const username = process.env.username_API_FASKES;
    const password = process.env.password_API_FASKES;

    // Login selalu dilakukan di awal, dipakai oleh semua role (termasuk role 4)
    const loginResponse = await axios.post(
      `${baseUrl}/faskes/login`,
      { userName: username, password: password },
      { headers: { "Content-Type": "application/json" } },
    );

    const token =
      loginResponse.data.access_token || loginResponse.data.data.access_token;

    let rsList = [];
    let orgToRsMap = new Map();
    let orgIdList = [];

    if (jenisUserId === 4) {
      // ---- RS sendiri: ambil detail RS lewat endpoint /faskes/rumahsakit/{kodeRs} ----
      const kodeRsSendiri = req.user.satKerId;

      const rsDetailResponse = await axios.get(
        `${baseUrl}/faskes/rumahsakit/${kodeRsSendiri}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const rsDetail = rsDetailResponse.data.data ?? rsDetailResponse.data;

      const satuSehatMapping = await satu_sehat_id.findOne({
        where: { kode_baru_faskes: kodeRsSendiri },
        attributes: ["kode_baru_faskes", "organization_id"],
      });

      if (!satuSehatMapping) {
        return res.status(404).send({
          status: false,
          message: "Tidak ada mapping OrganizationId untuk RS ini",
        });
      }
      rsList = [
        {
          kodeRs: kodeRsSendiri,
          namaRs: rsDetail?.nama ?? "",
          provinsiNama: rsDetail?.provinsiNama ?? "",
          kabKotaNama: rsDetail?.kabKotaNama ?? "",
        },
      ];
    } else if (value.rsId) {
      // ---- Role 1/2/3 memilih RS spesifik: ambil detail 1 RS itu saja ----
      const rsDetailResponse = await axios.get(
        `${baseUrl}/faskes/rumahsakit/${value.rsId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const rsDetail = rsDetailResponse.data.data ?? rsDetailResponse.data;

      if (!rsDetail) {
        return res.status(404).send({
          status: false,
          message: "Rumah sakit tidak ditemukan",
        });
      }

      if (
        jenisUserId === 2 &&
        String(rsDetail.provinsiId) !== String(req.user.satKerId)
      ) {
        return res.status(403).send({
          status: false,
          message: "RS yang dipilih bukan berada di wilayah Anda",
        });
      }
      if (
        jenisUserId === 3 &&
        String(rsDetail.kabKotaId) !== String(req.user.satKerId)
      ) {
        return res.status(403).send({
          status: false,
          message: "RS yang dipilih bukan berada di wilayah Anda",
        });
      }

      rsList = [
        {
          kodeRs: value.rsId,
          namaRs: rsDetail?.nama ?? "",
          provinsiId: rsDetail?.provinsiId ?? null,
          kabKotaId: rsDetail?.kabKotaId ?? null,
          provinsiNama: rsDetail?.provinsiNama ?? "",
          kabKotaNama: rsDetail?.kabKotaNama ?? "",
        },
      ];
    } else {
      const params = {};

      switch (jenisUserId) {
        case 1:
          if (value.provId) params.provinsiId = value.provId;
          if (value.kabId) params.kabKotaId = value.kabId;
          break;
        case 2:
          params.provinsiId = req.user.satKerId;
          if (value.kabId) params.kabKotaId = value.kabId;
          break;
        case 3:
          params.kabKotaId = req.user.satKerId;
          break;
      }

      const listRs = await ambilSemuaRs(baseUrl, token, params);

      rsList = listRs
        .filter((rs) => rs.statusAktivasi === 1)
        .map((rs) => ({
          kodeRs: rs.kode,
          namaRs: rs.nama,
          provinsiId: rs.provinsi_id,
          kabKotaId: rs.kab_kota_id,
          provinsiNama: rs.provinsiNama,
          kabKotaNama: rs.kabKotaNama,
        }));

      if (rsList.length === 0) {
        return res.status(404).send({
          status: false,
          message: "Tidak ada rumah sakit aktif pada wilayah yang dipilih",
        });
      }
    }

    // ---- Generate nama file & set header ----
    const tahun = req.query.periode;
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const namaFile = `RL_3_19_${tahun}_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);

    // console.log("res :", res);
    // console.log("rsList:", rsList);

    await tulisExcelRL319({
      res,
      rsList,
      periode: req.query.periode,
      judul: "RL 3.19 Cara Bayar",
      modelDetail: rlTigaTitikSembilanBelasDetail,
    });
  } catch (err) {
    console.error(
      "downloadDataRLTigaTitikSembilanBelasSatuSehat:",
      err.message,
    );
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).send({
      status: false,
      message: "Gagal mengunduh data",
    });
  }
};

export const tulisExcelRL319 = async ({
  res,
  rsList,
  periode,
  judul = "RL 3.19 Cara Bayar",
  modelDetail = rlTigaTitikSembilanBelasDetail,
}) => {
  const kodeRsList = rsList.map((rs) => String(rs.kodeRs));
  const rsMap = new Map(rsList.map((rs) => [String(rs.kodeRs), rs]));
  const tahun = parseInt(periode, 10);

  // ---- Definisi Header Kolom ----
  const kolomIdentitas = [
    { header: "No", key: "no", width: 6 },
    { header: "Kode RS", key: "kodeRs", width: 14 },
    { header: "Nama RS", key: "namaRs", width: 35 },
    { header: "Provinsi", key: "provinsi", width: 22 },
    { header: "Kab/Kota", key: "kabKota", width: 22 },
    // { header: "Tahun", key: "tahun", width: 10 },
    { header: "No. Cara Bayar", key: "golonganNo", width: 16 },
    { header: "Cara Pembayaran", key: "golonganNama", width: 38 },
  ];

  const semuaKolom = [...kolomIdentitas, ...KOLOM_ANGKA_319];
  const totalKolom = semuaKolom.length;

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });

  const sheet = workbook.addWorksheet("RL 3.19", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 6 }],
  });

  sheet.columns = semuaKolom.map((k) => ({ key: k.key, width: k.width }));

  // ---- Block Judul & Info ----
  const rJudul = sheet.addRow([judul]);
  rJudul.font = { bold: true, size: 16 };
  sheet.mergeCells(1, 1, 1, 4);
  rJudul.commit();

  const rPeriodeLabel = sheet.addRow(["Periode Data"]);
  rPeriodeLabel.font = { bold: true };
  sheet.mergeCells(2, 1, 2, 2);
  rPeriodeLabel.commit();

  const rTahun = sheet.addRow(["Tahun :", periode]);
  rTahun.getCell(1).font = { bold: true };
  rTahun.getCell(2).font = { bold: false };
  rTahun.commit();

  sheet.addRow([]).commit(); // Baris Kosong

  // ---- Table Header ----
  const headerRow = sheet.addRow(semuaKolom.map((k) => k.header));
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = BORDER_TIPIS_319;
  });
  headerRow.commit();

  // Penampung Grand Total untuk Seluruh RS
  const grandTotal = {};
  KOLOM_ANGKA_319.forEach((k) => {
    grandTotal[k.key] = 0;
  });

  let totalBaris = 0;
  let no = 1;
  const RS_PER_BATCH = 100;

  for (let i = 0; i < kodeRsList.length; i += RS_PER_BATCH) {
    const chunk = kodeRsList.slice(i, i + RS_PER_BATCH);

    const rows = await modelDetail.findAll({
      where: {
        rs_id: { [Op.in]: chunk },
        tahun: tahun,
      },
      include: [
        {
          model: golonganObatTigaTitikSembilanBelas,
          as: "golongan_obat_rl_tiga_titik_sembilan_belas",
          attributes: ["id", "no", "nama"],
        },
      ],
      raw: true,
      nest: true,
    });

    if (!rows || rows.length === 0) continue;

    // ─── 1. GROUPING DATA BERDASARKAN RS_ID ───
    const groupedByRs = new Map();
    for (const data of rows) {
      const rsIdStr = String(data.rs_id);
      if (!groupedByRs.has(rsIdStr)) {
        groupedByRs.set(rsIdStr, []);
      }
      groupedByRs.get(rsIdStr).push(data);
    }

    // ─── 2. ITERASI PER RUMAH SAKIT ───
    for (const [rsId, items] of groupedByRs.entries()) {
      const rs = rsMap.get(rsId);

      // Urutkan item di dalam RS berdasarkan ID Golongan
      items.sort(
        (a, b) =>
          a.golongan_obat_rl_tiga_titik_sembilan_belas_id -
          b.golongan_obat_rl_tiga_titik_sembilan_belas_id,
      );

      // Inisialisasi Subtotal khusus untuk RS ini
      const subtotalRS = {};
      KOLOM_ANGKA_319.forEach((k) => {
        subtotalRS[k.key] = 0;
      });

      // Cetak Baris Detail RS
      for (const data of items) {
        const golNo =
          data.golongan_obat_rl_tiga_titik_sembilan_belas?.no ??
          data.golongan_no ??
          "";
        const golNama =
          data.golongan_obat_rl_tiga_titik_sembilan_belas?.nama ??
          data.golongan_nama ??
          "";

        const baris = {
          no: no++,
          kodeRs: rs?.kodeRs ?? data.rs_id ?? "",
          namaRs: rs?.namaRs ?? "",
          provinsi: rs?.provinsiNama ?? "",
          kabKota: rs?.kabKotaNama ?? "",
          // tahun: data.tahun,
          golonganNo: golNo,
          golonganNama: golNama,
        };

        // Akumulasi angka ke Subtotal RS & Grand Total
        KOLOM_ANGKA_319.forEach((k) => {
          const val = Number(data[k.key]) || 0;
          baris[k.key] = val;
          subtotalRS[k.key] += val; // Tambah ke total RS ini
          grandTotal[k.key] += val; // Tambah ke total seluruh RS
        });

        const excelRow = sheet.addRow(baris);
        excelRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = BORDER_TIPIS_319;
          cell.alignment = { vertical: "middle" };
        });
        excelRow.commit();
        totalBaris++;
      }

      // ─── 3. CETAK BARIS TOTAL PER RUMAH SAKIT ───
      const barisSubtotalRS = {
        no: "",
        kodeRs: rs?.kodeRs ?? rsId ?? "",
        namaRs: rs?.namaRs ?? "",
        provinsi: rs?.provinsiNama ?? "",
        kabKota: rs?.kabKotaNama ?? "",
        tahun: tahun,
        golonganNo: "",
        golonganNama: "TOTAL",
        ...subtotalRS,
      };

      const rSubtotal = sheet.addRow(barisSubtotalRS);
      rSubtotal.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true };
        cell.border = BORDER_TIPIS_319;
        cell.alignment = { vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F4F8" }, // Warna highlight lembut per RS (Soft Blue/Grey)
        };
      });
      rSubtotal.commit();
      totalBaris++;
    }
  }

  // ─── 4. CETAK BARIS TOTAL KESELURUHAN (AKHIR FILE) ───
  // const barisGrandTotal = {
  //   no: "",
  //   kodeRs: "",
  //   namaRs: "",
  //   provinsi: "",
  //   kabKota: "",
  //   tahun: "",
  //   golonganNo: "",
  //   golonganNama: "TOTAL KESELURUHAN",
  //   ...grandTotal,
  // };

  // const rGrandTotal = sheet.addRow(barisGrandTotal);
  // rGrandTotal.eachCell({ includeEmpty: true }, (cell) => {
  //   cell.font = { bold: true };
  //   cell.border = BORDER_TIPIS_319;
  //   cell.alignment = { vertical: "middle" };
  //   cell.fill = {
  //     type: "pattern",
  //     pattern: "solid",
  //     fgColor: { argb: "FFE6E6E6" }, // Highlight warna abu-abu terang
  //   };
  // });
  // rGrandTotal.commit();

  await sheet.commit();
  await workbook.commit();
  return totalBaris;
};
