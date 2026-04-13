import { databaseSIRS } from "../config/Database.js";
import {
  rlTigaTitikSembilanBelasValidasi,
  statusValidasi,
} from "../models/RLTigaTitikSembilanBelasValidasiModel.js";
import Joi from "joi";
import { Op } from "sequelize";

export const getDataRLTigaTitikSembilanBelasValidasi = (req, res) => {
  if (!req.query.rsId) {
    return res.status(400).send({
      status: false,
      message: "rsId required",
    });
  }

  if (req.user.jenisUserId == 4) {
    if (req.user.satKerId != req.query.rsId) {
      return res.status(403).send({
        status: false,
        message: "Anda tidak memiliki akses",
      });
    }
  }

  const where = {};

  if (req.query.rsId) {
    where.rs_id = req.query.rsId;
  }

  if (req.query.periode) {
    where.periode = {
      [Op.between]: [
        `${req.query.periode}-01-01`,
        `${req.query.periode}-12-31`,
      ],
    };
  }

  if (req.query.statusValidasiId) {
    where.status_validasi_id = req.query.statusValidasiId;
  }

  //   if (req.query.catatan) {
  //     where.catatan = req.query.catatan;
  //   }

  //   if (req.query.userId) {
  //     where.user_id = req.query.userId;
  //   }

  rlTigaTitikSembilanBelasValidasi
    .findAll({
      attributes: [
        "id",
        ["rs_id", "rsId"],
        ["jenis_periode", "jenisPeriode"],
        "periode",
        ["status_validasi_id", "statusValidasiId"],
        "catatan",
        ["user_id", "userId"],
        ["created_at", "createdAt"],
        ["modified_at", "modifiedAt"],
      ],
      where: where,
      include: {
        model: statusValidasi,
        as: "statusValidasi",
      },
      order: [["periode", "ASC"]],
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
    });
};

export const insertDataRLTigaTitikSembilanBelasValidasi = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.date().required(),
    statusValidasiId: Joi.number().required(),
    catatan: Joi.string().when("statusValidasiId", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.string().allow("").optional(),
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }

  if (req.user.jenisUserId == 4) {
    if (req.user.satKerId != req.body.rsId) {
      return res.status(403).send({
        status: false,
        message: "Anda tidak memiliki akses",
      });
    }
  } else if (req.user.jenisUserId != 3) {
    return res.status(403).send({
      status: false,
      message: "Anda tidak memiliki akses",
    });
  }

  try {
    const dataExist = await rlTigaTitikSembilanBelasValidasi.findOne({
      where: {
        rs_id: req.body.rsId,
        periode: req.body.periode,
      },
    });

    if (dataExist) {
      return res.status(400).send({
        status: false,
        message: "Duplicate Entry",
      });
    }

    let catatan = req.body.catatan;
    if (req.body.statusValidasiId == 2) {
      catatan = "";
    }

    const result = await rlTigaTitikSembilanBelasValidasi.create({
      rs_id: req.body.rsId,
      jenis_periode: req.body.jenisPeriode,
      periode: req.body.periode,
      status_validasi_id: req.body.statusValidasiId,
      catatan: catatan,
      user_id: req.user.id,
    });

    res.status(201).send({
      status: true,
      message: "data created",
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: false,
      message: "data not created",
      error: error.message,
    });
  }
};

export const updateDataRLTigaTitikSembilanBelasValidasi = async (req, res) => {
  const schema = Joi.object({
    statusValidasiId: Joi.number().required(),
    catatan: Joi.string().when("statusValidasiId", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.string().allow("").optional(),
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    res.status(404).send({
      status: false,
      message: error.details[0].message,
    });
    return;
  }

  try {
    const dataExist = await rlTigaTitikSembilanBelasValidasi.findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!dataExist) {
      return res.status(404).send({
        status: false,
        message: "Data tidak ditemukan",
      });
    }

    if (req.user.jenisUserId == 4) {
      if (req.user.satKerId != dataExist.rs_id) {
        return res.status(403).send({
          status: false,
          message: "Anda tidak memiliki akses",
        });
      }
    } else if (req.user.jenisUserId != 3) {
      return res.status(403).send({
        status: false,
        message: "Anda tidak memiliki akses",
      });
    }

    let catatan = req.body.catatan;
    // if (req.body.statusValidasiId == 2) {
    //   catatan = "";
    // }

    await rlTigaTitikSembilanBelasValidasi.update(
      {
        status_validasi_id: req.body.statusValidasiId,
        catatan: catatan,
        user_id: req.user.id,
      },
      {
        where: {
          id: req.params.id,
        },
      },
    );

    res.status(200).send({
      status: true,
      message: "Data Diperbaharui",
    });
  } catch (error) {
    res.status(400).send({
      status: false,
      message: "Gagal Memperbaharui Data",
      error: error.message,
    });
  }
};
