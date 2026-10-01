import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import { IcdRLLimaTitikSatu } from "../models/IcdRLLimaTitikSatuModel.js";
import joiDate from "@joi/date";
import {
  rlLimaTitikSatuDetail,
  rlLimaTitikSatuHeader,
  rlLimaTitikSatuSatuSehat,
} from "../models/RLLimaTitikSatuModel.js";
import { satu_sehat_id, users_sso } from "../models/UserModel.js";
import axios from "axios";
import dotenv from "dotenv";
import { AgeGroups } from "../models/AgeGroups.js";
import { Op } from "sequelize";
import { icd } from "../models/ICDModel.js";
import ExcelJS from "exceljs";

import {
  doSyncRL51,
  getLastSyncInfoRL51,
  isSyncingRL51,
  isStaleRL51,
} from "../services/rl51Sync.service.js";

dotenv.config();

export const getDataRLLimaTitikSatu = (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY-MM").required(),
    page: joi.number(),
    limit: joi.number(),
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
      periode: req.query.periode,
    };
  } else {
    whereClause = {
      rs_id: req.query.rsId,
      periode: req.query.periode,
    };
  }

  rlLimaTitikSatuDetail
    .findAll({
      include: {
        model: IcdRLLimaTitikSatu,
        attributes: [
          "icd_code",
          "description_code",
          "icd_code_group",
          "description_code_group",
        ],
      },
      where: whereClause,
      raw: true,
      nest: true,
    })
    .then((results) => {
      // const plainResults = results.map(r => r.toJSON()); // <-- ini penting
      const jsonString = JSON.stringify(results);
      const size = Buffer.byteLength(jsonString, "utf8");

      res.status(200).send({
        status: true,
        message: "data found",
        length: results.length,
        size_bytes: size,
        size_kb: (size / 1024).toFixed(2),
        size_mb: (size / (1024 * 1024)).toFixed(2),
        data: results, // <-- kirim plain object
      });
    })
    .catch((err) => {
      console.error("SEQUELIZE ERROR:", err); // <-- log error ke console
      res.status(422).send({
        status: false,
        message: err,
      });
      return;
    });
};

export const getDataRLLimaTitikSatuPaging = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY-MM").required(),
    page: joi.number().min(1).default(1),
    limit: joi.number().min(1).max(200).default(50),
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
      periode: req.query.periode,
    };
  } else {
    whereClause = {
      rs_id: req.query.rsId,
      periode: req.query.periode,
    };
  }

  const { page, limit, rsId, periode } = value;
  const offset = (page - 1) * limit;

  try {
    const rows = await rlLimaTitikSatuDetail.findAll({
      include: {
        model: icd,
        attributes: [
          "icd_code",
          "description_code",
          "icd_code_group",
          "description_code_group",
        ],
      },
      where: whereClause,
      limit,
      offset,
      order: [["id", "ASC"]],
    });

    const totalRows = await rlLimaTitikSatuDetail.count({
      where: whereClause,
    });

    return res.status(200).send({
      status: true,
      message: "data found",
      data: rows,
      pagination: {
        page,
        limit,
        totalRows,
        totalPages: Math.ceil(totalRows / limit),
      },
    });
  } catch (err) {
    return res.status(422).send({
      status: false,
      message: err.message,
    });
  }
};

