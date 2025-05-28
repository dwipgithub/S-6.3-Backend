import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import { apiProductionRequest } from "../models/ApiProductionRequestModel.js";


export const insertApiProductionRequest = async (req, res) => {
  const schema = Joi.object({
    apiKeyDevelopmentId: Joi.string(),
    linkBuktiDevelopment: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).send({
      status: false,
      message: error.details[0].message,
    });
  }
  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
    await apiProductionRequest.create(
      {
        api_key_development_id : req.params.apiKeyDevelopmentId,
        link_bukti_development: req.body.linkBuktiDevelopment
      },
    {transaction})

    await transaction.commit();
    res.status(201).send({
      status: true,
      message: "Request Production Berhasil dibuat",
    })

  } catch (err) {
    
    await transaction.rollback();
    console.error("Database error:", err);
    
    if (err.parent.code === "ER_DUP_ENTRY") {
      return res.status(422).send({
        status: false,
        message: "Gagal Request Production, karena sudah pernah melakukan request api production.",
      });
    }
    else{
      return res.status(500).send({
        status: false,
        message: "Terjadi kesalahan pada server.",
      });
    }

  }
};
