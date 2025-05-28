import { DataTypes, QueryTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";
import { apiKeyProduction } from "./ApiKeyProductionModel.js";

export const apiProductionRequest = databaseSIRS.define(
  "api_production_request",
  {
    api_key_development_id: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.ENUM('pending','approved','rejected'),
    },
    link_bukti_development: {
      type: DataTypes.TEXT,
    },
    alasan_penolakan: {
      type: DataTypes.TEXT,
    },
    user_id: {
      type: DataTypes.INTEGER,
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

apiProductionRequest.hasOne(apiKeyProduction, {
  foreignKey: "production_request_id",
});