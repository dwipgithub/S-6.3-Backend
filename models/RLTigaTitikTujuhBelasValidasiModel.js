import { DataTypes, QueryTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";

export const rlTigaTitikTujuhBelasValidasi = databaseSIRS.define(
  "rl_tiga_titik_tujuh_belas_validasi",
  {
    rs_id: {
      type: DataTypes.STRING,
    },
    jenis_periode: {
      type: DataTypes.INTEGER,
    },
    periode: {
      type: DataTypes.DATEONLY,
    },
    status_validasi_id: {
      type: DataTypes.INTEGER,
    },
    catatan: {
      type: DataTypes.TEXT,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "modified_at",
  },
);

export const statusValidasi = databaseSIRS.define(
  "status_validasi",
  {
    nama: {
      type: DataTypes.STRING,
    },
    pengguna: {
      type: DataTypes.INTEGER,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);

rlTigaTitikTujuhBelasValidasi.belongsTo(statusValidasi, {
  foreignKey: "status_validasi_id",
  as: "statusValidasi",
});
