import { rlTigaTitikSepuluhValidasi } from "../models/RLTigaTitikSepuluhValidasiModel.js";
import { statusValidasi } from "../models/RLTigaTitikSepuluhValidasiModel.js";
import Joi from "joi";
import { Op } from "sequelize";

export const getDataRLTigaTitikSepuluhValidasi = (req, res) => {
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

    if (periode.length === 7) {
      const year = periode.substring(0, 4);
      const month = periode.substring(5, 7);
      const lastDay = new Date(year, month, 0).getDate();

      where.periode = `${year}-${month}-${lastDay}`;
    }
  }

  if (req.query.statusValidasiId) {
    where.status_validasi_id = req.query.statusValidasiId;
  }

  rlTigaTitikSepuluhValidasi
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

export const insertDataRLTigaTitikSepuluhValidasi = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().required(),
    periode: Joi.string().required(),
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
    const year = req.body.periode.substring(0, 4);
    const month = req.body.periode.substring(5, 7);
    const lastDay = new Date(year, month, 0).getDate();
    const periode = `${year}-${month}-${lastDay}`;

    const dataExist = await rlTigaTitikSepuluhValidasi.findOne({
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

    const result = await rlTigaTitikSepuluhValidasi.create({
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

export const updateDataRLTigaTitikSepuluhValidasi = async (req, res) => {
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
    const dataExist = await rlTigaTitikSepuluhValidasi.findOne({
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

    const year = dataExist.periode.substring(0, 4);
    const month = dataExist.periode.substring(5, 7);

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

    await rlTigaTitikSepuluhValidasi.update(
      {
        status_validasi_id: req.body.statusValidasiId,
        catatan: req.body.catatan,
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
