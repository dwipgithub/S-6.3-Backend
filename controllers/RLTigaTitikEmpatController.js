import { databaseSIRS } from "../config/Database.js";
import {
  rlTigaTitikEmpatHeader,
  rlTigaTitikEmpatDetail,
  jenisPengunjung,
} from "../models/RLTigaTitikEmpatModel.js";
import Joi from "joi";
import { RLTigaTitikEmpatSatusehat } from "../models/RLTigaTitikEmpatModel.js";
import axios from "axios";
import { satu_sehat_id, users_sso } from "../models/UserModel.js";
import joiDate from "@joi/date";
import ExcelJS from "exceljs";

export const getDataRLTigaTitikEmpat = (req, res) => {
  rlTigaTitikEmpatHeader
    .findAll({
      attributes: ["id", "tahun"],
      where: {
        rs_id: req.query.rsId,
        tahun: req.query.tahun,
      },
      include: {
        model: rlTigaTitikEmpatDetail,
        include: {
          model: jenisPengunjung,
        },
      },
      order: [
        [{ model: rlTigaTitikEmpatDetail }, "jenis_pengunjung_id", "ASC"],
      ],
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

export const getDataRLTigaTitikEmpatSatuSehat = async (req, res) => {
  try {
    const periode = req.query.periode;
    if (!periode) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'periode' (format: YYYY-MM) wajib diisi.",
      });
    }

    // Ambil organization_id dari satu_sehat_id berdasarkan req.user.satKerId
    const koders = req.user.satKerId;
    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: koders },
      attributes: ["organization_id"],
    });

    if (!satuSehat) {
      return res.status(404).json({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }
    const organization_id = satuSehat.organization_id?.substring(0, 9);

    const baseUrl =
      (req.query.baseUrl && req.query.baseUrl.trim()) ||
      process.env.SATUSEHAT_BASE_URL ||
      "https://fhir-sirs-dev.dto.kemkes.go.id";

    const apiKey =
      (req.query.apiKey && req.query.apiKey.trim()) ||
      process.env.SATUSEHAT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        status: false,
        message:
          "API key tidak tersedia. Silakan set process.env.SATUSEHAT_API_KEY atau kirim lewat query apiKey untuk testing.",
      });
    }

    // Pastikan baseUrl tidak mengandung /v1/rlreport
    let cleanBaseUrl = baseUrl
      .replace(/\/?v1\/rlreport\/?$/, "")
      .replace(/\/$/, "");
    const url = `${cleanBaseUrl}/v1/rlreport/rl34?month=${encodeURIComponent(
      periode
    )}&organization_id=${encodeURIComponent(organization_id)}`;

    const options = {
      method: "GET",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
    };

    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
      });

      console.log("URL:", url);
      console.log("Headers:", options.headers);
      console.log("StatusCode:", response.status);
      console.log("Response body:", response.data);

      const data = response.data;

      // Insert or update data RL 3.4 Satusehat
      if (data && data.data && data.data.month) {
        const payload = {
          month: data.data.month,
          organization_id: data.data.organization_id,
          new_visitors: data.data.new_visitors,
          returning_visitors: data.data.returning_visitors,
          total_visitors: data.data.total_visitors,
        };
        console.log("Payload yang akan disimpan:", payload);
        RLTigaTitikEmpatSatusehat.findOne({
          where: {
            month: payload.month,
            organization_id: payload.organization_id,
          },
        }).then((existing) => {
          if (existing) {
            // update
            existing
              .update({
                new_visitors: payload.new_visitors,
                returning_visitors: payload.returning_visitors,
                total_visitors: payload.total_visitors,
              })
              .then(() => {
                console.log("Berhasil update rl_tiga_titik_empat_satusehat");
              })
              .catch((err) => {
                console.log(
                  "Gagal update rl_tiga_titik_empat_satusehat:",
                  err
                );
              });
          } else {
            // insert
            RLTigaTitikEmpatSatusehat.create(payload)
              .then(() => {
                console.log("Berhasil insert rl_tiga_titik_empat_satusehat");
              })
              .catch((err) => {
                console.log(
                  "Gagal insert rl_tiga_titik_empat_satusehat:",
                  err
                );
              });
          }
        });
      }

      return res.status(200).json({
        status: true,
        message: "data found",
        data: data,
      });
    } catch (error) {
      console.log("Request error:", error.message);
      if (error.response) {
        const statusCode = error.response.status;
        const data = error.response.data;
        if (statusCode === 404) {
          return res.status(404).json({
            status: false,
            message: data.message || "Not Found",
            detail: "Data tidak ditemukan dari API Satusehat",
          });
        }
        if (statusCode >= 400) {
          return res.status(statusCode).json({
            status: false,
            message: data.message || "Error dari Satusehat",
            detail: data.detail || null,
          });
        }
      }
      return res.status(500).json({
        status: false,
        message: "Gagal mengambil data dari Satusehat",
        detail: error.message,
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Gagal mengambil organization_id",
      detail: err.message,
    });
  }
};

