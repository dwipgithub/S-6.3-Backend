import { databaseSIRS } from "../config/Database.js";
import { rlEmpatTitikSatuValidasi } from "../models/RLEmpatTitikSatuValidasiModel.js";
import { rlEmpatTitikDuaValidasi } from "../models/RLEmpatTitikDuaValidasiModel.js";
import { rlEmpatTitikTigaValidasi } from "../models/RLEmpatTitikTigaValidasiModel.js";
import { statusValidasi } from "../models/RLTigaTitikSembilanBelasValidasiModel.js";
import Joi from "joi";
import { Op } from "sequelize";

export const getDataRLEmpatTitikSatuValidasi = (req, res) => {
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
    const periode = req.query.periode;

    if (periode.length === 4) {
      where.periode = {
        [Op.between]: [`${periode}-01-01`, `${periode}-12-31`],
      };
    } else {
      let modifiedPeriode = periode;
      if (periode.length === 7) {
        const year = periode.substring(0, 4);
        const month = periode.substring(5, 7);
        const lastDay = new Date(year, month, 0).getDate();
        modifiedPeriode = `${year}-${month}-${lastDay}`;
      }
      where.periode = modifiedPeriode;
    }
  }

  if (req.query.statusValidasiId) {
    where.status_validasi_id = req.query.statusValidasiId;
  }

  rlEmpatTitikSatuValidasi
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

// export const insertDataRLEmpatTitikSatuValidasi = async (req, res) => {
//   const schema = Joi.object({
//     rsId: Joi.string().required(),
//     periode: Joi.string().required(),
//     statusValidasiId: Joi.number().required(),
//     catatan: Joi.string().when("statusValidasiId", {
//       is: 1,
//       then: Joi.required(),
//       otherwise: Joi.string().allow("").optional(),
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

//   if (req.user.jenisUserId == 4) {
//     if (req.user.satKerId != req.body.rsId) {
//       return res.status(403).send({
//         status: false,
//         message: "Anda tidak memiliki akses",
//       });
//     }
//   } else if (req.user.jenisUserId != 3) {
//     return res.status(403).send({
//       status: false,
//       message: "Anda tidak memiliki akses",
//     });
//   }

//   try {
//     const year = req.body.periode.substring(0, 4);
//     const month = req.body.periode.substring(5, 7);
//     const lastDay = new Date(year, month, 0).getDate();
//     const periode = `${year}-${month}-${lastDay}`;

//     const dataExist = await rlEmpatTitikSatuValidasi.findOne({
//       where: {
//         rs_id: req.body.rsId,
//         periode: periode,
//       },
//     });

//     if (dataExist) {
//       return res.status(400).send({
//         status: false,
//         message: "Duplicate Entry",
//       });
//     }

//     const result = await rlEmpatTitikSatuValidasi.create({
//       rs_id: req.body.rsId,
//       jenis_periode: req.body.jenisPeriode,
//       periode: periode,
//       status_validasi_id: req.body.statusValidasiId,
//       catatan: req.body.catatan,
//       user_id: req.user.id,
//     });

//     res.status(201).send({
//       status: true,
//       message: "data created",
//       data: {
//         id: result.id,
//       },
//     });
//   } catch (error) {
//     res.status(400).send({
//       status: false,
//       message: "data not created",
//       error: error.message,
//     });
//   }
// };

// export const updateDataRLEmpatTitikSatuValidasi = async (req, res) => {
//   const schema = Joi.object({
//     statusValidasiId: Joi.number().required(),
//     catatan: Joi.string().when("statusValidasiId", {
//       is: 1,
//       then: Joi.required(),
//       otherwise: Joi.string().allow("").optional(),
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

//   try {
//     const dataExist = await rlEmpatTitikSatuValidasi.findOne({
//       where: {
//         id: req.params.id,
//       },
//     });

//     if (!dataExist) {
//       return res.status(404).send({
//         status: false,
//         message: "Data tidak ditemukan",
//       });
//     }

//     if (req.user.jenisUserId == 4) {
//       if (req.user.satKerId != dataExist.rs_id) {
//         return res.status(403).send({
//           status: false,
//           message: "Anda tidak memiliki akses",
//         });
//       }
//     } else if (req.user.jenisUserId != 3) {
//       return res.status(403).send({
//         status: false,
//         message: "Anda tidak memiliki akses",
//       });
//     }

//     await rlEmpatTitikSatuValidasi.update(
//       {
//         status_validasi_id: req.body.statusValidasiId,
//         catatan: req.body.catatan,
//         user_id: req.user.id,
//       },
//       {
//         where: {
//           id: req.params.id,
//         },
//       },
//     );

//     res.status(200).send({
//       status: true,
//       message: "Data Diperbaharui",
//     });
//   } catch (error) {
//     res.status(400).send({
//       status: false,
//       message: "Gagal Memperbaharui Data",
//       error: error.message,
//     });
//   }
// };

