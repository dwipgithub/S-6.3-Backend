import { DataTypes, QueryTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";
import { sendEmail } from "../middleware/SmtpMail.js";
import { apiKeyDevelopment } from "./ApiKeyDevelopmentModel.js";
import { emailVerificationToken } from "./EmailVerificationTokenModel.js";

export const apiRegistration = databaseSIRS.define(
  "api_registration",
  {
    rs_id: {
      type: DataTypes.STRING,
    },
    nama_lengkap: {
      type: DataTypes.STRING,
    },
    email_pendaftaran: {
      type: DataTypes.STRING,
    },
    nama_aplikasi: {
      type: DataTypes.STRING,
    },
    tujuan_penggunaan: {
      type: DataTypes.TEXT,
    },
    link_permohonan: {
      type: DataTypes.TEXT,
    },
    no_telp: {
      type: DataTypes.STRING,
    },
    status_verifikasi: {
      type: DataTypes.ENUM('pending','verified','expired'),
    },
    status_pendaftaran: {
      type: DataTypes.ENUM('pending','approved','rejected'),
    },
    catatan: {
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

apiRegistration.hasOne(apiKeyDevelopment, {
  foreignKey: "registration_id",
});

apiRegistration.hasMany(emailVerificationToken, {
  foreignKey: "registration_id",
});



export const insert= async(data, callback) => {


  const columnsRegistration = Object.keys(data.registration);                   
  const placeholdersRegistration = columnsRegistration.map(() => '?').join(', ');     
  const valuesRegistration = Object.values(data.registration); 
  
  const columnsEmailVerifToken = ['registration_id', ...Object.keys(data.emailVerifToken)];
  const placeholdersEmailVerifToken = columnsEmailVerifToken.map(() => '?').join(', ');
  let valuesEmailVerifToken = Object.values(data.emailVerifToken);    
  const transaction = await databaseSIRS.transaction()

  // console.log("anbjat ",data)

  try{

      const sqlInsertUser = `INSERT INTO api_registration (${columnsRegistration.join(', ')}) VALUES (${placeholdersRegistration})`
      
      const insertDataRegistration = await databaseSIRS.query(sqlInsertUser, {
          type: QueryTypes.INSERT,
          replacements: valuesRegistration,
          transaction: transaction
      })

      valuesEmailVerifToken = [insertDataRegistration[0], ...valuesEmailVerifToken]

          const sqlInsertEmailVerifToken = `INSERT INTO email_verification_token (${columnsEmailVerifToken.join(', ')}) VALUES (${placeholdersEmailVerifToken})`

          const insertEmailVerifToken = await databaseSIRS.query(sqlInsertEmailVerifToken, {
              type: QueryTypes.INSERT,
              replacements:valuesEmailVerifToken,
              transaction: transaction
          })
      // const sendEmailResult = await sendEmail(data.emailDetail)
      // console.log('Email sent successfully:', sendEmailResult)

      await transaction.commit()
      console.log('Transaction committed successfully.');
      callback(null, insertDataRegistration[0])
  } catch (error) {
      // console.log("apa ",error)
      await transaction.rollback()
      callback(error, null)
  }
}

export const review= async(data, callback) => {


  const columnsRegistration = Object.keys(data.registration);                   
  const placeholdersRegistration = columnsRegistration.map(() => '?').join(', ');     
  const valuesRegistration = Object.values(data.registration); 
  
  const columnsEmailVerifToken = ['registration_id', ...Object.keys(data.emailVerifToken)];
  const placeholdersEmailVerifToken = columnsEmailVerifToken.map(() => '?').join(', ');
  let valuesEmailVerifToken = Object.values(data.emailVerifToken);    
  const transaction = await databaseSIRS.transaction()

  // console.log("anbjat ",data)

  try{

      const sqlInsertUser = `INSERT INTO api_registration (${columnsRegistration.join(', ')}) VALUES (${placeholdersRegistration})`
      
      const insertDataRegistration = await databaseSIRS.query(sqlInsertUser, {
          type: QueryTypes.INSERT,
          replacements: valuesRegistration,
          transaction: transaction
      })

      valuesEmailVerifToken = [insertDataRegistration[0], ...valuesEmailVerifToken]

          const sqlInsertEmailVerifToken = `INSERT INTO email_verification_token (${columnsEmailVerifToken.join(', ')}) VALUES (${placeholdersEmailVerifToken})`

          const insertEmailVerifToken = await databaseSIRS.query(sqlInsertEmailVerifToken, {
              type: QueryTypes.INSERT,
              replacements:valuesEmailVerifToken,
              transaction: transaction
          })
      const sendEmailResult = await sendEmail(data.emailDetail)
      console.log('Email sent successfully:', sendEmailResult)

      await transaction.commit()
      console.log('Transaction committed successfully.');
      callback(null, insertDataRegistration[0])
  } catch (error) {
      // console.log("apa ",error)
      await transaction.rollback()
      callback(error, null)
  }
}