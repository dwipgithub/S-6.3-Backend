import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import joiDate from "@joi/date"
import { apiRegistration } from "../models/ApiRegistrationModel.js";
import { insert } from "../models/ApiRegistrationModel.js";
import crypto from 'crypto'
import { emailVerificationToken } from "../models/EmailVerificationTokenModel.js";
import { apiKeyDevelopment } from "../models/ApiKeyDevelopmentModel.js";
import { apiProductionRequest } from "../models/ApiProductionRequestModel.js";
import { apiKeyProduction } from "../models/ApiKeyProductionModel.js";

export const getApiRegistrations = (req, res) => {
  const joi = Joi.extend(joiDate)
  const schema = joi.object({
    rsId: joi.string(),
    page: joi.number(),
    limit: joi.number()
  })
  const { error, value } = schema.validate(req.query);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }


  let whereClause = {}
  if (req.user.jenisUserId == 4) {
    if (req.query.rsId != req.user.satKerId) {
      res.status(404).send({
        status: false,
        message: "Kode RS Tidak Sesuai",
      });
      return;
    }
    whereClause = {
      rs_id: req.user.satKerId,
    }
  } 

  apiRegistration
    .findAll({
      include:
      [
        {
          model: emailVerificationToken,
        //   attributes: ["icd_code", "description_code", "icd_code_group", "description_code_group"],
        },  
        {
          model: apiKeyDevelopment,
          //   attributes: ["icd_code", "description_code", "icd_code_group", "description_code_group"],
          include: [ // Nested includes for associations of AssociatedModelOne
            {
              model: apiProductionRequest,
              // as: 'nestedAlias'
              include :[
                {model:apiKeyProduction}
              ]
            }
          ],
        }, 
      ] ,
      where: whereClause,
    })
    .then((results) => {
      res.status(200).send({
        status: true,
        message: "data found",
        data: results,
      });
    })
    .catch((err) => {
      res.status(422).send({
        status: false,
        message: err,
      });
      return;
    });
};

