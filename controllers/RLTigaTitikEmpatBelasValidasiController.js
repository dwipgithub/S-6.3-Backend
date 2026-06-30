import { rlTigaTitikEmpatBelasValidasi } from "../models/RLTigaTitikEmpatBelasValidasiModel.js";
import { statusValidasi } from "../models/RLTigaTitikEmpatBelasValidasiModel.js";
import Joi from "joi";
import { Op } from "sequelize";

export const getDataRLTigaTitikEmpatBelasValidasi = (req, res) => {
  const where = {};

  if (req.query.rsId) {
    where.rs_id = req.query.rsId;
  }

  if (req.query.periode) {
    const periode = req.query.periode;

    if (!/^\d{4}-\d{2}$/.test(periode)) {
      return res.status(400).send({
        status: false,
        message: "Format periode harus YYYY-MM",
      });
    }

    const year = periode.substring(0, 4);
    const month = periode.substring(5, 7);
    const lastDay = new Date(year, month, 0).getDate();

    where.periode = `${year}-${month}-${lastDay}`;
  }

  if (req.query.statusValidasiId) {
    where.status_validasi_id = req.query.statusValidasiId;
  }

  rlTigaTitikEmpatBelasValidasi
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

export const insertDataRLTigaTitikEmpatBelasValidasi = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string().required(),
    // periode: Joi.string()
    //   .pattern(/^\d{4}-\d{2}-\d{2}$/)
    //   .required(),
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
  delete req.body.jenisPeriode;

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.periode)) {
      return res.status(400).send({
        status: false,
        message: "Format periode harus YYYY-MM-DD",
      });
    }
    const year = req.body.periode.substring(0, 4);
    const month = req.body.periode.substring(5, 7);
    const lastDay = new Date(year, month, 0).getDate();
    const periode = `${year}-${month}-${lastDay}`;

    const dataExist = await rlTigaTitikEmpatBelasValidasi.findOne({
      where: {
        rs_id: req.body.rsId,
        periode: periode,
      },
    });

    if (dataExist) {
      return res.status(400).send({
        status: false,
        message: "Duplicate Entry",
      });
    }

    const result = await rlTigaTitikEmpatBelasValidasi.create({
      rs_id: req.body.rsId,
      jenis_periode: 2,
      periode: periode,
      status_validasi_id: req.body.statusValidasiId,
      catatan: req.body.catatan,
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

export const updateDataRLTigaTitikEmpatBelasValidasi = async (req, res) => {
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
  delete req.body.jenisPeriode;

  try {
    const dataExist = await rlTigaTitikEmpatBelasValidasi.findOne({
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

    let updateData = {
      status_validasi_id: req.body.statusValidasiId,
      user_id: req.user.id,
    };

    // hanya update catatan jika bukan status 2
    if (req.body.statusValidasiId !== 2) {
      updateData.catatan = req.body.catatan;
    }

    await rlTigaTitikEmpatBelasValidasi.update(updateData, {
      where: {
        id: req.params.id,
        rs_id: dataExist.rs_id,
        periode: dataExist.periode,
      },
    });

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
