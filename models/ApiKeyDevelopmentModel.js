import { DataTypes, QueryTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";
import { apiRegistration } from "./ApiRegistrationModel.js";
import { apiProductionRequest } from "./ApiProductionRequestModel.js";


export const apiKeyDevelopment = databaseSIRS.define(
  "api_key_development",
  {
    registration_id: {
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

apiKeyDevelopment.hasOne(apiProductionRequest, {
  foreignKey: "api_key_development_id",
});

// apiKeyDevelopment.belongsTo(apiRegistration, {
//   foreignKey: "registration_id",
// });

// export const show = (req, callback) => {
//   const sql =
//     "SELECT users.id, " +
//     "users.nama, " +
//     "users.email, " +
//     "users.satker_id as satKerId, " +
//     "users.jenis_user_id as jenisUserId, " +
//     "users.kriteria_user_id as kriteriaUserId " +
//     "FROM " +
//     "users " +
//     "WHERE users.id = ?";

//   const sqlFilterValue = [req.params.id];
//   databaseSIRS
//     .query(sql, {
//       type: QueryTypes.SELECT,
//       replacements: sqlFilterValue,
//     })
//     .then((res) => {
//       callback(null, res);
//     })
//     .catch((error) => {
//       callback(error, null);
//     });
// };

// export const insert = (data, callback) => {
//   const sqlInsert =
//     "INSERT INTO users (nama,email,password,satker_id,jenis_user_id,kriteria_user_id) VALUES ( ? )";
//   databaseSIRS
//     .query(sqlInsert, {
//       type: QueryTypes.INSERT,
//       replacements: [data],
//     })
//     .then((res) => {
//       callback(null, res);
//     })
//     .catch((error) => {
//       callback(error, null);
//     });
// };
