import { databaseSIRS } from "../config/Database.js";
import {
  rlEmpatTitikSatuHeader,
  rlEmpatTitikSatuDetail,
  // get42,
  // get43,
} from "../models/RLEmpatTitikSatuModel.js";

import { rlEmpatTitikSatuSatuSehat } from "../models/RLEmpatTitikSatuSatuSehatModel.js";

import Joi from "joi";
import joiDate from "@joi/date";
import { icd } from "../models/ICDModel.js";
import { satu_sehat_id, users_sso } from "../models/UserModel.js";

import {
  isStale,
  isSyncing,
  doSync,
  getLastSyncInfo,
} from "../services/rlSync.service.js";

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import ExcelJS from "exceljs";
import { Op } from "sequelize";

const sseClients = new Map();

export const getDataRLEmpatTitikSatu = (req, res) => {
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

  rlEmpatTitikSatuDetail
    .findAll({
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

export const getDataRLEmpatTitikSatuPaging = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY-MM").required(),
    page: joi.number().min(1).default(1),
    limit: joi.number().min(1).max(200).default(50),
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
  }

  const { page, limit, rsId, periode } = value;
  const offset = (page - 1) * limit;

  let whereClause = {};

  if (req.user.jenisUserId == 4) {
    if (rsId != req.user.satKerId) {
      return res.status(404).send({
        status: false,
        message: "Kode RS Tidak Sesuai",
      });
    }
    whereClause = {
      rs_id: req.user.satKerId,
      periode,
    };
  } else {
    whereClause = {
      rs_id: rsId,
      periode,
    };
  }

  try {
    const rows = await rlEmpatTitikSatuDetail.findAll({
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

    const totalRows = await rlEmpatTitikSatuDetail.count({
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

export const getDataRLEmpatTitikSatuById = (req, res) => {
  rlEmpatTitikSatuDetail
    .findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: icd,
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

export const insertDataRLEmpatTitikSatu = async (req, res) => {
  const schema = Joi.object({
    // periode: Joi.date().required(),
    periodeBulan: Joi.number().greater(0).less(13).required(),
    periodeTahun: Joi.number().greater(2022).required(),
    icdId: Joi.number(),
    data: Joi.array()
      .items(
        Joi.object().keys({
          jmlhPasHidupMatiUmurGen01JamL: Joi.number(),
          jmlhPasHidupMatiUmurGen01JamP: Joi.number(),
          jmlhPasHidupMatiUmurGen123JamL: Joi.number(),
          jmlhPasHidupMatiUmurGen123JamP: Joi.number(),
          jmlhPasHidupMatiUmurGen17hrL: Joi.number(),
          jmlhPasHidupMatiUmurGen17hrP: Joi.number(),
          jmlhPasHidupMatiUmurGen828hrL: Joi.number(),
          jmlhPasHidupMatiUmurGen828hrP: Joi.number(),
          jmlhPasHidupMatiUmurGen29hr3blnL: Joi.number(),
          jmlhPasHidupMatiUmurGen29hr3blnP: Joi.number(),
          jmlhPasHidupMatiUmurGen36blnL: Joi.number(),
          jmlhPasHidupMatiUmurGen36blnP: Joi.number(),
          jmlhPasHidupMatiUmurGen611blnL: Joi.number(),
          jmlhPasHidupMatiUmurGen611blnP: Joi.number(),
          jmlhPasHidupMatiUmurGen14thL: Joi.number(),
          jmlhPasHidupMatiUmurGen14thP: Joi.number(),
          jmlhPasHidupMatiUmurGen59thL: Joi.number(),
          jmlhPasHidupMatiUmurGen59thP: Joi.number(),
          jmlhPasHidupMatiUmurGen1014thL: Joi.number(),
          jmlhPasHidupMatiUmurGen1014thP: Joi.number(),
          jmlhPasHidupMatiUmurGen1519thL: Joi.number(),
          jmlhPasHidupMatiUmurGen1519thP: Joi.number(),
          jmlhPasHidupMatiUmurGen2024thL: Joi.number(),
          jmlhPasHidupMatiUmurGen2024thP: Joi.number(),
          jmlhPasHidupMatiUmurGen2529thL: Joi.number(),
          jmlhPasHidupMatiUmurGen2529thP: Joi.number(),
          jmlhPasHidupMatiUmurGen3034thL: Joi.number(),
          jmlhPasHidupMatiUmurGen3034thP: Joi.number(),
          jmlhPasHidupMatiUmurGen3539thL: Joi.number(),
          jmlhPasHidupMatiUmurGen3539thP: Joi.number(),
          jmlhPasHidupMatiUmurGen4044thL: Joi.number(),
          jmlhPasHidupMatiUmurGen4044thP: Joi.number(),
          jmlhPasHidupMatiUmurGen4549thL: Joi.number(),
          jmlhPasHidupMatiUmurGen4549thP: Joi.number(),
          jmlhPasHidupMatiUmurGen5054thL: Joi.number(),
          jmlhPasHidupMatiUmurGen5054thP: Joi.number(),
          jmlhPasHidupMatiUmurGen5559thL: Joi.number(),
          jmlhPasHidupMatiUmurGen5559thP: Joi.number(),
          jmlhPasHidupMatiUmurGen6064thL: Joi.number(),
          jmlhPasHidupMatiUmurGen6064thP: Joi.number(),
          jmlhPasHidupMatiUmurGen6569thL: Joi.number(),
          jmlhPasHidupMatiUmurGen6569thP: Joi.number(),
          jmlhPasHidupMatiUmurGen7074thL: Joi.number(),
          jmlhPasHidupMatiUmurGen7074thP: Joi.number(),
          jmlhPasHidupMatiUmurGen7579thL: Joi.number(),
          jmlhPasHidupMatiUmurGen7579thP: Joi.number(),
          jmlhPasHidupMatiUmurGen8084thL: Joi.number(),
          jmlhPasHidupMatiUmurGen8084thP: Joi.number(),
          jmlhPasHidupMatiUmurGenLebih85thL: Joi.number(),
          jmlhPasHidupMatiUmurGenLebih85thP: Joi.number(),
          jmlhPasKeluarMatiGenL: Joi.number(),
          jmlhPasKeluarMatiGenP: Joi.number(),
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
    const periode =
      String(req.body.periodeTahun) +
      "-" +
      String(req.body.periodeBulan) +
      "-1";
    transaction = await databaseSIRS.transaction();
    const resultInsertHeader = await rlEmpatTitikSatuHeader.create(
      {
        rs_id: req.user.satKerId,
        periode: periode,
        user_id: req.user.id,
      },
      { transaction },
    );

    const dataDetail = req.body.data.map((value, index) => {
      let totalL =
        value.jmlhPasHidupMatiUmurGen01JamL +
        value.jmlhPasHidupMatiUmurGen123JamL +
        value.jmlhPasHidupMatiUmurGen17hrL +
        value.jmlhPasHidupMatiUmurGen828hrL +
        value.jmlhPasHidupMatiUmurGen29hr3blnL +
        value.jmlhPasHidupMatiUmurGen36blnL +
        value.jmlhPasHidupMatiUmurGen611blnL +
        value.jmlhPasHidupMatiUmurGen14thL +
        value.jmlhPasHidupMatiUmurGen59thL +
        value.jmlhPasHidupMatiUmurGen1014thL +
        value.jmlhPasHidupMatiUmurGen1519thL +
        value.jmlhPasHidupMatiUmurGen2024thL +
        value.jmlhPasHidupMatiUmurGen2529thL +
        value.jmlhPasHidupMatiUmurGen3034thL +
        value.jmlhPasHidupMatiUmurGen3539thL +
        value.jmlhPasHidupMatiUmurGen4044thL +
        value.jmlhPasHidupMatiUmurGen4549thL +
        value.jmlhPasHidupMatiUmurGen5054thL +
        value.jmlhPasHidupMatiUmurGen5559thL +
        value.jmlhPasHidupMatiUmurGen6064thL +
        value.jmlhPasHidupMatiUmurGen6569thL +
        value.jmlhPasHidupMatiUmurGen7074thL +
        value.jmlhPasHidupMatiUmurGen7579thL +
        value.jmlhPasHidupMatiUmurGen8084thL +
        value.jmlhPasHidupMatiUmurGenLebih85thL;

      let totalP =
        value.jmlhPasHidupMatiUmurGen01JamP +
        value.jmlhPasHidupMatiUmurGen123JamP +
        value.jmlhPasHidupMatiUmurGen17hrP +
        value.jmlhPasHidupMatiUmurGen828hrP +
        value.jmlhPasHidupMatiUmurGen29hr3blnP +
        value.jmlhPasHidupMatiUmurGen36blnP +
        value.jmlhPasHidupMatiUmurGen611blnP +
        value.jmlhPasHidupMatiUmurGen14thP +
        value.jmlhPasHidupMatiUmurGen59thP +
        value.jmlhPasHidupMatiUmurGen1014thP +
        value.jmlhPasHidupMatiUmurGen1519thP +
        value.jmlhPasHidupMatiUmurGen2024thP +
        value.jmlhPasHidupMatiUmurGen2529thP +
        value.jmlhPasHidupMatiUmurGen3034thP +
        value.jmlhPasHidupMatiUmurGen3539thP +
        value.jmlhPasHidupMatiUmurGen4044thP +
        value.jmlhPasHidupMatiUmurGen4549thP +
        value.jmlhPasHidupMatiUmurGen5054thP +
        value.jmlhPasHidupMatiUmurGen5559thP +
        value.jmlhPasHidupMatiUmurGen6064thP +
        value.jmlhPasHidupMatiUmurGen6569thP +
        value.jmlhPasHidupMatiUmurGen7074thP +
        value.jmlhPasHidupMatiUmurGen7579thP +
        value.jmlhPasHidupMatiUmurGen8084thP +
        value.jmlhPasHidupMatiUmurGenLebih85thP;

      let total = totalL + totalP;

      let totalKeluar =
        value.jmlhPasKeluarMatiGenL + value.jmlhPasKeluarMatiGenP;

      return {
        rl_empat_titik_satu_id: resultInsertHeader.id,
        rs_id: req.user.satKerId,
        periode: periode,
        icd_id: req.body.icdId,
        jmlh_pas_hidup_mati_umur_gen_0_1jam_l:
          value.jmlhPasHidupMatiUmurGen01JamL,
        jmlh_pas_hidup_mati_umur_gen_0_1jam_p:
          value.jmlhPasHidupMatiUmurGen01JamP,
        jmlh_pas_hidup_mati_umur_gen_1_23jam_l:
          value.jmlhPasHidupMatiUmurGen123JamL,
        jmlh_pas_hidup_mati_umur_gen_1_23jam_p:
          value.jmlhPasHidupMatiUmurGen123JamP,
        jmlh_pas_hidup_mati_umur_gen_1_7hr_l:
          value.jmlhPasHidupMatiUmurGen17hrL,
        jmlh_pas_hidup_mati_umur_gen_1_7hr_p:
          value.jmlhPasHidupMatiUmurGen17hrP,
        jmlh_pas_hidup_mati_umur_gen_8_28hr_l:
          value.jmlhPasHidupMatiUmurGen828hrL,
        jmlh_pas_hidup_mati_umur_gen_8_28hr_p:
          value.jmlhPasHidupMatiUmurGen828hrP,
        jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l:
          value.jmlhPasHidupMatiUmurGen29hr3blnL,
        jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p:
          value.jmlhPasHidupMatiUmurGen29hr3blnP,
        jmlh_pas_hidup_mati_umur_gen_3_6bln_l:
          value.jmlhPasHidupMatiUmurGen36blnL,
        jmlh_pas_hidup_mati_umur_gen_3_6bln_p:
          value.jmlhPasHidupMatiUmurGen36blnP,
        jmlh_pas_hidup_mati_umur_gen_6_11bln_l:
          value.jmlhPasHidupMatiUmurGen611blnL,
        jmlh_pas_hidup_mati_umur_gen_6_11bln_p:
          value.jmlhPasHidupMatiUmurGen611blnP,
        jmlh_pas_hidup_mati_umur_gen_1_4th_l:
          value.jmlhPasHidupMatiUmurGen14thL,
        jmlh_pas_hidup_mati_umur_gen_1_4th_p:
          value.jmlhPasHidupMatiUmurGen14thP,
        jmlh_pas_hidup_mati_umur_gen_5_9th_l:
          value.jmlhPasHidupMatiUmurGen59thL,
        jmlh_pas_hidup_mati_umur_gen_5_9th_p:
          value.jmlhPasHidupMatiUmurGen59thP,
        jmlh_pas_hidup_mati_umur_gen_10_14th_l:
          value.jmlhPasHidupMatiUmurGen1014thL,
        jmlh_pas_hidup_mati_umur_gen_10_14th_p:
          value.jmlhPasHidupMatiUmurGen1014thP,
        jmlh_pas_hidup_mati_umur_gen_15_19th_l:
          value.jmlhPasHidupMatiUmurGen1519thL,
        jmlh_pas_hidup_mati_umur_gen_15_19th_p:
          value.jmlhPasHidupMatiUmurGen1519thP,
        jmlh_pas_hidup_mati_umur_gen_20_24th_l:
          value.jmlhPasHidupMatiUmurGen2024thL,
        jmlh_pas_hidup_mati_umur_gen_20_24th_p:
          value.jmlhPasHidupMatiUmurGen2024thP,
        jmlh_pas_hidup_mati_umur_gen_25_29th_l:
          value.jmlhPasHidupMatiUmurGen2529thL,
        jmlh_pas_hidup_mati_umur_gen_25_29th_p:
          value.jmlhPasHidupMatiUmurGen2529thP,
        jmlh_pas_hidup_mati_umur_gen_30_34th_l:
          value.jmlhPasHidupMatiUmurGen3034thL,
        jmlh_pas_hidup_mati_umur_gen_30_34th_p:
          value.jmlhPasHidupMatiUmurGen3034thP,
        jmlh_pas_hidup_mati_umur_gen_35_39th_l:
          value.jmlhPasHidupMatiUmurGen3539thL,
        jmlh_pas_hidup_mati_umur_gen_35_39th_p:
          value.jmlhPasHidupMatiUmurGen3539thP,
        jmlh_pas_hidup_mati_umur_gen_40_44th_l:
          value.jmlhPasHidupMatiUmurGen4044thL,
        jmlh_pas_hidup_mati_umur_gen_40_44th_p:
          value.jmlhPasHidupMatiUmurGen4044thP,
        jmlh_pas_hidup_mati_umur_gen_45_49th_l:
          value.jmlhPasHidupMatiUmurGen4549thL,
        jmlh_pas_hidup_mati_umur_gen_45_49th_p:
          value.jmlhPasHidupMatiUmurGen4549thP,
        jmlh_pas_hidup_mati_umur_gen_50_54th_l:
          value.jmlhPasHidupMatiUmurGen5054thL,
        jmlh_pas_hidup_mati_umur_gen_50_54th_p:
          value.jmlhPasHidupMatiUmurGen5054thP,
        jmlh_pas_hidup_mati_umur_gen_55_59th_l:
          value.jmlhPasHidupMatiUmurGen5559thL,
        jmlh_pas_hidup_mati_umur_gen_55_59th_p:
          value.jmlhPasHidupMatiUmurGen5559thP,
        jmlh_pas_hidup_mati_umur_gen_60_64th_l:
          value.jmlhPasHidupMatiUmurGen6064thL,
        jmlh_pas_hidup_mati_umur_gen_60_64th_p:
          value.jmlhPasHidupMatiUmurGen6064thP,
        jmlh_pas_hidup_mati_umur_gen_65_69th_l:
          value.jmlhPasHidupMatiUmurGen6569thL,
        jmlh_pas_hidup_mati_umur_gen_65_69th_p:
          value.jmlhPasHidupMatiUmurGen6569thP,
        jmlh_pas_hidup_mati_umur_gen_70_74th_l:
          value.jmlhPasHidupMatiUmurGen7074thL,
        jmlh_pas_hidup_mati_umur_gen_70_74th_p:
          value.jmlhPasHidupMatiUmurGen7074thP,
        jmlh_pas_hidup_mati_umur_gen_75_79th_l:
          value.jmlhPasHidupMatiUmurGen7579thL,
        jmlh_pas_hidup_mati_umur_gen_75_79th_p:
          value.jmlhPasHidupMatiUmurGen7579thP,
        jmlh_pas_hidup_mati_umur_gen_80_84th_l:
          value.jmlhPasHidupMatiUmurGen8084thL,
        jmlh_pas_hidup_mati_umur_gen_80_84th_p:
          value.jmlhPasHidupMatiUmurGen8084thP,
        jmlh_pas_hidup_mati_umur_gen_lebih85th_l:
          value.jmlhPasHidupMatiUmurGenLebih85thL,
        jmlh_pas_hidup_mati_umur_gen_lebih85th_p:
          value.jmlhPasHidupMatiUmurGenLebih85thP,
        jmlh_pas_hidup_mati_gen_l: totalL,
        jmlh_pas_hidup_mati_gen_p: totalP,
        total_pas_hidup_mati: total,
        jmlh_pas_keluar_mati_gen_l: value.jmlhPasKeluarMatiGenL,
        jmlh_pas_keluar_mati_gen_p: value.jmlhPasKeluarMatiGenP,
        total_pas_keluar_mati: totalKeluar,
        user_id: req.user.id,
      };
    });

    if (
      dataDetail[0].total_pas_keluar_mati > dataDetail[0].total_pas_hidup_mati
    ) {
      await transaction.rollback();
      res.status(400).send({
        status: false,
        message: "Data Jumlah Pasien Mati Lebih Dari Jumlah Pasien Hidup/Mati",
      });
    } else if (
      dataDetail[0].jmlh_pas_keluar_mati_gen_l >
      dataDetail[0].jmlh_pas_hidup_mati_gen_l
    ) {
      await transaction.rollback();
      res.status(400).send({
        status: false,
        message:
          "Data Jumlah Pasien Mati Laki-Laki Lebih Dari Jumlah Pasien Hidup/Mati Laki-Laki",
      });
    } else if (
      dataDetail[0].jmlh_pas_keluar_mati_gen_p >
      dataDetail[0].jmlh_pas_hidup_mati_gen_p
    ) {
      await transaction.rollback();
      res.status(400).send({
        status: false,
        message:
          "Data Jumlah Pasien Mati Perempuan Lebih Dari Jumlah Pasien Hidup/Mati Perempuan",
      });
    } else {
      const resultInsertDetail = await rlEmpatTitikSatuDetail.bulkCreate(
        dataDetail,
        {
          transaction,
          updateOnDuplicate: [
            "jmlh_pas_hidup_mati_umur_gen_0_1jam_l",
            "jmlh_pas_hidup_mati_umur_gen_0_1jam_p",
            "jmlh_pas_hidup_mati_umur_gen_1_23jam_l",
            "jmlh_pas_hidup_mati_umur_gen_1_23jam_p",
            "jmlh_pas_hidup_mati_umur_gen_1_7hr_l",
            "jmlh_pas_hidup_mati_umur_gen_1_7hr_p",
            "jmlh_pas_hidup_mati_umur_gen_8_28hr_l",
            "jmlh_pas_hidup_mati_umur_gen_8_28hr_p",
            "jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l",
            "jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p",
            "jmlh_pas_hidup_mati_umur_gen_3_6bln_l",
            "jmlh_pas_hidup_mati_umur_gen_3_6bln_p",
            "jmlh_pas_hidup_mati_umur_gen_6_11bln_l",
            "jmlh_pas_hidup_mati_umur_gen_6_11bln_p",
            "jmlh_pas_hidup_mati_umur_gen_1_4th_l",
            "jmlh_pas_hidup_mati_umur_gen_1_4th_p",
            "jmlh_pas_hidup_mati_umur_gen_5_9th_l",
            "jmlh_pas_hidup_mati_umur_gen_5_9th_p",
            "jmlh_pas_hidup_mati_umur_gen_10_14th_l",
            "jmlh_pas_hidup_mati_umur_gen_10_14th_p",
            "jmlh_pas_hidup_mati_umur_gen_15_19th_l",
            "jmlh_pas_hidup_mati_umur_gen_15_19th_p",
            "jmlh_pas_hidup_mati_umur_gen_20_24th_l",
            "jmlh_pas_hidup_mati_umur_gen_20_24th_p",
            "jmlh_pas_hidup_mati_umur_gen_25_29th_l",
            "jmlh_pas_hidup_mati_umur_gen_25_29th_p",
            "jmlh_pas_hidup_mati_umur_gen_30_34th_l",
            "jmlh_pas_hidup_mati_umur_gen_30_34th_p",
            "jmlh_pas_hidup_mati_umur_gen_35_39th_l",
            "jmlh_pas_hidup_mati_umur_gen_35_39th_p",
            "jmlh_pas_hidup_mati_umur_gen_40_44th_l",
            "jmlh_pas_hidup_mati_umur_gen_40_44th_p",
            "jmlh_pas_hidup_mati_umur_gen_45_49th_l",
            "jmlh_pas_hidup_mati_umur_gen_45_49th_p",
            "jmlh_pas_hidup_mati_umur_gen_50_54th_l",
            "jmlh_pas_hidup_mati_umur_gen_50_54th_p",
            "jmlh_pas_hidup_mati_umur_gen_55_59th_l",
            "jmlh_pas_hidup_mati_umur_gen_55_59th_p",
            "jmlh_pas_hidup_mati_umur_gen_60_64th_l",
            "jmlh_pas_hidup_mati_umur_gen_60_64th_p",
            "jmlh_pas_hidup_mati_umur_gen_65_69th_l",
            "jmlh_pas_hidup_mati_umur_gen_65_69th_p",
            "jmlh_pas_hidup_mati_umur_gen_70_74th_l",
            "jmlh_pas_hidup_mati_umur_gen_70_74th_p",
            "jmlh_pas_hidup_mati_umur_gen_75_79th_l",
            "jmlh_pas_hidup_mati_umur_gen_75_79th_p",
            "jmlh_pas_hidup_mati_umur_gen_80_84th_l",
            "jmlh_pas_hidup_mati_umur_gen_80_84th_p",
            "jmlh_pas_hidup_mati_umur_gen_lebih85th_l",
            "jmlh_pas_hidup_mati_umur_gen_lebih85th_p",
            "jmlh_pas_hidup_mati_gen_l",
            "jmlh_pas_hidup_mati_gen_p",
            "total_pas_hidup_mati",
            "jmlh_pas_keluar_mati_gen_l",
            "jmlh_pas_keluar_mati_gen_p",
            "total_pas_keluar_mati",
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
    }
    // if (
    //   dataDetail[0].total_pas_keluar_mati <= dataDetail[0].total_pas_hidup_mati &&
    //   dataDetail[0].jmlh_pas_keluar_mati_gen_l <= dataDetail[0].jmlh_pas_hidup_mati_gen_l &&
    //   dataDetail[0].jmlh_pas_keluar_mati_gen_p <= dataDetail[0].jmlh_pas_hidup_mati_gen_p

    // ) {
    //   const resultInsertDetail = await rlEmpatTitikSatuDetail.bulkCreate(dataDetail, {
    //     transaction,
    //     updateOnDuplicate: [
    //       "jmlh_pas_hidup_mati_umur_gen_0_1jam_l",
    //       "jmlh_pas_hidup_mati_umur_gen_0_1jam_p",
    //       "jmlh_pas_hidup_mati_umur_gen_1_23jam_l",
    //       "jmlh_pas_hidup_mati_umur_gen_1_23jam_p",
    //       "jmlh_pas_hidup_mati_umur_gen_1_7hr_l",
    //       "jmlh_pas_hidup_mati_umur_gen_1_7hr_p",
    //       "jmlh_pas_hidup_mati_umur_gen_8_28hr_l",
    //       "jmlh_pas_hidup_mati_umur_gen_8_28hr_p",
    //       "jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l",
    //       "jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p",
    //       "jmlh_pas_hidup_mati_umur_gen_3_6bln_l",
    //       "jmlh_pas_hidup_mati_umur_gen_3_6bln_p",
    //       "jmlh_pas_hidup_mati_umur_gen_6_11bln_l",
    //       "jmlh_pas_hidup_mati_umur_gen_6_11bln_p",
    //       "jmlh_pas_hidup_mati_umur_gen_1_4th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_1_4th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_5_9th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_5_9th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_10_14th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_10_14th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_15_19th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_15_19th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_20_24th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_20_24th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_25_29th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_25_29th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_30_34th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_30_34th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_35_39th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_35_39th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_40_44th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_40_44th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_45_49th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_45_49th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_50_54th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_50_54th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_55_59th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_55_59th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_60_64th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_60_64th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_65_69th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_65_69th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_70_74th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_70_74th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_75_79th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_75_79th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_80_84th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_80_84th_p",
    //       "jmlh_pas_hidup_mati_umur_gen_lebih85th_l",
    //       "jmlh_pas_hidup_mati_umur_gen_lebih85th_p",
    //       "jmlh_pas_hidup_mati_gen_l",
    //       "jmlh_pas_hidup_mati_gen_p",
    //       "total_pas_hidup_mati",
    //       "jmlh_pas_keluar_mati_gen_l",
    //       "jmlh_pas_keluar_mati_gen_p",
    //       "total_pas_keluar_mati"
    //     ],
    //   });
    //   await transaction.commit();
    //   res.status(201).send({
    //     status: true,
    //     message: "data created",
    //     data: {
    //       id: resultInsertHeader.id,
    //     },
    //   });
    // } else {
    //   res.status(400).send({
    //     status: false,
    //     message: "Data Jumlah Pasien Mati Lebih Dari Jumlah Pasien Hidup/Mati",
    //   });
    //   await transaction.rollback();
    // }
  } catch (error) {
    if (transaction) {
      if (error.name == "SequelizeForeignKeyConstraintError") {
        res.status(400).send({
          status: false,
          message: "Gagal Input Data, Jenis Kegiatan Salah.",
        });
      } else {
        //console.log(error)
        res.status(400).send({
          status: false,
          message: "Gagal Input Data.",
        });
      }
    }
    await transaction.rollback();
  }
};

export const updateDataRLEmpatTitikSatu = async (req, res) => {
  const schema = Joi.object({
    jmlh_pas_hidup_mati_umur_gen_0_1jam_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_0_1jam_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_1_23jam_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_1_23jam_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_1_7hr_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_1_7hr_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_8_28hr_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_8_28hr_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_3_6bln_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_3_6bln_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_6_11bln_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_6_11bln_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_1_4th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_1_4th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_5_9th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_5_9th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_10_14th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_10_14th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_15_19th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_15_19th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_20_24th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_20_24th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_25_29th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_25_29th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_30_34th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_30_34th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_35_39th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_35_39th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_40_44th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_40_44th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_45_49th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_45_49th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_50_54th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_50_54th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_55_59th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_55_59th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_60_64th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_60_64th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_65_69th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_65_69th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_70_74th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_70_74th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_75_79th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_75_79th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_80_84th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_80_84th_p: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_lebih85th_l: Joi.number().min(0),
    jmlh_pas_hidup_mati_umur_gen_lebih85th_p: Joi.number().min(0),
    jmlh_pas_keluar_mati_gen_l: Joi.number().min(0),
    jmlh_pas_keluar_mati_gen_p: Joi.number().min(0),
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
    let jumlahL =
      req.body.jmlh_pas_hidup_mati_umur_gen_0_1jam_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_1_23jam_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_1_7hr_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_8_28hr_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_3_6bln_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_6_11bln_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_1_4th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_5_9th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_10_14th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_15_19th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_20_24th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_25_29th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_30_34th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_35_39th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_40_44th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_45_49th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_50_54th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_55_59th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_60_64th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_65_69th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_70_74th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_75_79th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_80_84th_l +
      req.body.jmlh_pas_hidup_mati_umur_gen_lebih85th_l;

    let jumlahP =
      req.body.jmlh_pas_hidup_mati_umur_gen_0_1jam_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_1_23jam_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_1_7hr_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_8_28hr_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_3_6bln_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_6_11bln_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_1_4th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_5_9th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_10_14th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_15_19th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_20_24th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_25_29th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_30_34th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_35_39th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_40_44th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_45_49th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_50_54th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_55_59th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_60_64th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_65_69th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_70_74th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_75_79th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_80_84th_p +
      req.body.jmlh_pas_hidup_mati_umur_gen_lebih85th_p;

    let jumlahall = jumlahL + jumlahP;
    let totalKeluar =
      req.body.jmlh_pas_keluar_mati_gen_l + req.body.jmlh_pas_keluar_mati_gen_p;

    const dataUpdate = {
      jmlh_pas_hidup_mati_umur_gen_0_1jam_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_0_1jam_l,
      jmlh_pas_hidup_mati_umur_gen_0_1jam_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_0_1jam_p,
      jmlh_pas_hidup_mati_umur_gen_1_23jam_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_1_23jam_l,
      jmlh_pas_hidup_mati_umur_gen_1_23jam_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_1_23jam_p,
      jmlh_pas_hidup_mati_umur_gen_1_7hr_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_1_7hr_l,
      jmlh_pas_hidup_mati_umur_gen_1_7hr_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_1_7hr_p,
      jmlh_pas_hidup_mati_umur_gen_8_28hr_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_8_28hr_l,
      jmlh_pas_hidup_mati_umur_gen_8_28hr_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_8_28hr_p,
      jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l,
      jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p,
      jmlh_pas_hidup_mati_umur_gen_3_6bln_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_3_6bln_l,
      jmlh_pas_hidup_mati_umur_gen_3_6bln_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_3_6bln_p,
      jmlh_pas_hidup_mati_umur_gen_6_11bln_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_6_11bln_l,
      jmlh_pas_hidup_mati_umur_gen_6_11bln_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_6_11bln_p,
      jmlh_pas_hidup_mati_umur_gen_1_4th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_1_4th_l,
      jmlh_pas_hidup_mati_umur_gen_1_4th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_1_4th_p,
      jmlh_pas_hidup_mati_umur_gen_5_9th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_5_9th_l,
      jmlh_pas_hidup_mati_umur_gen_5_9th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_5_9th_p,
      jmlh_pas_hidup_mati_umur_gen_10_14th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_10_14th_l,
      jmlh_pas_hidup_mati_umur_gen_10_14th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_10_14th_p,
      jmlh_pas_hidup_mati_umur_gen_15_19th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_15_19th_l,
      jmlh_pas_hidup_mati_umur_gen_15_19th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_15_19th_p,
      jmlh_pas_hidup_mati_umur_gen_20_24th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_20_24th_l,
      jmlh_pas_hidup_mati_umur_gen_20_24th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_20_24th_p,
      jmlh_pas_hidup_mati_umur_gen_25_29th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_25_29th_l,
      jmlh_pas_hidup_mati_umur_gen_25_29th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_25_29th_p,
      jmlh_pas_hidup_mati_umur_gen_30_34th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_30_34th_l,
      jmlh_pas_hidup_mati_umur_gen_30_34th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_30_34th_p,
      jmlh_pas_hidup_mati_umur_gen_35_39th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_35_39th_l,
      jmlh_pas_hidup_mati_umur_gen_35_39th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_35_39th_p,
      jmlh_pas_hidup_mati_umur_gen_40_44th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_40_44th_l,
      jmlh_pas_hidup_mati_umur_gen_40_44th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_40_44th_p,
      jmlh_pas_hidup_mati_umur_gen_45_49th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_45_49th_l,
      jmlh_pas_hidup_mati_umur_gen_45_49th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_45_49th_p,
      jmlh_pas_hidup_mati_umur_gen_50_54th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_50_54th_l,
      jmlh_pas_hidup_mati_umur_gen_50_54th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_50_54th_p,
      jmlh_pas_hidup_mati_umur_gen_55_59th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_55_59th_l,
      jmlh_pas_hidup_mati_umur_gen_55_59th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_55_59th_p,
      jmlh_pas_hidup_mati_umur_gen_60_64th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_60_64th_l,
      jmlh_pas_hidup_mati_umur_gen_60_64th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_60_64th_p,
      jmlh_pas_hidup_mati_umur_gen_65_69th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_65_69th_l,
      jmlh_pas_hidup_mati_umur_gen_65_69th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_65_69th_p,
      jmlh_pas_hidup_mati_umur_gen_70_74th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_70_74th_l,
      jmlh_pas_hidup_mati_umur_gen_70_74th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_70_74th_p,
      jmlh_pas_hidup_mati_umur_gen_75_79th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_75_79th_l,
      jmlh_pas_hidup_mati_umur_gen_75_79th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_75_79th_p,
      jmlh_pas_hidup_mati_umur_gen_80_84th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_80_84th_l,
      jmlh_pas_hidup_mati_umur_gen_80_84th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_80_84th_p,
      jmlh_pas_hidup_mati_umur_gen_lebih85th_l:
        req.body.jmlh_pas_hidup_mati_umur_gen_lebih85th_l,
      jmlh_pas_hidup_mati_umur_gen_lebih85th_p:
        req.body.jmlh_pas_hidup_mati_umur_gen_lebih85th_p,
      jmlh_pas_hidup_mati_gen_l: jumlahL,
      jmlh_pas_hidup_mati_gen_p: jumlahP,
      total_pas_hidup_mati: jumlahall,
      jmlh_pas_keluar_mati_gen_l: req.body.jmlh_pas_keluar_mati_gen_l,
      jmlh_pas_keluar_mati_gen_p: req.body.jmlh_pas_keluar_mati_gen_p,
      total_pas_keluar_mati: totalKeluar,
    };
    transaction = await databaseSIRS.transaction();
    if (totalKeluar <= jumlahall) {
      const update = await rlEmpatTitikSatuDetail.update(dataUpdate, {
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
        message: "Data Jumlah Pasien Mati Lebih Dari Jumlah Pasien Hidup/Mati",
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

export const deleteDataRLEmpatTitikSatu = async (req, res) => {
  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
    const count = await rlEmpatTitikSatuDetail.destroy({
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

// export const getRLEmpatTitikDua = (req, res) => {
//   const joi = Joi.extend(joiDate)
//   const schema = joi.object({
//     rsId: joi.string().required(),
//     periode: joi.date().format("YYYY-MM").required(),
//     page: joi.number(),
//     limit: joi.number()
// })

//   const { error, value } =  schema.validate(req.query)

//   if (error) {
//       res.status(400).send({
//           status: false,
//           message: error.details[0].message
//       })
//       return
//   }
//   if(req.user.jenisUserId == 4){
//     if(req.query.rsId != req.user.satKerId){
//       res.status(404).send({
//         status: false,
//         message: "Kode RS Tidak Sesuai",
//       });
//       return;
//     }
//   }

//   req.query.periode = req.query.periode+'-01'

//   get42(req, (err, results) => {
//       // console.log(results)
//       const message = results.length ? 'data found' : 'data not found'
//       res.status(200).send({
//           status: true,
//           message: message,
//           data: results
//       })
//   })
// }

// export const getRLEmpatTitikTiga = (req, res) => {
//   const joi = Joi.extend(joiDate)

//   const schema = joi.object({
//     rsId: joi.string().required(),
//     periode: joi.date().format("YYYY-MM").required(),
// })
//   const { error, value } =  schema.validate(req.query)

//   if (error) {
//       res.status(400).send({
//           status: false,
//           message: error.details[0].message
//       })
//       return
//   }

//   if(req.user.jenisUserId == 4){
//     if(req.query.rsId != req.user.satKerId){
//       res.status(404).send({
//         status: false,
//         message: "Kode RS Tidak Sesuai",
//       });
//       return;
//     }
//   }

//   req.query.periode = req.query.periode+'-01'

//   get43(req, (err, results) => {
//       // console.log(req.user)
//       const message = results.length ? 'data found' : 'data not found'
//       res.status(200).send({
//           status: true,
//           message: message,
//           data: results
//       })
//   })
// }

export const getDataRLEmpatTitikSatuWithSatuSehat = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY-MM").required(),
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
      rlEmpatTitikSatuSatuSehat.findAll({
        where: { organization_id, bulan_laporan: periodeFormatted },
        limit,
        offset,
        order: [["id", "ASC"]],
      }),
      rlEmpatTitikSatuSatuSehat.count({
        where: { organization_id, bulan_laporan: periodeFormatted },
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

    if (stale && !currentlySyncing) {
      // OTOMATIS SYNC
      // doSync(organization_id, periodeShort)
      //   .then(() => notifySseClients(organization_id, periodeShort))
      //   .catch((err) =>
      //     console.error(`[Sync BG Error] RS ${rsIdFinal}:`, err.message),
      //   );
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

// ============================================
// DOWNLOAD RL 4.1 SATU SEHAT
// ============================================

export const downloadDataRLEmpatTitikSatuSatuSehat = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    provId: joi.string().allow("", null).optional(),
    kabId: joi.string().allow("", null).optional(),
    rsId: joi.string().allow("", null).optional(),
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
        },
      ];

      orgToRsMap.set(orgIdShort, rsList[0]);
      orgIdList = [orgIdShort];
    } else {
      // ---- Role 1/2/3: ambil daftar RS per wilayah, seperti sebelumnya ----
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
    const namaFile = `RL_41_SatuSehat_${tahunBulan}_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);

    await tulisExcelRL41SatuSehat({
      res,
      orgToRsMap,
      orgIdList,
      periode: req.query.periode,
      judul: "SIRS ONLINE RL 4.1 - SATU SEHAT",
      modelDetail: rlEmpatTitikSatuSatuSehat,
      tampilkanOrgId: jenisUserId === 4,
    });
  } catch (err) {
    console.error("downloadDataRLEmpatTitikSatuSatuSehat:", err.message);
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
// KONFIGURASI KOLOM EXCEL RL 4.1 SATU SEHAT
// ============================================

const KELOMPOK_UMUR_SS = [
  { key: "0_1jam", label: "0 - 1 Jam" },
  { key: "1_23jam", label: "1 - 23 Jam" },
  { key: "1_7hr", label: "1 - 7 Hari" },
  { key: "8_28hr", label: "8 - 28 Hari" },
  { key: "29hr_3bln", label: "29 Hari - <3 Bulan" },
  { key: "3_6bln", label: "3 - <6 Bulan" },
  { key: "6_11bln", label: "6 - 11 Bulan" },
  { key: "1_4th", label: "1 - 4 Tahun" },
  { key: "5_9th", label: "5 - 9 Tahun" },
  { key: "10_14th", label: "10 - 14 Tahun" },
  { key: "15_19th", label: "15 - 19 Tahun" },
  { key: "20_24th", label: "20 - 24 Tahun" },
  { key: "25_29th", label: "25 - 29 Tahun" },
  { key: "30_34th", label: "30 - 34 Tahun" },
  { key: "35_39th", label: "35 - 39 Tahun" },
  { key: "40_44th", label: "40 - 44 Tahun" },
  { key: "45_49th", label: "45 - 49 Tahun" },
  { key: "50_54th", label: "50 - 54 Tahun" },
  { key: "55_59th", label: "55 - 59 Tahun" },
  { key: "60_64th", label: "60 - 64 Tahun" },
  { key: "65_69th", label: "65 - 69 Tahun" },
  { key: "70_74th", label: "70 - 74 Tahun" },
  { key: "75_79th", label: "75 - 79 Tahun" },
  { key: "80_84th", label: "80 - 84 Tahun" },
  { key: "lebih85th", label: "≥ 85 Tahun" },
];

const KOLOM_TOTAL_SS = [
  { key: "keluar_hidup_mati_l", label: "Total Keluar Hidup & Mati (L)" },
  { key: "keluar_hidup_mati_p", label: "Total Keluar Hidup & Mati (P)" },
  { key: "keluar_hidup_mati_total", label: "Total Keluar Hidup & Mati" },
  { key: "keluar_mati_l", label: "Total Keluar Mati (L)" },
  { key: "keluar_mati_p", label: "Total Keluar Mati (P)" },
  { key: "keluar_mati_total", label: "Total Keluar Mati" },
];

const kolomAngkaSS = [
  ...KELOMPOK_UMUR_SS.flatMap((u) => [
    {
      header: "L",
      group: `${u.label} (Hidup&Mati)`,
      key: `jmlh_pas_hidup_mati_umur_gen_${u.key}_l`,
      width: 6,
    },
    {
      header: "P",
      group: `${u.label} (Hidup&Mati)`,
      key: `jmlh_pas_hidup_mati_umur_gen_${u.key}_p`,
      width: 6,
    },
  ]),
  ...KELOMPOK_UMUR_SS.flatMap((u) => [
    {
      header: "L",
      group: `${u.label} (Mati)`,
      key: `jmlh_pas_mati_umur_gen_${u.key}_l`,
      width: 6,
    },
    {
      header: "P",
      group: `${u.label} (Mati)`,
      key: `jmlh_pas_mati_umur_gen_${u.key}_p`,
      width: 6,
    },
  ]),
  ...KOLOM_TOTAL_SS.map((t) => ({
    header: t.label,
    group: null,
    key: t.key,
    width: 16,
  })),
];

const kolomIdentitasSS = [
  { header: "No", group: null, key: "no", width: 5 },
  { header: "Kode RS", group: null, key: "kodeRs", width: 12 },
  { header: "Nama RS", group: null, key: "namaRs", width: 35 },
  // { header: "Organization ID", group: null, key: "organizationId", width: 20 },
  { header: "Kode ICD", group: null, key: "kodeIcd", width: 12 },
  { header: "Diagnosis", group: null, key: "diagnosis", width: 40 },
  { header: "Bulan Laporan", group: null, key: "bulanLaporan", width: 14 },
];

const semuaKolomSS = [...kolomIdentitasSS, ...kolomAngkaSS];

const NAMA_BULAN_SS = [
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

const BORDER_TIPIS_SS = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const tulisExcelRL41SatuSehat = async ({
  res,
  orgToRsMap,
  orgIdList,
  periode,
  judul = "SIRS ONLINE RL 4.1 - SATU SEHAT",
  modelDetail,
  tampilkanOrgId = false,
}) => {
  // Bangun kolom identitas secara dinamis
  const kolomIdentitasSS = [
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
    { header: "Bulan Laporan", group: null, key: "bulanLaporan", width: 14 },
  ];

  const semuaKolomSS = [...kolomIdentitasSS, ...kolomAngkaSS];
  const totalKolom = semuaKolomSS.length;

  const [tahunStr, bulanStr] = periode.split("-");
  const namaBulan = NAMA_BULAN_SS[parseInt(bulanStr, 10) - 1];

  // ---- Setup workbook & sheet ----
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });
  const sheet = workbook.addWorksheet("RL 4.1 SatuSehat", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 7 }],
  });

  sheet.columns = semuaKolomSS.map((k) => ({ key: k.key, width: k.width }));

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

  // ---- Header tabel ----
  // ---- Header tabel: 3 baris (grup besar, kelompok umur, L/P) ----
  const JUMLAH_KOLOM_IDENTITAS_SS = kolomIdentitasSS.length;
  // kolomAngkaSS menggabungkan kolom umur + kolom total jadi satu array,
  // jadi perlu dikurangi jumlah kolom total (KOLOM_TOTAL_SS) untuk dapat jumlah kolom umur saja
  const JUMLAH_KOLOM_UMUR_SS = kolomAngkaSS.length - KOLOM_TOTAL_SS.length;

  const baris0 = semuaKolomSS.map((k) => (k.group ? "" : k.header));
  baris0[JUMLAH_KOLOM_IDENTITAS_SS] = "PASIEN KELUAR HIDUP & MATI";

  const baris1 = semuaKolomSS.map((k) => (k.group ? k.group : ""));
  const baris2 = semuaKolomSS.map((k) => (k.group ? k.header : ""));

  const r0 = sheet.addRow(baris0);
  const r1 = sheet.addRow(baris1);
  const r2 = sheet.addRow(baris2);

  sheet.mergeCells(
    r0.number,
    JUMLAH_KOLOM_IDENTITAS_SS + 1,
    r0.number,
    JUMLAH_KOLOM_IDENTITAS_SS + JUMLAH_KOLOM_UMUR_SS,
  );

  const rowHeaderAwal = r1.number;
  let col = 1;
  while (col <= totalKolom) {
    const k = semuaKolomSS[col - 1];
    if (!k.group) {
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
      cell.border = BORDER_TIPIS_SS;
    });
    r.commit();
  });

  // ---- Isi data ----
  const BATCH_SIZE_SS = 1000;
  let totalBaris = 0;
  let no = 1;
  let offset = 0;

  while (true) {
    const rows = await modelDetail.findAll({
      where: {
        organization_id: { [Op.in]: orgIdList },
        bulan_laporan: periode,
      },
      order: [
        ["organization_id", "ASC"],
        ["id", "ASC"],
      ],
      limit: BATCH_SIZE_SS,
      offset,
    });

    if (rows.length === 0) break;

    for (const row of rows) {
      const data = row.toJSON();
      const rsInfo = orgToRsMap.get(String(data.organization_id));

      const baris = {
        no: no++,
        kodeRs: rsInfo?.kodeRs ?? "",
        namaRs: rsInfo?.namaRs ?? "",
        ...(tampilkanOrgId ? { organizationId: data.organization_id } : {}),
        kodeIcd: data.kode_icd ?? "",
        diagnosis: data.diagnosis ?? "",
        bulanLaporan: data.bulan_laporan ?? "",
      };

      kolomAngkaSS.forEach((k) => {
        baris[k.key] = data[k.key] ?? 0;
      });

      const rowData = sheet.addRow(baris);
      rowData.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = BORDER_TIPIS_SS;
        cell.alignment = { vertical: "middle" };
      });
      rowData.commit();
    }

    totalBaris += rows.length;
    offset += rows.length;

    if (rows.length < BATCH_SIZE_SS) break;
  }

  await sheet.commit();
  await workbook.commit();
  return totalBaris;
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

export const manualSyncRL41 = async (req, res) => {
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

    // Langsung sync tanpa cek isStale (ini manual, jadi force)
    doSync(organization_id, periode)
      .then(() => notifySseClients(organization_id, periode))
      .catch((err) => console.error("[Manual Sync Error]", err.message));

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

export const downloadDataRLEmpatTitikSatu = async (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    provId: joi.string().allow("", null).optional(),
    kabId: joi.string().allow("", null).optional(),
    rsId: joi.string().allow("", null).optional(),
    periode: joi.date().format("YYYY-MM").required(),
  });

  const { error, value } = schema.validate(req.query);
  if (error)
    return res
      .status(400)
      .send({ status: false, message: error.details[0].message });

  const jenisUserId = req.user.jenisUserId;

  // Role 4 TIDAK lagi diblokir -- diizinkan download data RS-nya sendiri saja
  if (jenisUserId === 2) {
    // Dinkes Provinsi — provId ambil dari satKerId di token, bukan dari input
    value.provId = req.user.satKerId;
  } else if (jenisUserId === 3) {
    // Dinkes Kab/Kota — hanya kabId, provId tidak relevan
    value.kabId = req.user.satKerId;
    value.provId = undefined;
  }

  try {
    const baseUrl = process.env.API_FASKES;
    const username = process.env.username_API_FASKES;
    const password = process.env.password_API_FASKES;

    // Login dilakukan sekali saja, dipakai bersama oleh semua role
    const loginResponse = await axios.post(
      `${baseUrl}/faskes/login`,
      { userName: username, password: password },
      { headers: { "Content-Type": "application/json" } },
    );

    const token =
      loginResponse.data.access_token || loginResponse.data.data.access_token;

    let rsList = [];

    if (jenisUserId === 4) {
      // ---- RS sendiri: cukup ambil detail 1 RS, tidak perlu daftar banyak RS ----
      const kodeRsSendiri = req.user.satKerId;

      const rsDetailResponse = await axios.get(
        `${baseUrl}/faskes/rumahsakit/${kodeRsSendiri}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const rsDetail = rsDetailResponse.data.data ?? rsDetailResponse.data;

      rsList = [
        {
          kodeRs: kodeRsSendiri,
          namaRs: rsDetail?.nama ?? "",
          provinsiId: rsDetail?.provinsi_id ?? null,
          kabKotaId: rsDetail?.kab_kota_id ?? null,
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

      // Validasi kepemilikan wilayah: RS yang dipilih harus berada
      // di provinsi/kabkota yang memang jadi scope user ini.
      if (
        jenisUserId === 2 &&
        String(rsDetail.provinsi_id) !== String(req.user.satKerId)
      ) {
        return res.status(403).send({
          status: false,
          message: "RS yang dipilih bukan berada di wilayah Anda",
        });
      }
      if (
        jenisUserId === 3 &&
        String(rsDetail.kab_kota_id) !== String(req.user.satKerId)
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
          provinsiId: rsDetail?.provinsi_id ?? null,
          kabKotaId: rsDetail?.kab_kota_id ?? null,
          provinsiNama: rsDetail?.provinsiNama ?? "",
          kabKotaNama: rsDetail?.kabKotaNama ?? "",
        },
      ];
    } else {
      // ---- Role 1/2/3 tanpa rsId: ambil daftar RS per wilayah, seperti sebelumnya ----
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

    const tahunBulan = req.query.periode.replace("-", "_");
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const namaFile = `RL_41_${tahunBulan}_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);

    await tulisExcelRL41({
      res,
      rsList,
      periode: req.query.periode,
      judul: "SIRS ONLINE RL 4.1",
      modelDetail: rlEmpatTitikSatuDetail,
    });
  } catch (err) {
    console.error("downloadDataRLEmpatTitikSatu:", err.message);
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).send({
      status: false,
      message: "Gagal mengunduh data",
    });
  }
};

const BATCH_SIZE = 1000;

import dayjs from "dayjs";

const KELOMPOK_UMUR = [
  { key: "0_1jam", label: "0 - 1 Jam" },
  { key: "1_23jam", label: "1 - 23 Jam" },
  { key: "1_7hr", label: "1 - 7 Hari" },
  { key: "8_28hr", label: "8 - 28 Hari" },
  { key: "29hr_3bln", label: "29 Hari - <3 Bulan" },
  { key: "3_6bln", label: "3 - <6 Bulan" },
  { key: "6_11bln", label: "6 - 11 Bulan" },
  { key: "1_4th", label: "1 - 4 Tahun" },
  { key: "5_9th", label: "5 - 9 Tahun" },
  { key: "10_14th", label: "10 - 14 Tahun" },
  { key: "15_19th", label: "15 - 19 Tahun" },
  { key: "20_24th", label: "20 - 24 Tahun" },
  { key: "25_29th", label: "25 - 29 Tahun" },
  { key: "30_34th", label: "30 - 34 Tahun" },
  { key: "35_39th", label: "35 - 39 Tahun" },
  { key: "40_44th", label: "40 - 44 Tahun" },
  { key: "45_49th", label: "45 - 49 Tahun" },
  { key: "50_54th", label: "50 - 54 Tahun" },
  { key: "55_59th", label: "55 - 59 Tahun" },
  { key: "60_64th", label: "60 - 64 Tahun" },
  { key: "65_69th", label: "65 - 69 Tahun" },
  { key: "70_74th", label: "70 - 74 Tahun" },
  { key: "75_79th", label: "75 - 79 Tahun" },
  { key: "80_84th", label: "80 - 84 Tahun" },
  { key: "lebih85th", label: "≥ 85 Tahun" },
];

const KOLOM_TOTAL = [
  { key: "jmlh_pas_hidup_mati_gen_l", label: "Total Pasien Hidup & Mati (L)" },
  { key: "jmlh_pas_hidup_mati_gen_p", label: "Total Pasien Hidup & Mati (P)" },
  { key: "total_pas_hidup_mati", label: "Total Pasien Hidup & Mati" },
  { key: "jmlh_pas_keluar_mati_gen_l", label: "Total Pasien Keluar Mati (L)" },
  { key: "jmlh_pas_keluar_mati_gen_p", label: "Total Pasien Keluar Mati (P)" },
  { key: "total_pas_keluar_mati", label: "Total Pasien Keluar Mati" },
];

const kolomAngka = [
  ...KELOMPOK_UMUR.flatMap((u) => [
    {
      header: "L",
      group: u.label,
      key: `jmlh_pas_hidup_mati_umur_gen_${u.key}_l`,
      width: 6,
    },
    {
      header: "P",
      group: u.label,
      key: `jmlh_pas_hidup_mati_umur_gen_${u.key}_p`,
      width: 6,
    },
  ]),
  ...KOLOM_TOTAL.map((t) => ({
    header: t.label,
    group: null,
    key: t.key,
    width: 16,
  })),
];

const kolomIdentitas = [
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

const semuaKolom = [...kolomIdentitas, ...kolomAngka];

const NAMA_BULAN = [
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

const BORDER_TIPIS = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const tulisExcelRL41 = async ({
  res,
  rsList,
  periode,
  judul = "SIRS ONLINE RL 4.1",
  modelDetail = rlEmpatTitikSatuDetail,
}) => {
  const kodeRsList = rsList.map((rs) => rs.kodeRs);
  const rsMap = new Map(rsList.map((rs) => [String(rs.kodeRs), rs]));
  const totalKolom = semuaKolom.length;

  const tglPeriode = dayjs(periode);
  const namaBulan = NAMA_BULAN[tglPeriode.month()];
  const tahun = tglPeriode.year();

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });
  const sheet = workbook.addWorksheet("RL 4.1", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 7 }],
  });

  sheet.columns = semuaKolom.map((k) => ({ key: k.key, width: k.width }));

  // ---- Blok judul (baris 1-4) ----
  // const rJudul = sheet.addRow(["SIRS ONLINE RL 4.1"]);
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

  const rTahun = sheet.addRow(["Tahun :", tahun]);
  rTahun.commit();

  sheet.addRow([]).commit(); // baris kosong pemisah (baris 5)

  // ---- Header tabel (baris 6-7) ----
  // ---- Header tabel ----
  // ---- Header tabel: 3 baris (grup besar, kelompok umur, L/P) ----
  const JUMLAH_KOLOM_IDENTITAS = kolomIdentitas.length;
  const JUMLAH_KOLOM_UMUR = kolomAngka.length - KOLOM_TOTAL.length;

  const baris0 = semuaKolom.map((k) => (k.group ? "" : k.header));
  baris0[JUMLAH_KOLOM_IDENTITAS] = "PASIEN KELUAR HIDUP & MATI";

  const baris1 = semuaKolom.map((k) => (k.group ? k.group : ""));
  const baris2 = semuaKolom.map((k) => (k.group ? k.header : ""));

  const r0 = sheet.addRow(baris0);
  const r1 = sheet.addRow(baris1);
  const r2 = sheet.addRow(baris2);

  // Merge judul besar di baris 0, merentang seluruh kolom kelompok umur
  sheet.mergeCells(
    r0.number,
    JUMLAH_KOLOM_IDENTITAS + 1,
    r0.number,
    JUMLAH_KOLOM_IDENTITAS + JUMLAH_KOLOM_UMUR,
  );

  const rowHeaderAwal = r1.number;
  let col = 1;
  while (col <= totalKolom) {
    const k = semuaKolom[col - 1];
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
      cell.border = BORDER_TIPIS;
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
        model: icd,
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
      limit: BATCH_SIZE,
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
      kolomAngka.forEach((k) => {
        baris[k.key] = data[k.key] ?? 0;
      });

      const rowData = sheet.addRow(baris);
      rowData.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = BORDER_TIPIS;
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