export const getDataRLLimaTitikSatuById = (req, res) => {
  rlLimaTitikSatuDetail
    .findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: IcdRLLimaTitikSatu,
        attributes: [
          "icd_code",
          "description_code",
          "icd_code_group",
          "description_code_group",
        ],
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

export const insertdataRLLimaTitikSatu = async (req, res) => {
  const schema = Joi.object({
    periodeBulan: Joi.number().greater(0).less(13).required(),
    periodeTahun: Joi.number().greater(2022).required(),
    data: Joi.array()
      .items(
        Joi.object()
          .keys({
            icdId: Joi.number().required(),
            jumlah_L_dibawah_1_jam: Joi.number().min(0).required(),
            jumlah_P_dibawah_1_jam: Joi.number().min(0).required(),
            jumlah_L_1_sampai_23_jam: Joi.number().min(0).required(),
            jumlah_P_1_sampai_23_jam: Joi.number().min(0).required(),
            jumlah_L_1_sampai_7_hari: Joi.number().min(0).required(),
            jumlah_P_1_sampai_7_hari: Joi.number().min(0).required(),
            jumlah_L_8_sampai_28_hari: Joi.number().min(0).required(),
            jumlah_P_8_sampai_28_hari: Joi.number().min(0).required(),
            jumlah_L_29_hari_sampai_dibawah_3_bulan: Joi.number()
              .min(0)
              .required(),
            jumlah_P_29_hari_sampai_dibawah_3_bulan: Joi.number()
              .min(0)
              .required(),
            jumlah_L_3_bulan_sampai_dibawah_6_bulan: Joi.number()
              .min(0)
              .required(),
            jumlah_P_3_bulan_sampai_dibawah_6_bulan: Joi.number()
              .min(0)
              .required(),
            jumlah_L_6_bulan_sampai_11_bulan: Joi.number().min(0).required(),
            jumlah_P_6_bulan_sampai_11_bulan: Joi.number().min(0).required(),
            jumlah_L_1_sampai_4_tahun: Joi.number().min(0).required(),
            jumlah_P_1_sampai_4_tahun: Joi.number().min(0).required(),
            jumlah_L_5_sampai_9_tahun: Joi.number().min(0).required(),
            jumlah_P_5_sampai_9_tahun: Joi.number().min(0).required(),
            jumlah_L_10_sampai_14_tahun: Joi.number().min(0).required(),
            jumlah_P_10_sampai_14_tahun: Joi.number().min(0).required(),
            jumlah_L_15_sampai_19_tahun: Joi.number().min(0).required(),
            jumlah_P_15_sampai_19_tahun: Joi.number().min(0).required(),
            jumlah_L_20_sampai_24_tahun: Joi.number().min(0).required(),
            jumlah_P_20_sampai_24_tahun: Joi.number().min(0).required(),
            jumlah_L_25_sampai_29_tahun: Joi.number().min(0).required(),
            jumlah_P_25_sampai_29_tahun: Joi.number().min(0).required(),
            jumlah_L_30_sampai_34_tahun: Joi.number().min(0).required(),
            jumlah_P_30_sampai_34_tahun: Joi.number().min(0).required(),
            jumlah_L_35_sampai_39_tahun: Joi.number().min(0).required(),
            jumlah_P_35_sampai_39_tahun: Joi.number().min(0).required(),
            jumlah_L_40_sampai_44_tahun: Joi.number().min(0).required(),
            jumlah_P_40_sampai_44_tahun: Joi.number().min(0).required(),
            jumlah_L_45_sampai_49_tahun: Joi.number().min(0).required(),
            jumlah_P_45_sampai_49_tahun: Joi.number().min(0).required(),
            jumlah_L_50_sampai_54_tahun: Joi.number().min(0).required(),
            jumlah_P_50_sampai_54_tahun: Joi.number().min(0).required(),
            jumlah_L_55_sampai_59_tahun: Joi.number().min(0).required(),
            jumlah_P_55_sampai_59_tahun: Joi.number().min(0).required(),
            jumlah_L_60_sampai_64_tahun: Joi.number().min(0).required(),
            jumlah_P_60_sampai_64_tahun: Joi.number().min(0).required(),
            jumlah_L_65_sampai_69_tahun: Joi.number().min(0).required(),
            jumlah_P_65_sampai_69_tahun: Joi.number().min(0).required(),
            jumlah_L_70_sampai_74_tahun: Joi.number().min(0).required(),
            jumlah_P_70_sampai_74_tahun: Joi.number().min(0).required(),
            jumlah_L_75_sampai_79_tahun: Joi.number().min(0).required(),
            jumlah_P_75_sampai_79_tahun: Joi.number().min(0).required(),
            jumlah_L_80_sampai_84_tahun: Joi.number().min(0).required(),
            jumlah_P_80_sampai_84_tahun: Joi.number().min(0).required(),
            jumlah_L_diatas_85_tahun: Joi.number().min(0).required(),
            jumlah_P_diatas_85_tahun: Joi.number().min(0).required(),
            jumlah_kunjungan_L: Joi.number().min(0).required(),
            jumlah_kunjungan_P: Joi.number().min(0).required(),
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
    const periode =
      String(req.body.periodeTahun) +
      "-" +
      String(req.body.periodeBulan) +
      "-1";

    transaction = await databaseSIRS.transaction();
    const resultInsertHeader = await rlLimaTitikSatuHeader.create(
      {
        rs_id: req.user.satKerId,
        periode: periode,
        user_id: req.user.id,
      },
      { transaction },
    );

    const dataDetail = req.body.data.map((value, index) => {
      let totalL =
        value.jumlah_L_dibawah_1_jam +
        value.jumlah_L_1_sampai_23_jam +
        value.jumlah_L_1_sampai_7_hari +
        value.jumlah_L_8_sampai_28_hari +
        value.jumlah_L_29_hari_sampai_dibawah_3_bulan +
        value.jumlah_L_3_bulan_sampai_dibawah_6_bulan +
        value.jumlah_L_6_bulan_sampai_11_bulan +
        value.jumlah_L_1_sampai_4_tahun +
        value.jumlah_L_5_sampai_9_tahun +
        value.jumlah_L_10_sampai_14_tahun +
        value.jumlah_L_15_sampai_19_tahun +
        value.jumlah_L_20_sampai_24_tahun +
        value.jumlah_L_25_sampai_29_tahun +
        value.jumlah_L_30_sampai_34_tahun +
        value.jumlah_L_35_sampai_39_tahun +
        value.jumlah_L_40_sampai_44_tahun +
        value.jumlah_L_45_sampai_49_tahun +
        value.jumlah_L_50_sampai_54_tahun +
        value.jumlah_L_55_sampai_59_tahun +
        value.jumlah_L_60_sampai_64_tahun +
        value.jumlah_L_65_sampai_69_tahun +
        value.jumlah_L_70_sampai_74_tahun +
        value.jumlah_L_75_sampai_79_tahun +
        value.jumlah_L_80_sampai_84_tahun +
        value.jumlah_L_diatas_85_tahun;

      let totalP =
        value.jumlah_P_dibawah_1_jam +
        value.jumlah_P_1_sampai_23_jam +
        value.jumlah_P_1_sampai_7_hari +
        value.jumlah_P_8_sampai_28_hari +
        value.jumlah_P_29_hari_sampai_dibawah_3_bulan +
        value.jumlah_P_3_bulan_sampai_dibawah_6_bulan +
        value.jumlah_P_6_bulan_sampai_11_bulan +
        value.jumlah_P_1_sampai_4_tahun +
        value.jumlah_P_5_sampai_9_tahun +
        value.jumlah_P_10_sampai_14_tahun +
        value.jumlah_P_15_sampai_19_tahun +
        value.jumlah_P_20_sampai_24_tahun +
        value.jumlah_P_25_sampai_29_tahun +
        value.jumlah_P_30_sampai_34_tahun +
        value.jumlah_P_35_sampai_39_tahun +
        value.jumlah_P_40_sampai_44_tahun +
        value.jumlah_P_45_sampai_49_tahun +
        value.jumlah_P_50_sampai_54_tahun +
        value.jumlah_P_55_sampai_59_tahun +
        value.jumlah_P_60_sampai_64_tahun +
        value.jumlah_P_65_sampai_69_tahun +
        value.jumlah_P_70_sampai_74_tahun +
        value.jumlah_P_75_sampai_79_tahun +
        value.jumlah_P_80_sampai_84_tahun +
        value.jumlah_P_diatas_85_tahun;

      let total = totalL + totalP;

      let totalkunjungan = value.jumlah_kunjungan_L + value.jumlah_kunjungan_P;

      return {
        rl_lima_titik_satu_id: resultInsertHeader.id,
        rs_id: req.user.satKerId,
        periode: periode,
        icd_id: value.icdId,
        jumlah_L_dibawah_1_jam: value.jumlah_L_dibawah_1_jam,
        jumlah_P_dibawah_1_jam: value.jumlah_P_dibawah_1_jam,
        jumlah_L_1_sampai_23_jam: value.jumlah_L_1_sampai_23_jam,
        jumlah_P_1_sampai_23_jam: value.jumlah_P_1_sampai_23_jam,
        jumlah_L_1_sampai_7_hari: value.jumlah_L_1_sampai_7_hari,
        jumlah_P_1_sampai_7_hari: value.jumlah_P_1_sampai_7_hari,
        jumlah_L_8_sampai_28_hari: value.jumlah_L_8_sampai_28_hari,
        jumlah_P_8_sampai_28_hari: value.jumlah_P_8_sampai_28_hari,
        jumlah_L_29_hari_sampai_dibawah_3_bulan:
          value.jumlah_L_29_hari_sampai_dibawah_3_bulan,
        jumlah_P_29_hari_sampai_dibawah_3_bulan:
          value.jumlah_P_29_hari_sampai_dibawah_3_bulan,
        jumlah_L_3_bulan_sampai_dibawah_6_bulan:
          value.jumlah_L_3_bulan_sampai_dibawah_6_bulan,
        jumlah_P_3_bulan_sampai_dibawah_6_bulan:
          value.jumlah_P_3_bulan_sampai_dibawah_6_bulan,
        jumlah_L_6_bulan_sampai_11_bulan:
          value.jumlah_L_6_bulan_sampai_11_bulan,
        jumlah_P_6_bulan_sampai_11_bulan:
          value.jumlah_P_6_bulan_sampai_11_bulan,
        jumlah_L_1_sampai_4_tahun: value.jumlah_L_1_sampai_4_tahun,
        jumlah_P_1_sampai_4_tahun: value.jumlah_P_1_sampai_4_tahun,
        jumlah_L_5_sampai_9_tahun: value.jumlah_L_5_sampai_9_tahun,
        jumlah_P_5_sampai_9_tahun: value.jumlah_P_5_sampai_9_tahun,
        jumlah_L_10_sampai_14_tahun: value.jumlah_L_10_sampai_14_tahun,
        jumlah_P_10_sampai_14_tahun: value.jumlah_P_10_sampai_14_tahun,
        jumlah_L_15_sampai_19_tahun: value.jumlah_L_15_sampai_19_tahun,
        jumlah_P_15_sampai_19_tahun: value.jumlah_P_15_sampai_19_tahun,
        jumlah_L_20_sampai_24_tahun: value.jumlah_L_20_sampai_24_tahun,
        jumlah_P_20_sampai_24_tahun: value.jumlah_P_20_sampai_24_tahun,
        jumlah_L_25_sampai_29_tahun: value.jumlah_L_25_sampai_29_tahun,
        jumlah_P_25_sampai_29_tahun: value.jumlah_P_25_sampai_29_tahun,
        jumlah_L_30_sampai_34_tahun: value.jumlah_L_30_sampai_34_tahun,
        jumlah_P_30_sampai_34_tahun: value.jumlah_P_30_sampai_34_tahun,
        jumlah_L_35_sampai_39_tahun: value.jumlah_L_35_sampai_39_tahun,
        jumlah_P_35_sampai_39_tahun: value.jumlah_P_35_sampai_39_tahun,
        jumlah_L_40_sampai_44_tahun: value.jumlah_L_40_sampai_44_tahun,
        jumlah_P_40_sampai_44_tahun: value.jumlah_P_40_sampai_44_tahun,
        jumlah_L_45_sampai_49_tahun: value.jumlah_L_45_sampai_49_tahun,
        jumlah_P_45_sampai_49_tahun: value.jumlah_P_45_sampai_49_tahun,
        jumlah_L_50_sampai_54_tahun: value.jumlah_L_50_sampai_54_tahun,
        jumlah_P_50_sampai_54_tahun: value.jumlah_P_50_sampai_54_tahun,
        jumlah_L_55_sampai_59_tahun: value.jumlah_L_55_sampai_59_tahun,
        jumlah_P_55_sampai_59_tahun: value.jumlah_P_55_sampai_59_tahun,
        jumlah_L_60_sampai_64_tahun: value.jumlah_L_60_sampai_64_tahun,
        jumlah_P_60_sampai_64_tahun: value.jumlah_P_60_sampai_64_tahun,
        jumlah_L_65_sampai_69_tahun: value.jumlah_L_65_sampai_69_tahun,
        jumlah_P_65_sampai_69_tahun: value.jumlah_P_65_sampai_69_tahun,
        jumlah_L_70_sampai_74_tahun: value.jumlah_L_70_sampai_74_tahun,
        jumlah_P_70_sampai_74_tahun: value.jumlah_P_70_sampai_74_tahun,
        jumlah_L_75_sampai_79_tahun: value.jumlah_L_75_sampai_79_tahun,
        jumlah_P_75_sampai_79_tahun: value.jumlah_P_75_sampai_79_tahun,
        jumlah_L_80_sampai_84_tahun: value.jumlah_L_80_sampai_84_tahun,
        jumlah_P_80_sampai_84_tahun: value.jumlah_P_80_sampai_84_tahun,
        jumlah_L_diatas_85_tahun: value.jumlah_L_diatas_85_tahun,
        jumlah_P_diatas_85_tahun: value.jumlah_P_diatas_85_tahun,
        jumlah_kasus_baru_L: totalL,
        jumlah_kasus_baru_P: totalP,
        total_kasus_baru: total,
        jumlah_kunjungan_L: value.jumlah_kunjungan_L,
        jumlah_kunjungan_P: value.jumlah_kunjungan_P,
        total_jumlah_kunjungan: totalkunjungan,
        user_id: req.user.id,
      };
    });

    if (
      dataDetail[0].total_kasus_baru <= dataDetail[0].total_jumlah_kunjungan
    ) {
      if (
        dataDetail[0].jumlah_kasus_baru_L <= dataDetail[0].jumlah_kunjungan_L
      ) {
        if (
          dataDetail[0].jumlah_kasus_baru_P <= dataDetail[0].jumlah_kunjungan_P
        ) {
          try {
            const resultInsertDetail = await rlLimaTitikSatuDetail.bulkCreate(
              dataDetail,
              {
                transaction,
                updateOnDuplicate: [
                  "rl_lima_titik_satu_id",
                  "jumlah_L_dibawah_1_jam",
                  "jumlah_P_dibawah_1_jam",
                  "jumlah_L_1_sampai_23_jam",
                  "jumlah_P_1_sampai_23_jam",
                  "jumlah_L_1_sampai_7_hari",
                  "jumlah_P_1_sampai_7_hari",
                  "jumlah_L_8_sampai_28_hari",
                  "jumlah_P_8_sampai_28_hari",
                  "jumlah_L_29_hari_sampai_dibawah_3_bulan",
                  "jumlah_P_29_hari_sampai_dibawah_3_bulan",
                  "jumlah_L_3_bulan_sampai_dibawah_6_bulan",
                  "jumlah_P_3_bulan_sampai_dibawah_6_bulan",
                  "jumlah_L_6_bulan_sampai_11_bulan",
                  "jumlah_P_6_bulan_sampai_11_bulan",
                  "jumlah_L_1_sampai_4_tahun",
                  "jumlah_P_1_sampai_4_tahun",
                  "jumlah_L_5_sampai_9_tahun",
                  "jumlah_P_5_sampai_9_tahun",
                  "jumlah_L_10_sampai_14_tahun",
                  "jumlah_P_10_sampai_14_tahun",
                  "jumlah_L_15_sampai_19_tahun",
                  "jumlah_P_15_sampai_19_tahun",
                  "jumlah_L_20_sampai_24_tahun",
                  "jumlah_P_20_sampai_24_tahun",
                  "jumlah_L_25_sampai_29_tahun",
                  "jumlah_P_25_sampai_29_tahun",
                  "jumlah_L_30_sampai_34_tahun",
                  "jumlah_P_30_sampai_34_tahun",
                  "jumlah_L_35_sampai_39_tahun",
                  "jumlah_P_35_sampai_39_tahun",
                  "jumlah_L_40_sampai_44_tahun",
                  "jumlah_P_40_sampai_44_tahun",
                  "jumlah_L_45_sampai_49_tahun",
                  "jumlah_P_45_sampai_49_tahun",
                  "jumlah_L_50_sampai_54_tahun",
                  "jumlah_P_50_sampai_54_tahun",
                  "jumlah_L_55_sampai_59_tahun",
                  "jumlah_P_55_sampai_59_tahun",
                  "jumlah_L_60_sampai_64_tahun",
                  "jumlah_P_60_sampai_64_tahun",
                  "jumlah_L_65_sampai_69_tahun",
                  "jumlah_P_65_sampai_69_tahun",
                  "jumlah_L_70_sampai_74_tahun",
                  "jumlah_P_70_sampai_74_tahun",
                  "jumlah_L_75_sampai_79_tahun",
                  "jumlah_P_75_sampai_79_tahun",
                  "jumlah_L_80_sampai_84_tahun",
                  "jumlah_P_80_sampai_84_tahun",
                  "jumlah_L_diatas_85_tahun",
                  "jumlah_P_diatas_85_tahun",
                  "jumlah_kasus_baru_L",
                  "jumlah_kasus_baru_P",
                  "total_kasus_baru",
                  "jumlah_kunjungan_L",
                  "jumlah_kunjungan_P",
                  "total_jumlah_kunjungan",
                ],
              },
            );
            await transaction.commit();
            res.status(201).send({
              status: true,
              message: "data created",
              data: {
                id: resultInsertHeader.id,
              },
            });
          } catch (error) {
            res.status(400).send({
              status: false,
              message: "Gagal Input Data.",
            });
            console.log(error);
            await transaction.rollback();
          }
        } else {
          res.status(400).send({
            status: false,
            message:
              "Data Jumlah Kasus Baru Perempuan Lebih Dari Jumlah Kunjungan Pasien Perempuan",
          });
          await transaction.rollback();
        }
      } else {
        res.status(400).send({
          status: false,
          message:
            "Data Jumlah Kasus Baru Laki - Laki Lebih Dari Jumlah Kunjungan Pasien Laki Laki",
        });
        await transaction.rollback();
      }
    } else {
      res.status(400).send({
        status: false,
        message: "Data Jumlah Kasus Baru Lebih Dari Jumlah Kunjungan",
      });
      await transaction.rollback();
    }
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
        });
      }
      await transaction.rollback();
    }
  }
};

export const updateDataRLLimaTitikSatu = async (req, res) => {
  const schema = Joi.object({
    jumlah_L_dibawah_1_jam: Joi.number().min(0).required(),
    jumlah_P_dibawah_1_jam: Joi.number().min(0).required(),
    jumlah_L_1_sampai_23_jam: Joi.number().min(0).required(),
    jumlah_P_1_sampai_23_jam: Joi.number().min(0).required(),
    jumlah_L_1_sampai_7_hari: Joi.number().min(0).required(),
    jumlah_P_1_sampai_7_hari: Joi.number().min(0).required(),
    jumlah_L_8_sampai_28_hari: Joi.number().min(0).required(),
    jumlah_P_8_sampai_28_hari: Joi.number().min(0).required(),
    jumlah_L_29_hari_sampai_dibawah_3_bulan: Joi.number().min(0).required(),
    jumlah_P_29_hari_sampai_dibawah_3_bulan: Joi.number().min(0).required(),
    jumlah_L_3_bulan_sampai_dibawah_6_bulan: Joi.number().min(0).required(),
    jumlah_P_3_bulan_sampai_dibawah_6_bulan: Joi.number().min(0).required(),
    jumlah_L_6_bulan_sampai_11_bulan: Joi.number().min(0).required(),
    jumlah_P_6_bulan_sampai_11_bulan: Joi.number().min(0).required(),
    jumlah_L_1_sampai_4_tahun: Joi.number().min(0).required(),
    jumlah_P_1_sampai_4_tahun: Joi.number().min(0).required(),
    jumlah_L_5_sampai_9_tahun: Joi.number().min(0).required(),
    jumlah_P_5_sampai_9_tahun: Joi.number().min(0).required(),
    jumlah_L_10_sampai_14_tahun: Joi.number().min(0).required(),
    jumlah_P_10_sampai_14_tahun: Joi.number().min(0).required(),
    jumlah_L_15_sampai_19_tahun: Joi.number().min(0).required(),
    jumlah_P_15_sampai_19_tahun: Joi.number().min(0).required(),
    jumlah_L_20_sampai_24_tahun: Joi.number().min(0).required(),
    jumlah_P_20_sampai_24_tahun: Joi.number().min(0).required(),
    jumlah_L_25_sampai_29_tahun: Joi.number().min(0).required(),
    jumlah_P_25_sampai_29_tahun: Joi.number().min(0).required(),
    jumlah_L_30_sampai_34_tahun: Joi.number().min(0).required(),
    jumlah_P_30_sampai_34_tahun: Joi.number().min(0).required(),
    jumlah_L_35_sampai_39_tahun: Joi.number().min(0).required(),
    jumlah_P_35_sampai_39_tahun: Joi.number().min(0).required(),
    jumlah_L_40_sampai_44_tahun: Joi.number().min(0).required(),
    jumlah_P_40_sampai_44_tahun: Joi.number().min(0).required(),
    jumlah_L_45_sampai_49_tahun: Joi.number().min(0).required(),
    jumlah_P_45_sampai_49_tahun: Joi.number().min(0).required(),
    jumlah_L_50_sampai_54_tahun: Joi.number().min(0).required(),
    jumlah_P_50_sampai_54_tahun: Joi.number().min(0).required(),
    jumlah_L_55_sampai_59_tahun: Joi.number().min(0).required(),
    jumlah_P_55_sampai_59_tahun: Joi.number().min(0).required(),
    jumlah_L_60_sampai_64_tahun: Joi.number().min(0).required(),
    jumlah_P_60_sampai_64_tahun: Joi.number().min(0).required(),
    jumlah_L_65_sampai_69_tahun: Joi.number().min(0).required(),
    jumlah_P_65_sampai_69_tahun: Joi.number().min(0).required(),
    jumlah_L_70_sampai_74_tahun: Joi.number().min(0).required(),
    jumlah_P_70_sampai_74_tahun: Joi.number().min(0).required(),
    jumlah_L_75_sampai_79_tahun: Joi.number().min(0).required(),
    jumlah_P_75_sampai_79_tahun: Joi.number().min(0).required(),
    jumlah_L_80_sampai_84_tahun: Joi.number().min(0).required(),
    jumlah_P_80_sampai_84_tahun: Joi.number().min(0).required(),
    jumlah_L_diatas_85_tahun: Joi.number().min(0).required(),
    jumlah_P_diatas_85_tahun: Joi.number().min(0).required(),
    jumlah_kunjungan_L: Joi.number().min(0).required(),
    jumlah_kunjungan_P: Joi.number().min(0).required(),
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
    let totalL =
      req.body.jumlah_L_dibawah_1_jam +
      req.body.jumlah_L_1_sampai_23_jam +
      req.body.jumlah_L_1_sampai_7_hari +
      req.body.jumlah_L_8_sampai_28_hari +
      req.body.jumlah_L_29_hari_sampai_dibawah_3_bulan +
      req.body.jumlah_L_3_bulan_sampai_dibawah_6_bulan +
      req.body.jumlah_L_6_bulan_sampai_11_bulan +
      req.body.jumlah_L_1_sampai_4_tahun +
      req.body.jumlah_L_5_sampai_9_tahun +
      req.body.jumlah_L_10_sampai_14_tahun +
      req.body.jumlah_L_15_sampai_19_tahun +
      req.body.jumlah_L_20_sampai_24_tahun +
      req.body.jumlah_L_25_sampai_29_tahun +
      req.body.jumlah_L_30_sampai_34_tahun +
      req.body.jumlah_L_35_sampai_39_tahun +
      req.body.jumlah_L_40_sampai_44_tahun +
      req.body.jumlah_L_45_sampai_49_tahun +
      req.body.jumlah_L_50_sampai_54_tahun +
      req.body.jumlah_L_55_sampai_59_tahun +
      req.body.jumlah_L_60_sampai_64_tahun +
      req.body.jumlah_L_65_sampai_69_tahun +
      req.body.jumlah_L_70_sampai_74_tahun +
      req.body.jumlah_L_75_sampai_79_tahun +
      req.body.jumlah_L_80_sampai_84_tahun +
      req.body.jumlah_L_diatas_85_tahun;

    let totalP =
      req.body.jumlah_P_dibawah_1_jam +
      req.body.jumlah_P_1_sampai_23_jam +
      req.body.jumlah_P_1_sampai_7_hari +
      req.body.jumlah_P_8_sampai_28_hari +
      req.body.jumlah_P_29_hari_sampai_dibawah_3_bulan +
      req.body.jumlah_P_3_bulan_sampai_dibawah_6_bulan +
      req.body.jumlah_P_6_bulan_sampai_11_bulan +
      req.body.jumlah_P_1_sampai_4_tahun +
      req.body.jumlah_P_5_sampai_9_tahun +
      req.body.jumlah_P_10_sampai_14_tahun +
      req.body.jumlah_P_15_sampai_19_tahun +
      req.body.jumlah_P_20_sampai_24_tahun +
      req.body.jumlah_P_25_sampai_29_tahun +
      req.body.jumlah_P_30_sampai_34_tahun +
      req.body.jumlah_P_35_sampai_39_tahun +
      req.body.jumlah_P_40_sampai_44_tahun +
      req.body.jumlah_P_45_sampai_49_tahun +
      req.body.jumlah_P_50_sampai_54_tahun +
      req.body.jumlah_P_55_sampai_59_tahun +
      req.body.jumlah_P_60_sampai_64_tahun +
      req.body.jumlah_P_65_sampai_69_tahun +
      req.body.jumlah_P_70_sampai_74_tahun +
      req.body.jumlah_P_75_sampai_79_tahun +
      req.body.jumlah_P_80_sampai_84_tahun +
      req.body.jumlah_P_diatas_85_tahun;

    let total = totalL + totalP;

    let totalkunjungan =
      req.body.jumlah_kunjungan_L + req.body.jumlah_kunjungan_P;

    const dataUpdate = {
      jumlah_L_dibawah_1_jam: req.body.jumlah_L_dibawah_1_jam,
      jumlah_P_dibawah_1_jam: req.body.jumlah_P_dibawah_1_jam,
      jumlah_L_1_sampai_23_jam: req.body.jumlah_L_1_sampai_23_jam,
      jumlah_P_1_sampai_23_jam: req.body.jumlah_P_1_sampai_23_jam,
      jumlah_L_1_sampai_7_hari: req.body.jumlah_L_1_sampai_7_hari,
      jumlah_P_1_sampai_7_hari: req.body.jumlah_P_1_sampai_7_hari,
      jumlah_L_8_sampai_28_hari: req.body.jumlah_L_8_sampai_28_hari,
      jumlah_P_8_sampai_28_hari: req.body.jumlah_P_8_sampai_28_hari,
      jumlah_L_29_hari_sampai_dibawah_3_bulan:
        req.body.jumlah_L_29_hari_sampai_dibawah_3_bulan,
      jumlah_P_29_hari_sampai_dibawah_3_bulan:
        req.body.jumlah_P_29_hari_sampai_dibawah_3_bulan,
      jumlah_L_3_bulan_sampai_dibawah_6_bulan:
        req.body.jumlah_L_3_bulan_sampai_dibawah_6_bulan,
      jumlah_P_3_bulan_sampai_dibawah_6_bulan:
        req.body.jumlah_P_3_bulan_sampai_dibawah_6_bulan,
      jumlah_L_6_bulan_sampai_11_bulan:
        req.body.jumlah_L_6_bulan_sampai_11_bulan,
      jumlah_P_6_bulan_sampai_11_bulan:
        req.body.jumlah_P_6_bulan_sampai_11_bulan,
      jumlah_L_1_sampai_4_tahun: req.body.jumlah_L_1_sampai_4_tahun,
      jumlah_P_1_sampai_4_tahun: req.body.jumlah_P_1_sampai_4_tahun,
      jumlah_L_5_sampai_9_tahun: req.body.jumlah_L_5_sampai_9_tahun,
      jumlah_P_5_sampai_9_tahun: req.body.jumlah_P_5_sampai_9_tahun,
      jumlah_L_10_sampai_14_tahun: req.body.jumlah_L_10_sampai_14_tahun,
      jumlah_P_10_sampai_14_tahun: req.body.jumlah_P_10_sampai_14_tahun,
      jumlah_L_15_sampai_19_tahun: req.body.jumlah_L_15_sampai_19_tahun,
      jumlah_P_15_sampai_19_tahun: req.body.jumlah_P_15_sampai_19_tahun,
      jumlah_L_20_sampai_24_tahun: req.body.jumlah_L_20_sampai_24_tahun,
      jumlah_P_20_sampai_24_tahun: req.body.jumlah_P_20_sampai_24_tahun,
      jumlah_L_25_sampai_29_tahun: req.body.jumlah_L_25_sampai_29_tahun,
      jumlah_P_25_sampai_29_tahun: req.body.jumlah_P_25_sampai_29_tahun,
      jumlah_L_30_sampai_34_tahun: req.body.jumlah_L_30_sampai_34_tahun,
      jumlah_P_30_sampai_34_tahun: req.body.jumlah_P_30_sampai_34_tahun,
      jumlah_L_35_sampai_39_tahun: req.body.jumlah_L_35_sampai_39_tahun,
      jumlah_P_35_sampai_39_tahun: req.body.jumlah_P_35_sampai_39_tahun,
      jumlah_L_40_sampai_44_tahun: req.body.jumlah_L_40_sampai_44_tahun,
      jumlah_P_40_sampai_44_tahun: req.body.jumlah_P_40_sampai_44_tahun,
      jumlah_L_45_sampai_49_tahun: req.body.jumlah_L_45_sampai_49_tahun,
      jumlah_P_45_sampai_49_tahun: req.body.jumlah_P_45_sampai_49_tahun,
      jumlah_L_50_sampai_54_tahun: req.body.jumlah_L_50_sampai_54_tahun,
      jumlah_P_50_sampai_54_tahun: req.body.jumlah_P_50_sampai_54_tahun,
      jumlah_L_55_sampai_59_tahun: req.body.jumlah_L_55_sampai_59_tahun,
      jumlah_P_55_sampai_59_tahun: req.body.jumlah_P_55_sampai_59_tahun,
      jumlah_L_60_sampai_64_tahun: req.body.jumlah_L_60_sampai_64_tahun,
      jumlah_P_60_sampai_64_tahun: req.body.jumlah_P_60_sampai_64_tahun,
      jumlah_L_65_sampai_69_tahun: req.body.jumlah_L_65_sampai_69_tahun,
      jumlah_P_65_sampai_69_tahun: req.body.jumlah_P_65_sampai_69_tahun,
      jumlah_L_70_sampai_74_tahun: req.body.jumlah_L_70_sampai_74_tahun,
      jumlah_P_70_sampai_74_tahun: req.body.jumlah_P_70_sampai_74_tahun,
      jumlah_L_75_sampai_79_tahun: req.body.jumlah_L_75_sampai_79_tahun,
      jumlah_P_75_sampai_79_tahun: req.body.jumlah_P_75_sampai_79_tahun,
      jumlah_L_80_sampai_84_tahun: req.body.jumlah_L_80_sampai_84_tahun,
      jumlah_P_80_sampai_84_tahun: req.body.jumlah_P_80_sampai_84_tahun,
      jumlah_L_diatas_85_tahun: req.body.jumlah_L_diatas_85_tahun,
      jumlah_P_diatas_85_tahun: req.body.jumlah_P_diatas_85_tahun,
      jumlah_kasus_baru_L: totalL,
      jumlah_kasus_baru_P: totalP,
      total_kasus_baru: total,
      jumlah_kunjungan_L: req.body.jumlah_kunjungan_L,
      jumlah_kunjungan_P: req.body.jumlah_kunjungan_P,
      total_jumlah_kunjungan: totalkunjungan,
    };
    transaction = await databaseSIRS.transaction();
    if (total <= totalkunjungan) {
      const update = await rlLimaTitikSatuDetail.update(dataUpdate, {
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
          message: "Data Tidak Berhasil di Ubah",
        });
      }
    } else {
      await transaction.rollback();
      res.status(400).send({
        status: false,
        message: "Data Jumlah Kasus Baru Lebih Dari Jumlah Kunjungan",
      });
    }
  } catch (error) {
    await transaction.rollback();
    res.status(400).send({
      status: false,
      message: error,
    });
  }
};

export const deleteDataRLLimaTitikSatu = async (req, res) => {
  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
    const count = await rlLimaTitikSatuDetail.destroy({
      where: {
        id: req.params.id,
        rs_id: req.user.satKerId,
      },
    });
    if (count != 0) {
      await transaction.commit();
      res.status(201).send({
        status: true,
        message: "Data Berhasil di Hapus",
        data: {
          deleted_rows: count,
        },
      });
    } else {
      await transaction.rollback();
      res.status(404).send({
        status: false,
        message: "Data Tidak Berhasil di Hapus",
      });
    }
  } catch (error) {
    await transaction.rollback();
    res.status(404).send({
      status: false,
      message: error,
    });
  }
};

