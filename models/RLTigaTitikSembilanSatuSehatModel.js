import { databaseSIRS } from "../config/Database.js";
import { DataTypes } from "sequelize";

export const rlTigaTitikSembilanSatuSehat = databaseSIRS.define(
  "rl_tiga_titik_sembilan_satusehat",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // PERBAIKAN
    organization_id: { type: DataTypes.STRING },
    bulan: { type: DataTypes.INTEGER },
    tahun: { type: DataTypes.INTEGER },
    jenis_kegiatan: { type: DataTypes.STRING },
    jumlah: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "rl_tiga_titik_sembilan_satusehat",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["id", "organization_id"] },
    ],
  },
);
