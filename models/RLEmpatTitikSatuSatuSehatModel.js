// models/RLEmpatTitikSatuSatuSehatModel.js
import { databaseSIRS } from "../config/Database.js";
import { DataTypes } from "sequelize";

export const rlEmpatTitikSatuSatuSehat = databaseSIRS.define(
  "rl_empat_titik_satu_satusehat",
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    organization_id: { type: DataTypes.STRING },
    bulan_laporan: { type: DataTypes.STRING },
    kode_icd: { type: DataTypes.STRING },
    diagnosis: { type: DataTypes.STRING },

    keluar_hidup_mati_l: { type: DataTypes.INTEGER, defaultValue: 0 },
    keluar_hidup_mati_p: { type: DataTypes.INTEGER, defaultValue: 0 },
    keluar_hidup_mati_total: { type: DataTypes.INTEGER, defaultValue: 0 },
    keluar_mati_l: { type: DataTypes.INTEGER, defaultValue: 0 },
    keluar_mati_p: { type: DataTypes.INTEGER, defaultValue: 0 },
    keluar_mati_total: { type: DataTypes.INTEGER, defaultValue: 0 },

    jmlh_pas_hidup_mati_umur_gen_0_1jam_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_0_1jam_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_1_23jam_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_1_23jam_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_1_7hr_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_1_7hr_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_8_28hr_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_8_28hr_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_3_6bln_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_3_6bln_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_6_11bln_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_6_11bln_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_1_4th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_1_4th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_5_9th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_5_9th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_10_14th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_10_14th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_15_19th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_15_19th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_20_24th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_20_24th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_25_29th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_25_29th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_30_34th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_30_34th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_35_39th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_35_39th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_40_44th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_40_44th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_45_49th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_45_49th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_50_54th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_50_54th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_55_59th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_55_59th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_60_64th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_60_64th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_65_69th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_65_69th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_70_74th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_70_74th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_75_79th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_75_79th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_80_84th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_80_84th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_lebih85th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_hidup_mati_umur_gen_lebih85th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    jmlh_pas_mati_umur_gen_0_1jam_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_0_1jam_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_1_23jam_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_1_23jam_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_1_7hr_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_1_7hr_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_8_28hr_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_8_28hr_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_29hr_3bln_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_29hr_3bln_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_3_6bln_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_3_6bln_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_6_11bln_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_6_11bln_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_1_4th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_1_4th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_5_9th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_5_9th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_10_14th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_10_14th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_15_19th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_15_19th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_20_24th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_20_24th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_25_29th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_25_29th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_30_34th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_30_34th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_35_39th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_35_39th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_40_44th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_40_44th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_45_49th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_45_49th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_50_54th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_50_54th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_55_59th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_55_59th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_60_64th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_60_64th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_65_69th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_65_69th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_70_74th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_70_74th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_75_79th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_75_79th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_80_84th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_80_84th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_lebih85th_l: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jmlh_pas_mati_umur_gen_lebih85th_p: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "rl_empat_titik_satu_satusehat",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["organization_id", "bulan_laporan"] }, // index untuk query cepat
      { fields: ["organization_id", "bulan_laporan", "kode_icd"] },
    ],
  },
);