export const getDataRLLimaTitikSatuSatuSehat = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY-MM").required(),
    page: joi.number(),
    limit: joi.number(),
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
  }

  if (req.user.jenisUserId == 4) {
    if (req.query.rsId != req.user.satKerId) {
      return res.status(404).send({
        status: false,
        message: "Kode RS Tidak Sesuai",
      });
    }

    // USER RS
    const koders = req.user.satKerId;
    const periodeget = req.query.periode;

    try {
      const satuSehat = await satu_sehat_id.findOne({
        where: { kode_baru_faskes: koders },
        attributes: ["organization_id"],
      });

      if (!satuSehat) {
        return res.status(404).send({
          status: false,
          message: "OrganizationId Tidak Ada",
        });
      }

      const organization_id = satuSehat.organization_id;

      const response = await axios.get(
        `${process.env.SATUSEHAT_BASE_URL}/rl51?month=${periodeget}&organization_id=${organization_id}`,
        {
          headers: {
            "X-API-Key": process.env.SATUSEHAT_API_KEY,
          },
        },
      );
      const records = response.data?.data?.records;
      // // SAVE DATA KE DB
      await saveRecords(records, organization_id, `${periodeget}-01`);

      res.status(200).send({
        status: true,
        message: "Data berhasil diambil dan disimpan",
        // data: responseData,
      });
    } catch (err) {
      console.log(err);
      // Kalau error dari axios (seperti 404)
      if (err.response) {
        const statusCode = err.response.status;
        const errorMessage =
          err.response.data?.message || "Error from external API";
        if (statusCode === 404) {
          return res.status(404).json({
            status: false,
            message: errorMessage,
            detail: "Data tidak ditemukan dari API Satusehat",
          });
        }
        // Untuk error lain dari API
        return res.status(statusCode).json({
          status: false,
          message: errorMessage,
          detail: "Error dari Satusehat",
        });
      }
    }
  } else {
    return res.status(404).send({
      status: false,
      message: "Untuk Dinkes belum bisa menarik data",
    });
  }
};