export const insertApiRegistration = async (req, res) => {
  const schema = Joi.object({
    namaLengkap: Joi.string().required(),
    emailPendaftaran: Joi.string().email().required(),
    namaAplikasi: Joi.string().required(),
    tujuanPenggunaan: Joi.string().required(),
    linkPermohonan: Joi.string().uri().required(),
    noTelp: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required().messages({
      'string.empty': 'Nomor handphone wajib diisi.',
      'string.pattern.base': 'Format nomor handphone tidak valid. Contoh: 081234567890 atau +6281234567890'
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }

  const genToken = crypto.randomUUID();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  const registrationParam = {
    registration: {
      rs_id: req.user.satKerId,
      nama_lengkap: req.body.namaLengkap,
      email_pendaftaran: req.body.emailPendaftaran,
      nama_aplikasi: req.body.namaAplikasi,
      tujuan_penggunaan: req.body.tujuanPenggunaan,
      link_permohonan: req.body.linkPermohonan,
      no_telp: req.body.noTelp,
    },
    emailVerifToken: {
      token: genToken,
      expired_at: expires,
    },
    emailDetail: {
      email: req.body.emailPendaftaran,
      subject: "Email Verifikasi Pendaftaran Bridging SIRS 6 2025",
      namaUser: req.body.namaLengkap,
      link: "https://sirs6.kemkes.go.id/v3/verifikasi/?token=" + genToken,
      template: "registrationBridgingSirs",
    }
  };

  try {
    const existingUser = await users_sso.findOne({
      where: { email: registrationParam.registration.email_pendaftaran },
    });

    if (existingUser) {
      return res.status(422).send({
        status: false,
        message: "Email sudah pernah didaftarkan di sistem.",
      });
    }

    insert(registrationParam, (err, results) => {
      if (err) {
        if (err === "send email error") {
          console.error('Email error:', err);
          return res.status(422).send({
            status: false,
            message: "Registrasi gagal, email verifikasi tidak terkirim. Mohon hubungi admin.",
          });
        }

        if (err.name === "SequelizeUniqueConstraintError") {
          return res.status(422).send({
            status: false,
            message: "Email sudah terdaftar.",
          });
        }

        console.error('Registrasi error:', err);
        return res.status(422).send({
          status: false,
          message: "Registrasi gagal.",
        });
      }

      res.status(201).json({
        status: true,
        message: 'Registrasi berhasil, email verifikasi terkirim.',
      });
    });

  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).send({
      status: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};


export const userVerifApiRegistration = async (req, res) => {

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
  }

  const transaction = await databaseSIRS.transaction();

  try {
    const findToken = await emailVerificationToken.findOne({
      include: {
        model: apiRegistration,
        where: {
          rs_id: req.user.satKerId,
          status_verifikasi: "tunda"
        }
      },
      where: {
        token: req.params.token,
        used: "0"
      },
      transaction
    });

    if (!findToken) {
      await transaction.rollback();
      return res.status(404).send({ status: false, message: "Token tidak ditemukan" });
    }

    const dateTimeNow = new Date();
    let newStatus = findToken.expired_at < dateTimeNow ? "kadaluarsa" : "terverifikasi";

    const [updateEmailVerifCount] = await emailVerificationToken.update(
      { used: "1" },
      {
        where: { id: findToken.id },
        transaction
      }
    );

    const [updateApiRegisCount] = await apiRegistration.update(
      { status_verifikasi: newStatus },
      {
        where: { id: findToken.registration_id },
        transaction
      }
    );

    if (updateEmailVerifCount && updateApiRegisCount) {
      await transaction.commit();

      const successMessage = newStatus === "kadaluarsa"
        ? "Verifikasi Gagal, Email Verifikasi Kadaluarsa"
        : "Email berhasil diverifikasi. Mohon Tunggu Review Admin";

      const successStatus = newStatus === "kadaluarsa" ? 400 : 201;

      return res.status(successStatus).send({
        status: true,
        message: successMessage,
      });
    } else {
      throw new Error("Update gagal");
    }
  } catch (error) {
    await transaction.rollback();
    console.error('Error occurred:', error);
    return res.status(422).send({
      status: false,
      message: "Verifikasi Gagal, Silakan Hubungi Admin",
    });
  }
};


// export const insertApiRegistration = async (req, res) => {

//   const schema = Joi.object({
//     namaLengkap: Joi.string().required(),
//     emailPendaftaran: Joi.string().required(),
//     namaAplikasi: Joi.string().required(),
//     tujuanPenggunaan: Joi.string().required(),
//     linkPermohonan: Joi.string().required(),
//     noTelp: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required().messages({
//       'string.empty': 'Nomor handphone wajib diisi.',
//       'string.pattern.base': 'Format nomor handphone tidak valid. Contoh: 081234567890 atau +6281234567890'
//     }),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     res.status(404).send({
//       status: false,
//       message: error.details[0].message,
//     });
//     return;
//   }
//   // console.log("hei ",req.user)
//   const genToken = crypto.randomUUID()
//   const expires = new Date();
//   expires.setHours(expires.getHours() + 1);
//   let registrationParam = {
//     registration: {
//       rs_id: req.user.satKerId,
//       nama_lengkap: req.body.namaLengkap,
//       email_pendaftaran: req.body.emailPendaftaran,
//       nama_aplikasi: req.body.namaAplikasi,
//       tujuan_penggunaan: req.body.tujuanPenggunaan,
//       link_permohonan: req.body.linkPermohonan,
//       no_telp: req.body.noTelp,
//     },
//     emailVerifToken: {
//       token: genToken,
//       expired_at: expires
//     },
//     emailDetail: {
//       email: req.body.emailPendaftaran,
//       subject: "Email Verifikasi Pendaftaran Bridging SIRS 6 2025",
//       namaUser: req.body.namaLengkap,
//       link: "https://sirs6.kemkes.go.id/v3/verifikasi/?token=" + genToken,
//       template: "registrationBridgingSirs"
//     }
//   }

//   insert(registrationParam, (err, results) => {

//     if (err) {
//       if (err == "send email error") {
//         console.error('Error occurred:', err);
//         res.status(422).send({
//           status: false,
//           message: "Registrasi Gagal, Email Verifikasi Tidak Terkirim, Mohon Hubungi Admin"
//         })
//       } else if (err.name == "SequelizeUniqueConstraintError") {
//         console.error('Error occurred:', err);
//         res.status(422).send({
//           status: false,
//           message: "Registrasi , Email Sudah Pernah di Daftarkan"
//         })
//       } else {
//         console.error('Error occurred:', err);
//         res.status(422).send({
//           status: false,
//           message: "Registrasi Gagal"
//         })
//       }
//       return
//     }
//     res.status(201).json({
//       status: true,
//       message: 'registrasi berhasil, email verifikasi terkirim',
//     })
//   })
// };
// export const userVerifApiRegistration = async (req, res) => {

//   const schema = Joi.object({
//     rsId: Joi.string().required(),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     res.status(404).send({
//       status: false,
//       message: error.details[0].message,
//     });
//     return;
//   }
//   const transaction = await databaseSIRS.transaction();
//   try {
//     const findToken = await emailVerificationToken
//       .findOne({
//         include: {
//           model: apiRegistration,
//           where: {
//             rs_id: req.body.rsId,
//             status_verifikasi: "tunda"
//           }
//         },
//         where: {
//           token: req.params.token,
//           used: "0"
//         }, transaction: transaction,
//       })

//     if (!findToken) {
//       await transaction.rollback();
//       return res.status(404).send({ status: false, message: "Token tidak ditemukan" });
//     }
//     let updateApiRegistration = {
//       status_verifikasi: 'kadaluarsa'
//     }
//     let updateEmailVerif = {
//       used: "1"
//     }
//     const dateTimeNow = new Date();
//     if (findToken.expired_at < dateTimeNow) {
//       const updateEmailVerifResult = await emailVerificationToken.update(
//         updateEmailVerif, {
//         where: {
//           id: findToken.id,
//         }, transaction
//       });

//       const updateApiRegisResult = await apiRegistration.update(
//         updateApiRegistration, {
//         where: {
//           id: findToken.registration_id,
//         }, transaction
//       });
//       if (updateEmailVerifResult[0] != 0 && updateApiRegisResult[0] != 0) {
//         await transaction.commit();
//         res.status(400).send({
//           status: true,
//           message: "Verifikasi Gagal, Email Verifikasi Kadaluarsa",
//         });
//         return
//       } else {
//         await transaction.rollback();
//         res.status(400).send({
//           status: false,
//           message: "Verifikasi Gagal",
//         });
//         return
//       }
//     }
//     updateApiRegistration.status_verifikasi = "terverifikasi"

//     const updateEmailVerifResult = await emailVerificationToken.update(
//       updateEmailVerif, {
//       where: {
//         id: findToken.id,
//       }, transaction
//     });

//     const updateApiRegisResult = await apiRegistration.update(
//       updateApiRegistration, {
//       where: {
//         id: findToken.registration_id,
//       }, transaction
//     });
//     if (updateEmailVerifResult[0] != 0 && updateApiRegisResult[0] != 0) {
//       await transaction.commit();
//       res.status(201).send({
//         status: true,
//         message: "Email berhasil diverifikasi. Mohon Tunggu Review Admin",
//       });
//       return
//     } else {
//       await transaction.rollback();
//       res.status(400).send({
//         status: false,
//         message: "Verifikasi Gagal",
//       });
//       return
//     }
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error occurred:', error);
//     res.status(422).send({
//       status: false,
//       message: "Verifikasi Gagal, Silakan Hubungi Admin",
//     });
//     return;
//   }
// };


// export const reviewApiRegistration = async (req, res) => {

//   const schema = Joi.object({
//     // status_verifikasi: Joi.string(),
//     // status_pendaftaran: Joi.string(),
//     rsId: Joi.string().required(),
//     namaLengkap: Joi.string().required(),
//     emailPendaftaran: Joi.string().required(),
//     statusVerifikasi: Joi.string(),
//     statusPendaftaran: Joi.string(),
//     catatan: Joi.string(),
//     userId: Joi.string().required(),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     res.status(404).send({
//       status: false,
//       message: error.details[0].message,
//     });
//     return;
//   }

//   emailVerificationToken
//   .findOne({
//         include: {
//               model: apiRegistration,
//               // attributes: ["icd_code", "description_code", "icd_code_group", "description_code_group"],
//               where :{
//                 rs_id : req.body.rsId,
//               }
//             },  
//         where: {
//           token: req.params.token,
//         },
//       })
//       .then((results) => {
//         const dateTimeNow = new Date();
//         if(results.expired_at < dateTimeNow){
//           res.status(422).send({
//             status: false,
//             message: "Verifikasi Gagal, Token Sudah Expired",
//           });
//           return;
//         }
//         res.status(200).send({
//           status: true,
//           message: "data found",
//           data: [results],
//         });
//       })
//       .catch((err) => {
//         res.status(422).send({
//           status: false,
//           message: err,
//         });
//         return;
//       });

//   // console.log("hei ",req.user)
//   // const key = crypto.randomUUID()
//   // const secret = crypto.randomUUID()
//   // const expires = new Date();
//   // // expires.setHours(expires.getHours() + 1);
//   // let reviewParam = {
//   //   review: {
//   //     rs_id :req.body.rsId,
//   //     nama_lengkap: req.body.namaLengkap,
//   //     email_pendaftaran: req.body.emailPendaftaran,
//   //     status_verifikasi: req.body.statusVerifikasi,
//   //     status_pendaftaran: req.body.statusPendaftaran,
//   //     catatan: req.body.catatan,
//   //     user_id: req.body.userId,
//   //     apiKey: key,
//   //     apiSecret: secret,
//   //     token: req.params.token
//   //   },
//   //   emailDetail: {
//   //     email: req.body.emailPendaftaran,
//   //     subject: "Email Verifikasi Pendaftaran Bridging SIRS 6 2025",
//   //     emailMessages: "",
//   //     namaUser: req.body.namaLengkap,
//   //     link: "https://sirs6.kemkes.go.id/v3/verifikasi/?token=" + genToken,
//   //     template: "registrationBridgingSirsApproved",
//   //     apiKey: key,
//   //     apiSecret: secret
//   //   }
//   // }

//   // review(reviewParam, (err, results) => {

//   //   if (err) {
//   //     if (err == "send email error") {
//   //       console.error('Error occurred:', err);
//   //       res.status(422).send({
//   //         status: false,
//   //         message: "Update Status Gagal, Email Tidak Terkirim, Mohon Hubungi Admin"
//   //       })
//   //     } else {
//   //       console.error('Error occurred:', err);
//   //       res.status(422).send({
//   //         status: false,
//   //         message: "Update Status Gagal"
//   //       })
//   //     }
//   //     return
//   //   }
//   //   res.status(201).json({
//   //     status: true,
//   //     message: 'Update Status berhasil, email user development terkirim',
//   //   })
//   // })
// };

// export const insertApiRegistration = async (req, res) => {
//   const schema = Joi.object({
//     namaLengkap: Joi.string().required(),
//     emailPendaftaran: Joi.string().required(),
//     namaAplikasi: Joi.string().required(),
//     tujuanPenggunaan: Joi.string().required(),
//     linkPermohonan: Joi.string().required(),
//     noTelp: Joi.string().required(),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     res.status(404).send({
//       status: false,
//       message: error.details[0].message,
//     });
//     return;
//   }

//   let transaction;
//   try {
//     transaction = await databaseSIRS.transaction();
//     await apiRegistration.create(
//       {
//         rs_id: req.user.satKerId,
//         nama_lengkap: req.body.namaLengkap,
//         email_pendaftaran: req.body.emailPendaftaran,
//         nama_aplikasi: req.body.namaAplikasi,
//         tujuan_penggunaan: req.body.tujuanPenggunaan,
//         link_permohonan: req.body.linkPermohonan,
//         no_telp: req.body.noTelp,
//       },
//       { transaction }
//     );
//   } catch (error) {
//     if (transaction) {
//         res.status(400).send({
//           status: false,
//           message: "Gagal Input Data.",
//         });
//       }
//       await transaction.rollback();
//     }
// };

// export const reviewApiRegistration = async (req, res) => {
//   const schema = Joi.object({
//     status_pendaftaran: Joi.string(),
//     catatan: Joi.string(),
//     user_id: Joi.string(),
//   });
//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     res.status(404).send({
//       status: false,
//       message: error.details[0].message,
//     });
//     return;
//   }
//   let transaction;
//   try {
//     transaction = await databaseSIRS.transaction();
//     const update = await apiRegistration.update(req.body, {
//       where: {
//         id: req.params.id,
//       },
//     });
//     if (update[0] != 0) {
//       await transaction.commit();
//       res.status(201).send({
//         status: true,
//         message: "Data diubah",
//       });
//     } else {
//       await transaction.rollback();
//       res.status(400).send({
//         status: false,
//         message: "Data Tidak Berhasil di Ubah",
//       });
//     }
//   } catch (error) {
//     await transaction.rollback();
//     res.status(400).send({
//       status: false,
//       message: error,
//     });
//   }
// };

