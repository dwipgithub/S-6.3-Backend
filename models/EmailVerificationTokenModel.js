import { DataTypes, QueryTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";
import { apiRegistration } from "./ApiRegistrationModel.js";

export const emailVerificationToken = databaseSIRS.define(
  "email_verification_token",
  {
    registration_id: {
      type: DataTypes.INTEGER,
    },
    token: {
      type: DataTypes.STRING,
    },
    expired_at: {
      type: DataTypes.DATE,
    },
    used: {
      type: DataTypes.ENUM('0','1'),
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


// emailVerificationToken.belongsTo(apiRegistration, {
//   foreignKey: "registration_id",
// });