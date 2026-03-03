import { DataTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";
import { statusValidasi } from "./RLTigaTitikSembilanBelasValidasiModel.js";

export const rlLimaTitikTigaValidasi = databaseSIRS.define(
  "rl_lima_titik_tiga_validasi",
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

rlLimaTitikTigaValidasi.belongsTo(statusValidasi, {
  foreignKey: "status_validasi_id",
  as: "statusValidasi",
});
