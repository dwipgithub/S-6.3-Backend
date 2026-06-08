// models/SyncLogModel.js
import { databaseSIRS } from "../config/Database.js";
import { DataTypes } from "sequelize";

export const syncLog = databaseSIRS.define(
  "rl_sync_log",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rs_id: { type: DataTypes.STRING, allowNull: false },
    tipe_rl: { type: DataTypes.STRING, allowNull: false },
    periode: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM("syncing", "success", "failed") },
    total_data: { type: DataTypes.INTEGER, defaultValue: 0 },
    error_msg: { type: DataTypes.TEXT, allowNull: true },
    synced_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "rl_sync_log",
    timestamps: true,
    indexes: [
      { fields: ["rs_id", "tipe_rl", "periode"] }, // index untuk query cepat
    ],
  },
);
