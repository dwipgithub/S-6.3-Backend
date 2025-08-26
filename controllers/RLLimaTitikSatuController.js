import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import { IcdRLLimaTitikSatu } from "../models/IcdRLLimaTitikSatuModel.js";
import joiDate from "@joi/date";
import {
  rlLimaTitikSatuDetail,
  rlLimaTitikSatuHeader,
} from "../models/RLLimaTitikSatuModel.js";

export const getDataRLLimaTitikSatu = (req, res) => {
  const joi = Joi.extend(joiDate);
  const schema = joi.object({
    rsId: joi.string().required(),
    periode: joi.date().format("YYYY-M").required(),
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
    })
    .then((results) => {
      const jsonString = JSON.stringify(results);
      res.status(200).send({
        status: true,
        message: "data found",
        ukuran: Buffer.byteLength(jsonString, "utf8"),
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
          .required()
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
      { transaction }
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
              }
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