// fungsi delay pakai Promise agar bisa di-await
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getDataRLLimaTitikSatuSatuSehatShow = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY-MM").required(),
    page: joi.number(),
    limit: joi.number(),
  });
  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
  }

  let koders;
  let periodeget;

  if (req.user.jenisUserId == 4) {
    if (req.query.rsId != req.user.satKerId) {
      return res.status(404).send({
        status: false,
        message: "Kode RS Tidak Sesuai",
      });
    }

    // USER RS
    koders = req.user.satKerId;
    periodeget = req.query.periode;
  } else {
    // return res.status(404).send({
    //   status: false,
    //   message: "Untuk Dinkes belum bisa menarik data",
    // });

    koders = req.query.rsId;
    periodeget = req.query.periode;
  }

  try {
    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: koders },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }

    const organization_id = satuSehat.organization_id;

    const result = await rlLimaTitikSatuSatuSehat.findAll({
      where: {
        organization_id: organization_id, // bisa string atau number, sesuaikan tipe data db
        periode: periodeget,
      },
      attributes: [
        "icd_10",
        "diagnosis",
        "periode",
        "male_new_cases",
        "females_new_cases",
        "total_new_cases",
        "male_visits",
        "female_visits",
        "total_visits",
        "age_id",
      ],
      include: [
        {
          model: AgeGroups,
          attributes: ["name"], // alias 'age' nanti bisa rename di client
          required: false,
        },
        {
          model: satu_sehat_id,
          attributes: ["organization_id", "kode_baru_faskes"],
          required: false,
          include: [
            {
              model: users_sso,
              attributes: ["nama", "rs_id"],
              required: false,
            },
          ],
        },
      ],
      order: [
        ["icd_10", "ASC"],
        ["age_id", "ASC"],
      ],
    });

    result.sort((a, b) => {
      if (a.icd_10 === b.icd_10) {
        return a.age_id - b.age_id;
      }
      return a.icd_10.localeCompare(b.icd_10, undefined, { numeric: true });
    });
    // const nestedData = groupByRSandAge(result);
    res.status(200).send({
      status: true,
      message: "data found",
      data: result,
    });
  } catch (err) {
    res.status(422).send({
      status: false,
      message: err,
    });
    return;
  }
};