export const insertDataRLEmpatTitikSatuValidasi = async (req, res) => {
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

  let transaction;

  try {
    transaction = await databaseSIRS.transaction();
    const year = req.body.periode.substring(0, 4);
    const month = req.body.periode.substring(5, 7);
    const lastDay = new Date(year, month, 0).getDate();
    const periode = `${year}-${month}-${lastDay}`;

    const dataExist = await rlEmpatTitikSatuValidasi.findOne({
      where: {
        rs_id: req.body.rsId,
        periode: periode,
      },
      transaction,
    });

    if (dataExist) {
      await transaction.rollback();
      return res.status(400).send({
        status: false,
        message: "Duplicate Entry",
      });
    }

    const result = await rlEmpatTitikSatuValidasi.create(
      {
        rs_id: req.body.rsId,
        jenis_periode: req.body.jenisPeriode,
        periode: periode,
        status_validasi_id: req.body.statusValidasiId,
        catatan: req.body.catatan,
        user_id: req.user.id,
      },
      { transaction },
    );

    // RL 4.2
    const dataExist42 = await rlEmpatTitikDuaValidasi.findOne({
      where: {
        rs_id: req.body.rsId,
        periode: periode,
      },
      transaction,
    });

    if (dataExist42) {
      await rlEmpatTitikDuaValidasi.update(
        {
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        {
          where: {
            rs_id: req.body.rsId,
            periode: periode,
          },
          transaction,
        },
      );
    } else {
      await rlEmpatTitikDuaValidasi.create(
        {
          rs_id: req.body.rsId,
          jenis_periode: req.body.jenisPeriode,
          periode: periode,
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        { transaction },
      );
    }

    // RL 4.3
    const dataExist43 = await rlEmpatTitikTigaValidasi.findOne({
      where: {
        rs_id: req.body.rsId,
        periode: periode,
      },
      transaction,
    });

    if (dataExist43) {
      await rlEmpatTitikTigaValidasi.update(
        {
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        {
          where: {
            rs_id: req.body.rsId,
            periode: periode,
          },
          transaction,
        },
      );
    } else {
      await rlEmpatTitikTigaValidasi.create(
        {
          rs_id: req.body.rsId,
          jenis_periode: req.body.jenisPeriode,
          periode: periode,
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        { transaction },
      );
    }

    await transaction.commit();

    res.status(201).send({
      status: true,
      message: "data created",
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    res.status(400).send({
      status: false,
      message: "data not created",
      error: error.message,
    });
  }
};

export const updateDataRLEmpatTitikSatuValidasi = async (req, res) => {
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

  let transaction;

  try {
    transaction = await databaseSIRS.transaction();
    const dataExist = await rlEmpatTitikSatuValidasi.findOne({
      where: {
        id: req.params.id,
      },
      transaction,
    });

    if (!dataExist) {
      await transaction.rollback();
      return res.status(404).send({
        status: false,
        message: "Data tidak ditemukan",
      });
    }

    if (req.user.jenisUserId == 4) {
      if (req.user.satKerId != dataExist.rs_id) {
        await transaction.rollback();
        return res.status(403).send({
          status: false,
          message: "Anda tidak memiliki akses",
        });
      }
    } else if (req.user.jenisUserId != 3) {
      await transaction.rollback();
      return res.status(403).send({
        status: false,
        message: "Anda tidak memiliki akses",
      });
    }

    await rlEmpatTitikSatuValidasi.update(
      {
        status_validasi_id: req.body.statusValidasiId,
        catatan: req.body.catatan,
        user_id: req.user.id,
      },
      {
        where: {
          id: req.params.id,
        },
        transaction,
      },
    );

    // RL 4.2
    const dataExist42 = await rlEmpatTitikDuaValidasi.findOne({
      where: {
        rs_id: dataExist.rs_id,
        periode: dataExist.periode,
      },
      transaction,
    });

    if (dataExist42) {
      await rlEmpatTitikDuaValidasi.update(
        {
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        {
          where: {
            rs_id: dataExist.rs_id,
            periode: dataExist.periode,
          },
          transaction,
        },
      );
    } else {
      await rlEmpatTitikDuaValidasi.create(
        {
          rs_id: dataExist.rs_id,
          jenis_periode: dataExist.jenis_periode,
          periode: dataExist.periode,
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        { transaction },
      );
    }

    // RL 4.3
    const dataExist43 = await rlEmpatTitikTigaValidasi.findOne({
      where: {
        rs_id: dataExist.rs_id,
        periode: dataExist.periode,
      },
      transaction,
    });

    if (dataExist43) {
      await rlEmpatTitikTigaValidasi.update(
        {
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        {
          where: {
            rs_id: dataExist.rs_id,
            periode: dataExist.periode,
          },
          transaction,
        },
      );
    } else {
      await rlEmpatTitikTigaValidasi.create(
        {
          rs_id: dataExist.rs_id,
          jenis_periode: dataExist.jenis_periode,
          periode: dataExist.periode,
          status_validasi_id: req.body.statusValidasiId,
          catatan: req.body.catatan,
          user_id: req.user.id,
        },
        { transaction },
      );
    }

    await transaction.commit();

    res.status(200).send({
      status: true,
      message: "Data Diperbaharui",
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    res.status(400).send({
      status: false,
      message: "Gagal Memperbaharui Data",
      error: error.message,
    });
  }
};