// Endpoint untuk menampilkan data RL 3.4 Satusehat yang sudah tersimpan (Satusehat Local)
export const getDataRLTigaTitikEmpatSatusehatLocal = async (req, res) => {
  try {
    const where = {};
    if (req.query.month) where.month = req.query.month;
    if (req.query.organization_id) {
      where.organization_id = req.query.organization_id;
    } else if (req.query.rsId) {
      const satuSehat = await satu_sehat_id.findOne({
        where: { kode_baru_faskes: req.query.rsId },
        attributes: ["organization_id"],
      });

      if (!satuSehat) {
        return res.status(404).json({
          status: false,
          message: "OrganizationId Tidak Ada",
        });
      }

      where.organization_id = satuSehat.organization_id?.substring(0, 9);
    }

    const data = await RLTigaTitikEmpatSatusehat.findAll({ where });
    res.status(200).json({
      status: true,
      message: "data found",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Gagal mengambil data RL 3.4 Satusehat lokal",
      detail: err.message,
    });
  }
};

export const downloadRLTigaTitikEmpatSatusehatExcel = async (req, res) => {
  const schema = Joi.object({
    rsId: Joi.string().trim().required(),
    periode: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required(),
    kodeRS: Joi.alternatives()
      .try(Joi.string().max(255), Joi.number().integer().min(0))
      .required(),
    namaRS: Joi.string().max(255).required(),
    provinsi: Joi.string().max(255).required(),
    kabupatenKota: Joi.string().max(255).required(),
  });
  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  try {
    const satuSehat = await satu_sehat_id.findOne({
      where: { kode_baru_faskes: value.rsId },
      attributes: ["organization_id"],
    });

    const organizationId = satuSehat?.organization_id?.substring(0, 9);
    if (!organizationId) {
      return res.status(404).json({
        status: false,
        message: "OrganizationId Tidak Ada",
      });
    }

    const data = await RLTigaTitikEmpatSatusehat.findAll({
      where: {
        month: value.periode,
        organization_id: organizationId,
      },
    });
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const [tahun, bulan] = value.periode.split("-");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("RL 3.4 SatuSehat");
    const headers = [
      "No.",
      "Kode RS",
      "Rumah Sakit",
      "Provinsi",
      "Kabupaten/Kota",
      "Pengunjung Baru",
      "Pengunjung Lama",
      "Total",
    ];
    const rows = data.map((record, index) => {
      const row = record.toJSON();
      return [
        index + 1,
        String(value.kodeRS),
        value.namaRS,
        value.provinsi,
        value.kabupatenKota,
        row.new_visitors ?? 0,
        row.returning_visitors ?? 0,
        row.total_visitors ?? 0,
      ];
    });

    [
      ["RL 3.4 KUNJUNGAN - SATUSEHAT"],
      [],
      ["Periode Data"],
      [`Bulan : ${monthNames[Number(bulan) - 1]}`],
      [`Tahun : ${tahun}`],
      [],
      headers,
      ...rows,
    ].forEach((row) => worksheet.addRow(row));

    [8, 16, 30, 22, 24, 18, 18, 18].forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });
    ;[1, 3, 4, 5].forEach((rowNumber) => {
      worksheet.mergeCells(rowNumber, 1, rowNumber, headers.length);
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < 7) return;
      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal:
            rowNumber === 7
              ? "center"
              : [2, 3, 4, 5].includes(columnNumber)
                ? "left"
                : "right",
          wrapText: true,
        };
      });
    });

    worksheet.getRow(7).font = { bold: true };
    worksheet.getCell("A1").font = {
      name: "Calibri",
      size: 16,
      bold: true,
    };
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "left",
    };
    worksheet.getRow(1).height = 24;
    ;["A3", "A4", "A5"].forEach((address) => {
      const cell = worksheet.getCell(address);
      cell.font = { name: "Calibri", size: 12, bold: true };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.attachment(`RL_3_4_SatuSehat_${tahun}_${Number(bulan)}.xlsx`);
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Gagal membuat Excel RL 3.4 Satusehat:", err);
    return res.status(500).json({
      status: false,
      message: "Gagal membuat Excel RL 3.4 Satusehat",
      detail: err.message,
    });
  }
};

