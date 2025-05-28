import { DataTypes, QueryTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";

export const apiKeyProduction = databaseSIRS.define(
  "api_key_production",
  {
    production_request_id: {
      type: DataTypes.INTEGER,
    },
    rs_id: {
      type: DataTypes.STRING,
    },
    api_key: {
      type: DataTypes.STRING,
    },
    api_secret: {
      type: DataTypes.STRING,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    modified_at: {
      type: DataTypes.DATE,
    },
  },
  {
    freezeTableName: true,
  }
);
