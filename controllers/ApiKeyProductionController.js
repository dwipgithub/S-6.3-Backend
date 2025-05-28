import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import crypto from 'crypto'
import { sendEmail } from "../middleware/SmtpMail.js";
import { apiProductionRequest } from "../models/ApiProductionRequestModel.js";
import { apiKeyProduction } from "../models/ApiKeyProductionModel.js";
import { users_sso } from "../models/UserModel.js";


export const reviewProductionRequest = async (req, res) => {
  const schema = Joi.object({
    // productionRequestId: Joi.number().required(),
    rsId: Joi.string().required(),
    status: Joi.string().valid("ditolak", "diterima").required().messages({
      'any.only': 'Status pendaftaran tidak valid',
    }),
    alasanPenolakan: Joi.string().allow('', null),
    namaLengkap: Joi.string().required(),
    emailPendaftaran: Joi.string().email().required(),
    // userId: Joi.number().required(),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }
  console.log("yesss ",req.user)
  
  if (req.user.jenis_user_id !== 99) {
    return res.status(403).send({
      status: false,
      message: "No Permission",
    });
  }

  const isApproved = req.body.status === "diterima";
  const transaction = await databaseSIRS.transaction();

  const apiKey = crypto.randomUUID();
  const apiSecret = crypto.randomUUID();

  const updateParams = {
    status: req.body.status,
    user_id: req.user.id,
  };

  const apiKeyParams = {
    production_request_id: req.params.productionRequestId,
    rs_id: req.body.rsId,
    api_key: apiKey,
    api_secret: apiSecret,
  };

  const userParams = {
    jenis_user_id: 4,
    nama: req.body.namaLengkap,
    email: req.body.emailPendaftaran,
    password: "1f703268f04d3cc260f75817f9a2e0b6",
    rs_id: req.body.rsId,
    is_active: 1,
    kriteria_user_id: 2,
  };

  const emailTemplate = isApproved
    ? "reviewApiProductionRequestApproved"
    : "reviewApiProductionRequestDecline";

  const emailDetail = {
    email: req.body.emailPendaftaran,
    subject: "Hasil Review Request API Production Integrasi Pelaporan SIRS6",
    namaUser: req.body.namaLengkap,
    link: "https://drive.google.com/drive/folders/1OoSzjMccjmJvkmdSPy_qBEjsbdMIFrwH",
    template: emailTemplate,
    api_key: apiKey,
    api_secret: apiSecret,
    alasan_penolakan: req.body.alasanPenolakan,
  };
  try {
    const [updateCount] = await apiProductionRequest.update(updateParams, {
      where: { id: req.params.productionRequestId },
      transaction,
    });

    if (!updateCount) {
      throw new Error("Gagal memperbarui status permintaan produksi.");
    }

    if (isApproved) {
      await apiKeyProduction.create(apiKeyParams, { transaction });
      await users_sso.create(userParams, { transaction });
    }

    await sendEmail(emailDetail);
    await transaction.commit();

    return res.status(200).send({
      status: true,
      message: "Review berhasil, email feedback telah dikirim.",
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


// export const reviewProductionRequest = async (req, res) => {
//   const schema = Joi.object({
//     productionRequestId: Joi.number().required(),
//     rsId: Joi.string().required(),
//     status: Joi.string().valid("ditolak", "diterima")
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

//   let updateProdRequestParam = {
//     status : req.body.status,
//     user_id : req.user.id
//   }
  
//   const apiKey=crypto.randomUUID()
//   const apiSecret=crypto.randomUUID()
//   let insertApiKeyProductionParam = {
//     production_request_id:req.body.productionRequestId,
//     rs_id:req.body.rsId,
//     api_key:apiKey,
//     api_secret:apiSecret,
//   }

//   let emailTemplate = "reviewApiProductionRequestApproved"
//   if(req.body.status!="diterima"){
//     emailTemplate = "reviewApiProductionRequestDecline"
//   }

//   let emailDetail=  {
//     email: req.body.emailPendaftaran,
//     subject: "Hasil Review Request API Production Integrasi Pelaporan SIRS6",
//     namaUser: req.body.namaLengkap,
//     link: "https://drive.google.com/drive/folders/1OoSzjMccjmJvkmdSPy_qBEjsbdMIFrwH",
//     template: emailTemplate,
//     api_key:apiKey,
//     api_secret:apiSecret,
//     catatan:req.body.catatan,
//   }

//   const transaction = await databaseSIRS.transaction();

//    try {
//     if(req.body.status=="diterima"){
//       const [updateProdRequest] = await apiProductionRequest.update
//       (
//         updateProdRequestParam,
//         {
//           where: { id: req.body.productionRequestId },
//           transaction
//         }
//       );
//       const [insertApiKeyProduction] = await apiProductionRequest.create
//       (
//         insertApiKeyProductionParam,
//         {
//           transaction
//         }
//       );

//       if (!updateProdRequest || !insertApiKeyProduction) {
//         throw new Error("Review gagal");
//       }
    
//       const sendEmailResult = await sendEmail(emailDetail);
//       console.log('Email sent successfully:', sendEmailResult);
    
//       await transaction.commit();
    
//       return res.status(successStatus).send({
//         status: true,
//         message: "Berhasil Melakukan Review, dan Email Feedback Review Telah Terkirim",
//       });
//     } else {
//       const [updateProdRequest] = await apiProductionRequest.update
//       (
//         updateProdRequestParam,
//         {
//           where: { id: req.body.productionRequestId },
//           transaction
//         }
//       );

//       if (!updateProdRequest) {
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


