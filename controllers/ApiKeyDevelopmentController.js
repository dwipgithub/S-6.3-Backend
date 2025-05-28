import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import joiDate from "@joi/date"
import { apiRegistration } from "../models/ApiRegistrationModel.js";
import crypto from 'crypto'
import { apiKeyDevelopment } from "../models/ApiKeyDevelopmentModel.js";
import { sendEmail } from "../middleware/SmtpMail.js";

export const getApiKeyDevelopment = (req, res) => {
  const joi = Joi.extend(joiDate)
  const schema = joi.object({
    rsId: joi.string().required(),
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

  apiKeyDevelopment
    .findAll({
      include: {
        model: apiRegistration,
      },  
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


export const reviewRegistration = async (req, res) => {
  const schema = Joi.object({
    registrationId: Joi.number(),
    rsId: Joi.string().required(),
    statusVerifikasi: Joi.string().valid("terverifikasi").required().messages({
      'any.only': 'Tidak bisa melakukan review karena status verifikasi belum terverifikasi',
    }),
    statusPendaftaran: Joi.string().valid("ditolak", "diterima").required().messages({
      'any.only': 'Tidak bisa melakukan review karena status pendaftaran tidak tepat',
    }),
    catatan: Joi.string().allow('', null),
    // userId: Joi.number().required(),
    namaLengkap: Joi.string().required(),
    emailPendaftaran: Joi.string().email().required(),
  });

  console.log("haiyya ", req.params)

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }

  if (req.user.jenis_user_id !== 99) {
    return res.status(403).send({
      status: false,
      message: "No Permission",
    });
  }

  const transaction = await databaseSIRS.transaction();
  const isApproved = req.body.statusPendaftaran === "diterima";
  const apiKey = crypto.randomUUID();
  const apiSecret = crypto.randomUUID();

  const updateParams = {
    status_pendaftaran: req.body.statusPendaftaran,
    user_id: req.user.id,
    catatan: req.body.catatan,
  };

  const apiKeyParams = {
    registration_id: req.params.registrationId,
    rs_id: req.body.rsId,
    api_key: apiKey,
    api_secret: apiSecret,
  };

  const emailTemplate = isApproved ? "reviewApiRegistApproved" : "reviewApiRegistDecline";

  const emailDetail = {
    email: req.body.emailPendaftaran,
    subject: "Hasil Review Registrasi Api Integrasi Pelaporan SIRS6",
    namaUser: req.body.namaLengkap,
    link: "https://drive.google.com/drive/folders/1OoSzjMccjmJvkmdSPy_qBEjsbdMIFrwH",
    template: emailTemplate,
    api_key: apiKey,
    api_secret: apiSecret,
    catatan: req.body.catatan,
  };

  try {
    const [updateCount] = await apiRegistration.update(updateParams, {
      where: { id: req.params.registrationId },
      transaction,
    });

    if (!updateCount) {
      throw new Error("Update status pendaftaran gagal.");
    }

    if (isApproved) {
      await apiKeyDevelopment.create(apiKeyParams, { transaction });
    }

    await sendEmail(emailDetail);
    await transaction.commit();

    return res.status(200).send({
      status: true,
      message: "Berhasil melakukan review, dan email feedback review telah terkirim.",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Review gagal:", error);

    return res.status(422).send({
      status: false,
      message: "Review gagal. Silakan coba lagi atau hubungi admin.",
    });
  }
};


// export const reviewRegistration = async (req, res) => {
//   const schema = Joi.object({
//     registrationId: Joi.number().required(),
//     rsId: Joi.string().required(),
//     statusVerifikasi: Joi.string().valid("terverifikasi")
//     .required()
//     .messages({
//       'any.only': 'tidak bisa melakukan review karena status verifikasi belum terverifikasi',
//     }),
//     statusPendaftaran: Joi.string().valid("ditolak", "diterima")
//     .required()
//     .messages({
//       'any.only': 'tidak bisa melakukan review karena status pendaftaran tidak tepat',
//     }),
//     catatan: Joi.string(),
//     userId: Joi.number().required(),
//     namaLengkap: Joi.string().required(),
//     emailPendaftaran: Joi.string().required(),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     res.status(404).send({
//       status: false,
//       message: error.details[0].message,
//     });
//     return;
//   }

//   if (req.user.jenisUserId != 99) {
//       res.status(404).send({
//         status: false,
//         message: "No Permission",
//       });
//       return;
//   } 

//   let updateRegistrationParam = {
//     status_pendaftaran : req.body.statusPendaftaran,
//     user_id : req.user.id
//   }
  
//   const apiKey=crypto.randomUUID()
//   const apiSecret=crypto.randomUUID()
//   let insertApiKeyDevelopmentParam = {
//     registration_id:req.body.registrationId,
//     rs_id:req.body.rsId,
//     api_key:apiKey,
//     api_secret:apiSecret,
//   }

//   let emailTemplate = "reviewApiRegistApproved"
//   if(req.body.statusPendaftaran!="diterima"){
//     emailTemplate = "reviewApiRegistDecline"
//   }

//   let emailDetail=  {
//     email: req.body.emailPendaftaran,
//     subject: "Hasil Review Registrasi Api Integrasi Pelaporan SIRS6",
//     namaUser: req.body.namaLengkap,
//     link: "https://drive.google.com/drive/folders/1OoSzjMccjmJvkmdSPy_qBEjsbdMIFrwH",
//     template: emailTemplate,
//     api_key:apiKey,
//     api_secret:apiSecret,
//     catatan:req.body.catatan,
//   }

//   const transaction = await databaseSIRS.transaction();

//    try {
//     if(req.body.statusPendaftaran=="diterima"){
//       const [updateRegistration] = await apiRegistration.update
//       (
//         updateRegistrationParam,
//         {
//           where: { id: req.body.registrationId },
//           transaction
//         }
//       );
//       const [insertApiKeyDevelopment] = await apiKeyDevelopment.create
//       (
//         insertApiKeyDevelopmentParam,
//         {
//           transaction
//         }
//       );

//       if (!updateRegistration || !insertApiKeyDevelopment) {
//         throw new Error("Review gagal");
//       }
    
//       const sendEmailResult = await sendEmail(emailDetail);
//       console.log('Email sent successfully:', sendEmailResult);
    
//       await transaction.commit();
    
//       return res.status(successStatus).send({
//         status: true,
//         message: "Berhasil Melakukan Review, dan Email Feedback Review Telah Terkirim",
//       });
//     }else{
//       const [updateRegistration] = await apiRegistration.update
//       (
//         updateRegistrationParam,
//         {
//           where: { id: req.body.registrationId },
//           transaction
//         }
//       );

//       if (!updateRegistration) {
//         throw new Error("Review gagal");
//       }
    
//       const sendEmailResult = await sendEmail(emailDetail);
//       console.log('Email sent successfully:', sendEmailResult);
    
//       await transaction.commit();
    
//       return res.status(successStatus).send({
//         status: true,
//         message: "Berhasil Melakukan Review, dan Email Feedback Review Telah Terkirim",
//       });
//     }
     
    

//    } catch (error) {
//     await transaction.rollback();
//     console.error('Review gagal:', error);
  
//     return res.status(422).send({
//       status: false,
//       message: "Review gagal. Silakan coba lagi atau hubungi admin.",
//     });
//    }
// };