import { databaseSIRS } from "../config/Database.js";
import { DataTypes } from "sequelize";

export const rlTigaTitikDelapanSatuSehat = databaseSIRS.define(
  "rl_tiga_titik_delapan_satusehat",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organization_id: { type: DataTypes.STRING(50) },
    bulan: { type: DataTypes.INTEGER },
    tahun: { type: DataTypes.INTEGER },
    nama_group_id: { type: DataTypes.INTEGER },
    nama_group: { type: DataTypes.STRING(255) },
    pemeriksaan_id: { type: DataTypes.INTEGER },
    pemeriksaan: { type: DataTypes.STRING(255) },
    jumlah_laki_laki: { type: DataTypes.INTEGER, defaultValue: 0 },
    jumlah_perempuan: { type: DataTypes.INTEGER, defaultValue: 0 },
    rata_rata_laki_laki: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    rata_rata_perempuan: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  },
  {
    tableName: "rl_tiga_titik_delapan_satusehat",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["id", "organization_id"] },
    ],
  }
);