export const getDataRLLimaTitikSatuSatuSehatShowPaging = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi
      .string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(), // format YYYY-MM
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(20).default(20),
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }

  let koders;
  let periodeget;

  if (req.user.jenisUserId === 4) {
    if (req.query.rsId !== req.user.satKerId) {
      return res.status(403).send({
        status: false,
        message: "Kode RS Tidak Sesuai",
      });
    }
    koders = req.user.satKerId;
    periodeget = req.query.periode;
  } else {
    koders = req.query.rsId;
    periodeget = req.query.periode;
  }

  try {
    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: koders },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res.status(404).send({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }

    const organization_id = satuSehat.organization_id;
    const page = value.page;
    const limit = value.limit;
    const offset = (page - 1) * limit;

    // 1️⃣ Ambil ICD unik dulu
    const icdList = await rlLimaTitikSatuSatuSehat.findAll({
      where: {
        organization_id,
        periode: periodeget,
      },
      attributes: ["icd_10"],
      group: ["icd_10"],
      order: [["icd_10", "ASC"]],
      limit,
      offset,
      raw: true,
    });

    const icdCodes = icdList.map((item) => item.icd_10);

    if (icdCodes.length === 0) {
      return res.status(200).send({
        status: true,
        message: "data found",
        satu_sehat_id: null,
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        },
      });
    }

    // Hitung total ICD unik untuk pagination
    const totalIcd = await rlLimaTitikSatuSatuSehat.count({
      where: { organization_id, periode: periodeget },
      distinct: true,
      col: "icd_10",
    });

    // 2️⃣ Ambil data lengkap untuk ICD yang terpilih
    const resultRaw = await rlLimaTitikSatuSatuSehat.findAll({
      where: {
        organization_id,
        periode: periodeget,
        icd_10: icdCodes,
      },
      attributes: [
        "icd_10",
        "diagnosis",
        "periode",
        "male_new_cases",
        "females_new_cases",
        "total_new_cases",
        "male_visits",
        "female_visits",
        "total_visits",
        "age_id",
      ],
      include: [
        {
          model: AgeGroups,
          attributes: ["name"],
          required: false,
        },
        {
          model: satu_sehat_id,
          attributes: ["organization_id", "kode_baru_faskes"],
          required: false,
          include: [
            {
              model: users_sso,
              attributes: ["nama", "rs_id"],
              required: false,
            },
          ],
        },
      ],
      order: [
        ["icd_10", "ASC"],
        ["age_id", "ASC"],
      ],
      subQuery: false,
    });

    // Ambil satu_sehat_id dari data pertama (kalau ada)
    const satuSehatData = resultRaw[0]?.satu_sehat_id ?? null;

    // Ubah ke plain object
    const data = resultRaw.map((item) => {
      const plain = item.get({ plain: true });
      delete plain.satu_sehat_id;
      return plain;
    });

    // 3️⃣ Kirim response
    res.status(200).send({
      status: true,
      message: "data found",
      satu_sehat_id: satuSehatData,
      data,
      pagination: {
        total: totalIcd, // total ICD unik
        page,
        limit,
        pages: Math.ceil(totalIcd / limit),
      },
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({
      status: false,
      message: err.message || "internal server error",
    });
  }
};

function groupByRSandAge(data) {
  const rsMap = new Map();

  data.forEach((item) => {
    const orgId = item.satu_sehat_id.organization_id;
    const rsName = item.satu_sehat_id.users_sso.nama;
    const rsId = item.satu_sehat_id.users_sso.rs_id;
    const ageId = item.age_id;
    const ageName = item.age_groups_satusehat.name;

    if (!rsMap.has(orgId)) {
      rsMap.set(orgId, {
        organization_id: orgId,
        rs_id: rsId,
        rs_name: rsName,
        age_groups: new Map(),
      });
    }

    const rs = rsMap.get(orgId);

    if (!rs.age_groups.has(ageId)) {
      rs.age_groups.set(ageId, {
        age_id: ageId,
        age_name: ageName,
        records: [],
      });
    }

    const ageGroup = rs.age_groups.get(ageId);

    ageGroup.records.push({
      icd_10: item.icd_10,
      diagnosis: item.diagnosis,
      periode: item.periode,
      male_new_cases: item.male_new_cases,
      females_new_cases: item.females_new_cases,
      total_new_cases: item.total_new_cases,
      male_visits: item.male_visits,
      female_visits: item.female_visits,
      total_visits: item.total_visits,
    });
  });

  // Convert Map to Array with nested arrays
  return Array.from(rsMap.values()).map((rs) => ({
    organization_id: rs.organization_id,
    rs_id: rs.rs_id,
    rs_name: rs.rs_name,
    age_groups: Array.from(rs.age_groups.values()),
  }));
}

async function saveRecords(records, organization_id, periode) {
  // 1. Load all existing AgeGroups once
  const existingAges = await AgeGroups.findAll();
  const ageMap = new Map(existingAges.map((age) => [age.id, age.name]));

  // 2. Prepare new AgeGroups (if needed)
  const newAgeGroups = [];
  const dataToUpsert = [];

  for (const record of records) {
    for (const newCase of record.new_cases) {
      const age_id = newCase.age_id;
      const age_name = newCase.age_name;

      // Add missing age groups
      if (!ageMap.has(age_id)) {
        newAgeGroups.push({ id: age_id, name: age_name });
        ageMap.set(age_id, age_name);
      }

      const total_new = newCase.male_new_cases + newCase.female_new_cases;

      dataToUpsert.push({
        organization_id,
        periode,
        icd_10: record.icd10,
        age_id: age_id,
        diagnosis: record.diagnosis,
        male_new_cases: newCase.male_new_cases,
        females_new_cases: newCase.female_new_cases,
        total_new_cases: total_new,
        male_visits: record.male_visits,
        female_visits: record.female_visits,
        total_visits: record.total_visits,
      });
    }
  }

  // 3. Bulk insert missing age groups
  if (newAgeGroups.length > 0) {
    await AgeGroups.bulkCreate(newAgeGroups, {
      ignoreDuplicates: true,
    });
  }

  // 4. Bulk upsert records
  if (dataToUpsert.length > 0) {
    await rlLimaTitikSatuSatuSehat.bulkCreate(dataToUpsert, {
      updateOnDuplicate: [
        "diagnosis",
        "male_new_cases",
        "females_new_cases",
        "total_new_cases",
        "male_visits",
        "female_visits",
        "total_visits",
      ],
    });
  }

  // console.log(`✅ ${dataToUpsert.length} records saved/updated`);
}