export const insertDataRLTigaTitikEmpat = async (req, res) => {
  console.log(req.user);
  const schema = Joi.object({
    tahun: Joi.number().required(),
    tahunDanBulan: Joi.date().required(),
    data: Joi.array()
      .items(
        Joi.object()
          .keys({
            jenisPengunjungId: Joi.number().required(),
            jumlah: Joi.number().required(),
          })
          .required()
      )
      .required(),
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
    const resultInsertHeader = await rlTigaTitikEmpatHeader.create(
      {
        rs_id: req.user.satKerId,
        tahun: req.body.tahunDanBulan,
        user_id: req.user.id,
      },
      { transaction }
    );

    const dataDetail = req.body.data.map((value, index) => {
      return {
        rs_id: req.user.satKerId,
        tahun: req.body.tahunDanBulan,
        rl_tiga_titik_empat_id: resultInsertHeader.id,
        jenis_pengunjung_id: value.jenisPengunjungId,
        jumlah: value.jumlah,
        user_id: req.user.id,
      };
    });

    const resultInsertDetail = await rlTigaTitikEmpatDetail.bulkCreate(
      dataDetail,
      {
        transaction,
        updateOnDuplicate: ["jumlah"],
      }
    );
    // console.log(resultInsertDetail[0].id)
    await transaction.commit();
    res.status(201).send({
      status: true,
      message: "data created",
      data: {
        id: resultInsertHeader.id,
      },
    });
  } catch (error) {
    console.log(error);
    if (transaction) {
      await transaction.rollback();
    }
    res.status(400).send({
      status: false,
      message: "data not created",
      error: error,
    });
  }
};

export const updateDataRLTigaTitikEmpat = async (req, res) => {
  try {
    await rlTigaTitikEmpatDetail.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ message: "RL Updated" });
  } catch (error) {
    console.log(error.message);
  }
};

export const deleteDataRLTigaTitikEmpat = async (req, res) => {
  try {
    const count = await rlTigaTitikEmpatDetail.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(201).send({
      status: true,
      message: "data deleted successfully",
      data: {
        deleted_rows: count,
      },
    });
  } catch (error) {
    res.status(404).send({
      status: false,
      message: error,
    });
  }
};

export const getRLTigaTitikEmpatById = async (req, res) => {
  rlTigaTitikEmpatDetail
    .findOne({
      where: {
        id: req.params.id,
      },
      include: {
        model: jenisPengunjung,
      },
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
