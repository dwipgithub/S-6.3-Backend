import { databaseSIRS } from "../config/Database.js";
import Joi from "joi";
import joiDate from "@joi/date"
import { apiRegistration } from "../models/ApiRegistrationModel.js";
import {emailVerificationToken } from "../models/EmailVerificationTokenModel.js";

export const getEmailVerificationToken = (req, res) => {
  const joi = Joi.extend(joiDate)
  const schema = joi.object({
    registrationId: joi.string(),
    token: joi.string()
  })
  const { error, value } = schema.validate(req.query);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }


  let whereClause = {
      token : req.params.satKerId,
    }

  emailVerificationToken
    .findAll({
      // include: {
      //   model: icd,
      //   attributes: ["icd_code", "description_code", "icd_code_group", "description_code_group"],
      // },  
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

export const insertEmailVerification = async (req, res) => {
  const schema = Joi.object({
    registrationId: Joi.number(),
    token: Joi.string(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }

  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
    await emailVerificationToken.create(
      {
        registration_id: req.body.registrationId,
        token: req.body.token,
      },
      { transaction }
    );
  } catch (error) {
    if (transaction) {
        res.status(400).send({
          status: false,
          message: "Gagal Input Data.",
        });
      }
      await transaction.rollback();
    }
};

export const updateEmailVerification = async (req, res) => {
  const schema = Joi.object({
    registrationId: joi.string(),
    token: joi.string()
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }
  let dataUpdate = {
    registration_id: req.params.registrationId,
    token: req.params.token,
    used : 1
  }
  let transaction;
  try {
    transaction = await databaseSIRS.transaction();
      const update = await apiRegistration.update(req.body, {
        where: {
          registration_id: req.params.registrationId,
          token: req.params.token
        },
      });
      if (update[0] != 0) {
        await transaction.commit();
        res.status(201).send({
          status: true,
          message: "Data diubah",
        });
      } else {
        await transaction.rollback();
        res.status(400).send({
          status: false,
          message: "Data Tidak Berhasil di Ubah",
        });
      }
  } catch (error) {
    await transaction.rollback();
    res.status(400).send({
      status: false,
      message: error,
    });
  }
};