export const getMasterumursatusehat = async (req, res) => {
  try {
    const data = await AgeGroups.findAll({
      order: [["id", "ASC"]],
    });

    res.status(200).send({
      status: true,
      message: "data found",
      data,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

function groupByICDandAge(results) {
  const grouped = {};

  for (const item of results) {
    const icd = item.icd_10;

    if (!grouped[icd]) {
      grouped[icd] = {
        icd_10: icd,
        diagnosis: item.diagnosis,
        periode: item.periode,
        records: [],
      };
    }

    grouped[icd].records.push({
      age_id: item.age_id,
      age_name: item.AgeGroup?.name || "-",
      male_new_cases: item.male_new_cases,
      female_new_cases: item.females_new_cases,
      total_new_cases: item.total_new_cases,
      male_visits: item.male_visits,
      female_visits: item.female_visits,
      total_visits: item.total_visits,
    });
  }

  // Ubah object ke array, dan urutkan age_id
  return Object.values(grouped).map((group) => {
    group.records.sort((a, b) => a.age_id - b.age_id);
    return group;
  });
}

// ─────────────────────────────────────────────
// SSE Clients Map
// ─────────────────────────────────────────────

const sseClients = new Map();

const notifySseClients = (organization_id, periode) => {
  const key = `${organization_id}_${periode}`;
  const clients = sseClients.get(key);
  if (!clients?.size) return;

  const payload = JSON.stringify({
    event: "sync_done",
    organization_id,
    periode,
    at: new Date(),
  });
  clients.forEach((client) => client.write(`data: ${payload}\n\n`));
};

// ─────────────────────────────────────────────
// 1. GET Data + Sync Status (dengan pagination)
// ─────────────────────────────────────────────

export const getDataRL51WithSyncStatus = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi
      .string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(20).default(20),
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res
      .status(400)
      .send({ status: false, message: error.details[0].message });
  }

  // Validasi akses
  let koders;
  if (req.user.jenisUserId == 4) {
    if (req.query.rsId != req.user.satKerId) {
      return res
        .status(403)
        .send({ status: false, message: "Kode RS Tidak Sesuai" });
    }
    koders = req.user.satKerId;
  } else {
    koders = req.query.rsId;
  }

  const periodeget = req.query.periode;
  const { page, limit } = value;
  const offset = (page - 1) * limit;

  try {
    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: koders },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res
        .status(404)
        .send({ status: false, message: "OrganizationId Tidak Ada" });
    }

    const organization_id = satuSehat.organization_id?.substring(0, 9);

    // ── Semua query paralel ──
    const [icdList, totalIcd, syncInfo, currentlySyncing] = await Promise.all([
      rlLimaTitikSatuSatuSehat.findAll({
        where: { organization_id, periode: periodeget },
        attributes: ["icd_10"],
        group: ["icd_10"],
        order: [["icd_10", "ASC"]],
        limit,
        offset,
        raw: true,
      }),
      rlLimaTitikSatuSatuSehat.count({
        where: { organization_id, periode: periodeget },
        distinct: true,
        col: "icd_10",
      }),

      getLastSyncInfoRL51(organization_id, periodeget),
      isSyncingRL51(organization_id, periodeget),
    ]);

    const icdCodes = icdList.map((i) => i.icd_10);
    let data = [];
    let satuSehatData = null;

    if (icdCodes.length > 0) {
      const resultRaw = await rlLimaTitikSatuSatuSehat.findAll({
        where: {
          organization_id,
          periode: periodeget,
          icd_10: icdCodes,
        },
        attributes: [
          "icd_10",
          "diagnosis",
          "periode",
          "male_new_cases",
          "females_new_cases",
          "total_new_cases",
          "male_visits",
          "female_visits",
          "total_visits",
          "age_id",
        ],
        include: [
          {
            model: AgeGroups,
            attributes: ["name"],
            required: false,
          },
          {
            model: satu_sehat_id,
            attributes: ["organization_id", "kode_baru_faskes"],
            required: false,
            include: [
              {
                model: users_sso,
                attributes: ["nama", "rs_id"],
                required: false,
              },
            ],
          },
        ],
        order: [
          ["icd_10", "ASC"],
          ["age_id", "ASC"],
        ],
        subQuery: false,
      });

      satuSehatData = resultRaw[0]?.satu_sehat_id ?? null;
      data = resultRaw.map((item) => {
        const plain = item.get({ plain: true });
        delete plain.satu_sehat_id;
        return plain;
      });
    }

    // ── Kirim response ke FE dulu ──
    res.status(200).send({
      status: true,
      message: data.length ? "data found" : "data not found",
      satu_sehat_id: satuSehatData,
      data,
      pagination: {
        total: totalIcd,
        page,
        limit,
        pages: Math.ceil(totalIcd / limit),
      },
      sync: {
        lastSync: syncInfo?.synced_at ?? null,
        status: syncInfo?.status ?? "never",
        totalData: syncInfo?.total_data ?? 0,
        isUpdating: currentlySyncing,
      },
    });

    // ── Cek stale & background sync ──
    const stale = await isStaleRL51(organization_id, periodeget);
    if (stale && !currentlySyncing) {
      // SYNC OTOMATIS
      // doSyncRL51(organization_id, periodeget)
      //   .then(() => notifySseClients(organization_id, periodeget))
      //   .catch((err) =>
      //     console.error(
      //       `[RL51 BG Sync Error] org=${organization_id}:`,
      //       err.message,
      //     ),
      //   );
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 2. SSE Subscribe
// ─────────────────────────────────────────────

export const subscribeSyncStatusRL51 = (req, res) => {
  const { rsId, periode } = req.query;
  const key = `${rsId}_${periode}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!sseClients.has(key)) sseClients.set(key, new Set());
  sseClients.get(key).add(res);

  // Ping tiap 30 detik supaya koneksi tidak putus
  const ping = setInterval(() => res.write(": ping\n\n"), 30000);

  req.on("close", () => {
    clearInterval(ping);
    sseClients.get(key)?.delete(res);
  });
};

// ─────────────────────────────────────────────
// 3. Manual Sync
// ─────────────────────────────────────────────

export const manualSyncRL51 = async (req, res) => {
  const { rsId, periode } = req.body;

  if (!rsId || !periode) {
    return res
      .status(400)
      .send({ status: false, message: "rsId dan periode wajib diisi" });
  }

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

    // const organization_id = satuSehat.organization_id;
    const organization_id = satuSehat.organization_id?.substring(0, 9);

    // Cegah dobel sync
    const syncing = await isSyncingRL51(organization_id, periode);
    if (syncing) {
      return res
        .status(200)
        .send({ status: true, message: "Sedang dalam proses sync" });
    }

    // Force sync tanpa cek stale (manual = selalu sync)
    doSyncRL51(organization_id, periode)
      .then(() => notifySseClients(organization_id, periode))
      .catch((err) => console.error("[RL51 Manual Sync Error]", err.message));

    return res.status(200).send({ status: true, message: "Sync dimulai" });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
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

// ============================================
// DOWNLOAD RL 5.1 (BIASA, BUKAN SATUSEHAT)
// ============================================

export const downloadDataRLLimaTitikSatu = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    provId: joi.string().allow("", null).optional(),
    kabId: joi.string().allow("", null).optional(),
    periode: joi.date().format("YYYY-MM").required(),
  });

  const { error, value } = schema.validate(req.query);
  if (error)
    return res
      .status(400)
      .send({ status: false, message: error.details[0].message });

  if (req.user.jenisUserId == 4) {
    return res.status(403).send({
      status: false,
      message:
        "Akses ditolak. User rumah sakit tidak diizinkan mengunduh data ini",
    });
  }

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

    const loginResponse = await axios.post(
      `${baseUrl}/faskes/login`,
      { userName: username, password: password },
      { headers: { "Content-Type": "application/json" } },
    );

    const token =
      loginResponse.data.access_token || loginResponse.data.data.access_token;

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

    const rsList = listRs
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

    const tahunBulan = req.query.periode.replace("-", "_");
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const namaFile = `RL_51_${tahunBulan}_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);

    await tulisExcelRL51({
      res,
      rsList,
      periode: req.query.periode,
      judul: "SIRS ONLINE RL 5.1",
      modelDetail: rlLimaTitikSatuDetail,
    });
  } catch (err) {
    console.error("downloadDataRLLimaTitikSatu:", err.message);
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).send({
      status: false,
      message: "Gagal mengunduh data",
    });
  }
};

// ============================================
// KONFIGURASI KOLOM EXCEL RL 5.1 (BIASA)
// ============================================

const KELOMPOK_UMUR_RL51 = [
  { key: "dibawah_1_jam", label: "< 1 Jam" },
  { key: "1_sampai_23_jam", label: "1 - 23 Jam" },
  { key: "1_sampai_7_hari", label: "1 - 7 Hari" },
  { key: "8_sampai_28_hari", label: "8 - 28 Hari" },
  { key: "29_hari_sampai_dibawah_3_bulan", label: "29 Hari - <3 Bulan" },
  { key: "3_bulan_sampai_dibawah_6_bulan", label: "3 - <6 Bulan" },
  { key: "6_bulan_sampai_11_bulan", label: "6 - 11 Bulan" },
  { key: "1_sampai_4_tahun", label: "1 - 4 Tahun" },
  { key: "5_sampai_9_tahun", label: "5 - 9 Tahun" },
  { key: "10_sampai_14_tahun", label: "10 - 14 Tahun" },
  { key: "15_sampai_19_tahun", label: "15 - 19 Tahun" },
  { key: "20_sampai_24_tahun", label: "20 - 24 Tahun" },
  { key: "25_sampai_29_tahun", label: "25 - 29 Tahun" },
  { key: "30_sampai_34_tahun", label: "30 - 34 Tahun" },
  { key: "35_sampai_39_tahun", label: "35 - 39 Tahun" },
  { key: "40_sampai_44_tahun", label: "40 - 44 Tahun" },
  { key: "45_sampai_49_tahun", label: "45 - 49 Tahun" },
  { key: "50_sampai_54_tahun", label: "50 - 54 Tahun" },
  { key: "55_sampai_59_tahun", label: "55 - 59 Tahun" },
  { key: "60_sampai_64_tahun", label: "60 - 64 Tahun" },
  { key: "65_sampai_69_tahun", label: "65 - 69 Tahun" },
  { key: "70_sampai_74_tahun", label: "70 - 74 Tahun" },
  { key: "75_sampai_79_tahun", label: "75 - 79 Tahun" },
  { key: "80_sampai_84_tahun", label: "80 - 84 Tahun" },
  { key: "diatas_85_tahun", label: "≥ 85 Tahun" },
];

// Kolom total, sesuai field asli di rlLimaTitikSatuDetail:
// jumlah kasus baru (L/P/Total) dan jumlah kunjungan (L/P/Total)
const KOLOM_TOTAL_RL51 = [
  { key: "jumlah_kasus_baru_L", label: "Total Kasus Baru (L)" },
  { key: "jumlah_kasus_baru_P", label: "Total Kasus Baru (P)" },
  { key: "total_kasus_baru", label: "Total Kasus Baru" },
  { key: "jumlah_kunjungan_L", label: "Total Kunjungan (L)" },
  { key: "jumlah_kunjungan_P", label: "Total Kunjungan (P)" },
  { key: "total_jumlah_kunjungan", label: "Total Kunjungan" },
];

