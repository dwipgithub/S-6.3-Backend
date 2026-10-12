// models/RLEmpatTitikSatuSatuSehatModel.js
import { databaseSIRS } from "../config/Database.js";
import { DataTypes } from "sequelize";

export const rlTigaTitikSembilanBelasSatuSehat = databaseSIRS.define(
  "rl_tiga_titik_sembilan_belas_satusehat",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    organization_id: { type: DataTypes.STRING },
    tahun: { type: DataTypes.INTEGER },
    golongan_obat_id: { type: DataTypes.INTEGER },
    golongan_no: { type: DataTypes.STRING },
    golongan_nama: { type: DataTypes.STRING },

    ranap_pasien_keluar: { type: DataTypes.INTEGER, defaultValue: 0 },
    ranap_lama_dirawat: { type: DataTypes.INTEGER, defaultValue: 0 },
    jumlah_pasien_rajal: { type: DataTypes.INTEGER, defaultValue: 0 },
    rajal_lab: { type: DataTypes.INTEGER, defaultValue: 0 },
    rajal_radiologi: { type: DataTypes.INTEGER, defaultValue: 0 },
    rajal_lain_lain: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "rl_tiga_titik_sembilan_belas_satusehat",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "modified_at",
    indexes: [
      { fields: ["organization_id", "tahun"] }, // index untuk query cepat
      { fields: ["organization_id", "tahun", "golongan_obat_id"] },
    ],
  },
);