const kolomAngkaRL51 = [
  ...KELOMPOK_UMUR_RL51.flatMap((u) => [
    {
      header: "L",
      group: u.label,
      key: `jumlah_L_${u.key}`,
      width: 6,
    },
    {
      header: "P",
      group: u.label,
      key: `jumlah_P_${u.key}`,
      width: 6,
    },
  ]),
  ...KOLOM_TOTAL_RL51.map((t) => ({
    header: t.label,
    group: null,
    key: t.key,
    width: 16,
  })),
];

const kolomIdentitasRL51 = [
  { header: "No", group: null, key: "no", width: 5 },
  { header: "Kode RS", group: null, key: "kodeRs", width: 12 },
  { header: "Nama RS", group: null, key: "namaRs", width: 35 },
  { header: "Provinsi", group: null, key: "provinsi", width: 22 },
  { header: "Kab/Kota", group: null, key: "kabKota", width: 22 },
  { header: "Kode ICD", group: null, key: "icdCode", width: 12 },
  { header: "Deskripsi ICD", group: null, key: "icdDesc", width: 40 },
  { header: "Kode Group", group: null, key: "icdGroup", width: 12 },
  { header: "Deskripsi Group", group: null, key: "icdGroupDesc", width: 40 },
];

const semuaKolomRL51 = [...kolomIdentitasRL51, ...kolomAngkaRL51];

const NAMA_BULAN_RL51 = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BORDER_TIPIS_RL51 = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const BATCH_SIZE_RL51 = 1000;

const tulisExcelRL51 = async ({
  res,
  rsList,
  periode,
  judul = "SIRS ONLINE RL 5.1",
  modelDetail,
}) => {
  const kodeRsList = rsList.map((rs) => rs.kodeRs);
  const rsMap = new Map(rsList.map((rs) => [String(rs.kodeRs), rs]));
  const totalKolom = semuaKolomRL51.length;

  const [tahunStr, bulanStr] = periode.split("-");
  const namaBulan = NAMA_BULAN_RL51[parseInt(bulanStr, 10) - 1];

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });
  const sheet = workbook.addWorksheet("RL 5.1", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 7 }],
  });

  sheet.columns = semuaKolomRL51.map((k) => ({ key: k.key, width: k.width }));

  // ---- Blok judul ----
  const rJudul = sheet.addRow([judul]);
  rJudul.font = { bold: true, size: 14 };
  sheet.mergeCells(1, 1, 1, 4);
  rJudul.commit();

  const rPeriodeLabel = sheet.addRow(["Periode Data"]);
  rPeriodeLabel.font = { bold: true };
  sheet.mergeCells(2, 1, 2, 2);
  rPeriodeLabel.commit();

  const rBulan = sheet.addRow(["Bulan :", namaBulan]);
  rBulan.commit();

  const rTahun = sheet.addRow(["Tahun :", tahunStr]);
  rTahun.commit();

  sheet.addRow([]).commit();

  // ---- Header tabel: 3 baris (grup besar, kelompok umur, L/P) ----
  const JUMLAH_KOLOM_IDENTITAS = kolomIdentitasRL51.length;
  const JUMLAH_KOLOM_UMUR = kolomAngkaRL51.length - KOLOM_TOTAL_RL51.length;

  // Untuk kolom TANPA group (identitas & total): teks header taruh di baris0
  // (karena saat di-merge vertikal, Excel hanya pertahankan nilai di sel pojok kiri-atas)
  const baris0 = semuaKolomRL51.map((k) => (k.group ? "" : k.header));
  // Judul besar "KASUS BARU" merentang di atas seluruh blok kolom kelompok umur
  baris0[JUMLAH_KOLOM_IDENTITAS] = "KASUS BARU";

  const baris1 = semuaKolomRL51.map((k) => (k.group ? k.group : ""));
  const baris2 = semuaKolomRL51.map((k) => (k.group ? k.header : ""));

  const r0 = sheet.addRow(baris0);
  const r1 = sheet.addRow(baris1);
  const r2 = sheet.addRow(baris2);

  // Merge judul besar "KASUS BARU" di baris 0, merentang seluruh kolom kelompok umur
  sheet.mergeCells(
    r0.number,
    JUMLAH_KOLOM_IDENTITAS + 1,
    r0.number,
    JUMLAH_KOLOM_IDENTITAS + JUMLAH_KOLOM_UMUR,
  );

  const rowHeaderAwal = r1.number;
  let col = 1;
  while (col <= totalKolom) {
    const k = semuaKolomRL51[col - 1];
    if (!k.group) {
      // Kolom identitas & kolom total: merge vertikal dari baris0 s.d. baris2
      sheet.mergeCells(r0.number, col, rowHeaderAwal + 1, col);
      col += 1;
    } else {
      sheet.mergeCells(rowHeaderAwal, col, rowHeaderAwal, col + 1);
      col += 2;
    }
  }

  [r0, r1, r2].forEach((r) => {
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = BORDER_TIPIS_RL51;
    });
    r.commit();
  });

  // ---- Isi data ----
  let lastId = 0;
  let totalBaris = 0;
  let no = 1;

  while (true) {
    const rows = await modelDetail.findAll({
      include: {
        model: IcdRLLimaTitikSatu,
        attributes: [
          "icd_code",
          "description_code",
          "icd_code_group",
          "description_code_group",
        ],
      },
      where: {
        rs_id: { [Op.in]: kodeRsList },
        periode,
        id: { [Op.gt]: lastId },
      },
      order: [["id", "ASC"]],
      limit: BATCH_SIZE_RL51,
    });

    if (rows.length === 0) break;

    for (const row of rows) {
      const data = row.toJSON();
      const rs = rsMap.get(String(data.rs_id));

      const baris = {
        no: no++,
        kodeRs: data.rs_id,
        namaRs: rs?.namaRs ?? "",
        provinsi: rs?.provinsiNama ?? "",
        kabKota: rs?.kabKotaNama ?? "",
        icdCode: data.icd?.icd_code ?? "",
        icdDesc: data.icd?.description_code ?? "",
        icdGroup: data.icd?.icd_code_group ?? "",
        icdGroupDesc: data.icd?.description_code_group ?? "",
      };
      kolomAngkaRL51.forEach((k) => {
        baris[k.key] = data[k.key] ?? 0;
      });

      const rowData = sheet.addRow(baris);
      rowData.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = BORDER_TIPIS_RL51;
        cell.alignment = { vertical: "middle" };
      });
      rowData.commit();
    }

    totalBaris += rows.length;
    lastId = rows[rows.length - 1].id;
  }

  await sheet.commit();
  await workbook.commit();
  return totalBaris;
};

// ============================================
// DOWNLOAD RL 5.1 SATU SEHAT
// ============================================

export const downloadDataRLLimaTitikSatuSatuSehat = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    provId: joi.string().allow("", null).optional(),
    kabId: joi.string().allow("", null).optional(),
    periode: joi.date().format("YYYY-MM").required(),
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

    // Login selalu dilakukan di awal (dipakai semua role, termasuk role 4 untuk ambil nama RS)
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
        },
      ];

      orgToRsMap.set(orgIdShort, rsList[0]);
      orgIdList = [orgIdShort];
    } else {
      // ---- Role 1/2/3: ambil daftar RS per wilayah ----
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
    const tahunBulan = req.query.periode.replace("-", "_");
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const namaFile = `RL_51_SatuSehat_${tahunBulan}_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);

    await tulisExcelRL51SatuSehat({
      res,
      orgToRsMap,
      orgIdList,
      periode: req.query.periode,
      judul: "SIRS ONLINE RL 5.1 - SATU SEHAT",
      modelDetail: rlLimaTitikSatuSatuSehat,
      tampilkanOrgId: jenisUserId === 4,
    });
  } catch (err) {
    console.error("downloadDataRLLimaTitikSatuSatuSehat:", err.message);
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).send({
      status: false,
      message: "Gagal mengunduh data",
    });
  }
};

// ============================================
// KONFIGURASI KOLOM EXCEL RL 5.1 SATU SEHAT
// ============================================

// Mengikuti data dari endpoint /masterumursatusehat: id huruf a-y, urut dari termuda ke tertua
const KELOMPOK_UMUR_RL51_SS = [
  { id: "a", label: "< 1 Jam" },
  { id: "b", label: "1 - 23 Jam" },
  { id: "c", label: "1 - 7 Hari" },
  { id: "d", label: "8 - 28 Hari" },
  { id: "e", label: "29 Hari - <3 Bulan" },
  { id: "f", label: "3 - <6 Bulan" },
  { id: "g", label: "6 - 11 Bulan" },
  { id: "h", label: "1 - 4 Tahun" },
  { id: "i", label: "5 - 9 Tahun" },
  { id: "j", label: "10 - 14 Tahun" },
  { id: "k", label: "15 - 19 Tahun" },
  { id: "l", label: "20 - 24 Tahun" },
  { id: "m", label: "25 - 29 Tahun" },
  { id: "n", label: "30 - 34 Tahun" },
  { id: "o", label: "35 - 39 Tahun" },
  { id: "p", label: "40 - 44 Tahun" },
  { id: "q", label: "45 - 49 Tahun" },
  { id: "r", label: "50 - 54 Tahun" },
  { id: "s", label: "55 - 59 Tahun" },
  { id: "t", label: "60 - 64 Tahun" },
  { id: "u", label: "65 - 69 Tahun" },
  { id: "v", label: "70 - 74 Tahun" },
  { id: "w", label: "75 - 79 Tahun" },
  { id: "x", label: "80 - 84 Tahun" },
  { id: "y", label: "≥ 85 Tahun" },
];

// Setiap kelompok umur HANYA punya 2 kolom: Kasus Baru L, Kasus Baru P
// (Kunjungan TIDAK di-breakdown per kelompok umur, hanya jadi kolom total di akhir)
const kolomAngkaRL51SS = KELOMPOK_UMUR_RL51_SS.flatMap((u) => [
  {
    header: "L",
    group: u.label,
    key: `kasusbaru_l_${u.id}`,
    width: 6,
  },
  {
    header: "P",
    group: u.label,
    key: `kasusbaru_p_${u.id}`,
    width: 6,
  },
]);

// Kolom total, dihitung MANUAL dari sum semua kelompok umur
// (tabel SatuSehat tidak punya kolom total per baris, hanya per age_id)
const KOLOM_TOTAL_RL51_SS = [
  { key: "totalKasusBaruL", label: "Total Kasus Baru (L)" },
  { key: "totalKasusBaruP", label: "Total Kasus Baru (P)" },
  { key: "totalKasusBaru", label: "Total Kasus Baru" },
  { key: "totalKunjunganL", label: "Total Kunjungan (L)" },
  { key: "totalKunjunganP", label: "Total Kunjungan (P)" },
  { key: "totalKunjungan", label: "Total Kunjungan" },
];

const kolomTotalRL51SS = KOLOM_TOTAL_RL51_SS.map((t) => ({
  header: t.label,
  group: null,
  key: t.key,
  width: 16,
}));

const NAMA_BULAN_RL51_SS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BORDER_TIPIS_RL51_SS = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const tulisExcelRL51SatuSehat = async ({
  res,
  orgToRsMap,
  orgIdList,
  periode,
  judul = "SIRS ONLINE RL 5.1 - SATU SEHAT",
  modelDetail,
  tampilkanOrgId = false,
}) => {
  const kolomIdentitasRL51SS = [
    { header: "No", group: null, key: "no", width: 5 },
    { header: "Kode RS", group: null, key: "kodeRs", width: 12 },
    { header: "Nama RS", group: null, key: "namaRs", width: 35 },
    ...(tampilkanOrgId
      ? [
          {
            header: "Organization ID",
            group: null,
            key: "organizationId",
            width: 20,
          },
        ]
      : []),
    { header: "Kode ICD", group: null, key: "kodeIcd", width: 12 },
    { header: "Diagnosis", group: null, key: "diagnosis", width: 40 },
    { header: "Periode", group: null, key: "periode", width: 14 },
  ];

  const semuaKolomRL51SS = [
    ...kolomIdentitasRL51SS,
    ...kolomAngkaRL51SS,
    ...kolomTotalRL51SS,
  ];
  const totalKolom = semuaKolomRL51SS.length;

  const [tahunStr, bulanStr] = periode.split("-");
  const namaBulan = NAMA_BULAN_RL51_SS[parseInt(bulanStr, 10) - 1];

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });
  const sheet = workbook.addWorksheet("RL 5.1 SatuSehat", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 6 }],
  });

  sheet.columns = semuaKolomRL51SS.map((k) => ({ key: k.key, width: k.width }));

  // ---- Blok judul ----
  const rJudul = sheet.addRow([judul]);
  rJudul.font = { bold: true, size: 14 };
  sheet.mergeCells(1, 1, 1, 4);
  rJudul.commit();

  const rPeriodeLabel = sheet.addRow(["Periode Data"]);
  rPeriodeLabel.font = { bold: true };
  sheet.mergeCells(2, 1, 2, 2);
  rPeriodeLabel.commit();

  const rBulan = sheet.addRow(["Bulan :", namaBulan]);
  rBulan.commit();

  const rTahun = sheet.addRow(["Tahun :", tahunStr]);
  rTahun.commit();

  sheet.addRow([]).commit();

  // ---- Header tabel: 3 baris (grup besar, kelompok umur, L/P) ----
  const JUMLAH_KOLOM_IDENTITAS = kolomIdentitasRL51SS.length;
  const JUMLAH_KOLOM_UMUR = kolomAngkaRL51SS.length;
  const JUMLAH_KOLOM_TOTAL = kolomTotalRL51SS.length;

  // Untuk kolom TANPA group (identitas & total): teks header taruh di baris0
  // (karena saat di-merge vertikal, Excel hanya pertahankan nilai di sel pojok kiri-atas)
  const baris0 = semuaKolomRL51SS.map((k) => (k.group ? "" : k.header));
  // Judul besar "KASUS BARU" merentang di atas seluruh blok kolom kelompok umur
  baris0[JUMLAH_KOLOM_IDENTITAS] = "KASUS BARU";

  const baris1 = semuaKolomRL51SS.map((k) => (k.group ? k.group : ""));
  const baris2 = semuaKolomRL51SS.map((k) => (k.group ? k.header : ""));

  const r0 = sheet.addRow(baris0);
  const r1 = sheet.addRow(baris1);
  const r2 = sheet.addRow(baris2);

  // Merge judul besar "KASUS BARU" di baris 0, merentang seluruh kolom umur
  sheet.mergeCells(
    r0.number,
    JUMLAH_KOLOM_IDENTITAS + 1,
    r0.number,
    JUMLAH_KOLOM_IDENTITAS + JUMLAH_KOLOM_UMUR,
  );

  const rowHeaderAwal = r1.number;
  let col = 1;
  while (col <= totalKolom) {
    const k = semuaKolomRL51SS[col - 1];
    if (!k.group) {
      // Kolom identitas & kolom total: merge vertikal dari baris0 s.d. baris2
      sheet.mergeCells(r0.number, col, rowHeaderAwal + 1, col);
      col += 1;
    } else {
      // Setiap grup kelompok umur punya 2 kolom (Kasus Baru L, P)
      sheet.mergeCells(rowHeaderAwal, col, rowHeaderAwal, col + 1);
      col += 2;
    }
  }

  [r0, r1, r2].forEach((r) => {
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = BORDER_TIPIS_RL51_SS;
    });
    r.commit();
  });

  // ---- Isi data: pivot per (organization_id, icd_10) -> satu baris, age_id jadi kolom ----
  // Karena data mentah 1 baris = 1 (icd_10 + age_id), perlu dikumpulkan dulu
  // per kombinasi (organization_id, icd_10) sebelum ditulis ke Excel.

  const BATCH_SIZE = 1000;
  let offset = 0;
  let no = 1;
  let totalBaris = 0;

  // Map kunci "orgId||icd10" -> baris yang sedang dibangun
  const rowBuffer = new Map();

  const flushRow = (key) => {
    const rowData = rowBuffer.get(key);
    if (!rowData) return;
    rowData.no = no++;

    // Hitung total kasus baru manual dengan sum semua kelompok umur
    let totalKasusBaruL = 0;
    let totalKasusBaruP = 0;

    KELOMPOK_UMUR_RL51_SS.forEach((u) => {
      totalKasusBaruL += rowData[`kasusbaru_l_${u.id}`] ?? 0;
      totalKasusBaruP += rowData[`kasusbaru_p_${u.id}`] ?? 0;
    });

    rowData.totalKasusBaruL = totalKasusBaruL;
    rowData.totalKasusBaruP = totalKasusBaruP;
    rowData.totalKasusBaru = totalKasusBaruL + totalKasusBaruP;

    // totalKunjunganL dan totalKunjunganP sudah terisi sejak baris pertama ICD ini ditemui
    rowData.totalKunjungan = rowData.totalKunjunganL + rowData.totalKunjunganP;

    const excelRow = sheet.addRow(rowData);
    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDER_TIPIS_RL51_SS;
      cell.alignment = { vertical: "middle" };
    });
    excelRow.commit();
    rowBuffer.delete(key);
    totalBaris++;
  };

  while (true) {
    const rows = await modelDetail.findAll({
      where: {
        organization_id: { [Op.in]: orgIdList },
        periode,
      },
      order: [
        ["organization_id", "ASC"],
        ["icd_10", "ASC"],
      ],
      limit: BATCH_SIZE,
      offset,
    });

    if (rows.length === 0) break;

    for (const row of rows) {
      const data = row.toJSON();
      const key = `${data.organization_id}||${data.icd_10}`;

      if (!rowBuffer.has(key)) {
        const rsInfo = orgToRsMap.get(String(data.organization_id));
        const baseRow = {
          kodeRs: rsInfo?.kodeRs ?? "",
          namaRs: rsInfo?.namaRs ?? "",
          kodeIcd: data.icd_10 ?? "",
          diagnosis: data.diagnosis ?? "",
          periode: data.periode ?? "",
          // male_visits/female_visits levelnya per ICD (sama di semua age_id),
          // jadi cukup diambil sekali saja saat baris pertama ICD ini ditemui.
          totalKunjunganL: data.male_visits ?? 0,
          totalKunjunganP: data.female_visits ?? 0,
        };
        if (tampilkanOrgId) {
          baseRow.organizationId = data.organization_id;
        }
        // Inisialisasi semua kolom kasus baru per umur ke 0 dulu
        kolomAngkaRL51SS.forEach((k) => {
          baseRow[k.key] = 0;
        });
        rowBuffer.set(key, baseRow);
      }

      const rowData = rowBuffer.get(key);
      const ageId = data.age_id;
      rowData[`kasusbaru_l_${ageId}`] = data.male_new_cases ?? 0;
      rowData[`kasusbaru_p_${ageId}`] = data.females_new_cases ?? 0;
      // TIDAK di-akumulasi lagi -- male_visits/female_visits sama di semua baris age_id untuk ICD yang sama
    }

    // Karena data diurutkan by organization_id + icd_10, begitu batch berikutnya
    // mulai icd_10/org baru, baris kombinasi sebelumnya sudah pasti lengkap.
    // Untuk kesederhanaan dan keamanan, flush semua kecuali kombinasi terakhir
    // yang match dengan baris terakhir di batch ini (mungkin masih akan nambah di batch berikutnya).
    const lastRow = rows[rows.length - 1].toJSON();
    const lastKey = `${lastRow.organization_id}||${lastRow.icd_10}`;

    for (const key of Array.from(rowBuffer.keys())) {
      if (key !== lastKey) {
        flushRow(key);
      }
    }

    offset += rows.length;
    if (rows.length < BATCH_SIZE) break;
  }

  // Flush sisa baris terakhir yang masih di buffer
  for (const key of Array.from(rowBuffer.keys())) {
    flushRow(key);
  }

  await sheet.commit();
  await workbook.commit();
  return totalBaris;
};
