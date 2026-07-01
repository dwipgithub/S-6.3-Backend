import { databaseSIRS } from "../config/Database.js"
import { rlTigaTitikTujuh, rlTigaTitikTujuhDetail, RLTigaTitikTujuhSatusehat } from "../models/RLTigaTitikTujuhModel.js"
import Joi from "joi"
import {
  groupJenisKegiatan,
  groupJenisKegiatanHeader,
  jenisKegiatan,
} from "../models/JenisKegiatanRLTigaTitikTujuhModel.js";
import axios from "axios";
import { satu_sehat_id } from "../models/UserModel.js";

export const getDataRLTigaTitikTujuh2 = (req, res) => {
    rlTigaTitikTujuh.findAll({
        attributes: ['id','tahun'],
        where:{
            rs_id: req.user.rsId,
            tahun: req.query.tahun
        },
        
        include:{
            model: rlTigaTitikTujuhDetail,
            include: {
                model: jenisKegiatan,
                
            // include: {
            //     model: groupJenisKegiatan,
            //     include: {
            //         model: groupJenisKegiatanHeader
            //     },
            // },
            },
            // order: [[{ model: groupJenisKegiatanHeader }, 'no', 'DESC']]
        }
    })
    .then((results) => {
        res.status(200).send({
            status: true,
            message: "data found",
            data: results
        })
    })
    .catch((err) => {
        res.status(422).send({
            status: false,
            message: err
        })
        return
    })
}

export const getDataRLTigaTitikTujuh = (req, res) => {
    rlTigaTitikTujuhDetail
      .findAll({
        attributes: ["id", 
        "rl_tiga_titik_tujuh_id", 
        "rmRumahSakit",
        "rmBidan",
        "rmPuskesmas",
        "rmFaskesLainnya",
        "rmHidup",
        "rmMati",
        "rmTotal",
        "rnmHidup",
        "rnmMati",
        "rnmTotal",
        "nrHidup",
        "nrMati",
        "nrTotal",
        "dirujuk"
        ],
        where: {
            rs_id: req.query.rsId,
            tahun: req.query.tahun,
        },
        include: {
          model: jenisKegiatan,
          attributes: ["id", "no", "nama"],
          include: {
            model: groupJenisKegiatan,
            attributes: ["id", "no", "nama"],
            include: {
              model: groupJenisKegiatanHeader,
            },
          },
        },
        order: [[jenisKegiatan, "id", "ASC"]],
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
  

export const insertDataRLTigaTitikTujuh =  async (req, res) => {
    const schema = Joi.object({
        tahun: Joi.number().required(),
        tahunDanBulan: Joi.date().required(),
        data: Joi.array()
            .items(
                Joi.object().keys({
                    jenisKegiatanId: Joi.number().required(),
                    rmRumahSakit: Joi.number().required(),
                    rmBidan: Joi.number().required(),
                    rmPuskesmas: Joi.number().required(),
                    rmFaskesLainnya: Joi.number().required(),
                    rmHidup: Joi.number().required(),
                    rmMati: Joi.number().required(),
                    rmTotal: Joi.number().required(),
                    rnmHidup: Joi.number().required(),
                    rnmMati: Joi.number().required(),
                    rnmTotal: Joi.number().required(),
                    nrHidup: Joi.number().required(),
                    nrMati: Joi.number().required(),
                    nrTotal: Joi.number().required(),
                    dirujuk: Joi.number().required()
                }).required()
            ).required()
    })

    const { error, value } =  schema.validate(req.body)
    if (error) {
        res.status(404).send({
            status: false,
            message: error.details[0].message
        })
        return
    }

    let transaction
    try {
        transaction = await databaseSIRS.transaction()
        const resultInsertHeader = await rlTigaTitikTujuh.create({
            rs_id: req.user.satKerId,
            tahun: req.body.tahunDanBulan,
            user_id: req.user.id
        }, { transaction })

        const dataDetail = req.body.data.map((value, index) => {
            return {
                rs_id: req.user.satKerId,
                tahun: req.body.tahunDanBulan,
                rl_tiga_titik_tujuh_id: resultInsertHeader.id,
                jenis_kegiatan_id: value.jenisKegiatanId,
                rmRumahSakit: value.rmRumahSakit,
                rmBidan: value.rmBidan,
                rmPuskesmas: value.rmPuskesmas,
                rmFaskesLainnya: value.rmFaskesLainnya,
                rmHidup: value.rmHidup,
                rmMati: value.rmMati,
                rmTotal: value.rmTotal,
                rnmHidup: value.rnmHidup,
                rnmMati: value.rnmMati,
                rnmTotal: value.rnmTotal,
                nrHidup: value.nrHidup,
                nrMati: value.nrMati,
                nrTotal: value.nrTotal,
                dirujuk: value.dirujuk,
                user_id: req.user.id
            }
        })

        const resultInsertDetail = await rlTigaTitikTujuhDetail.bulkCreate(dataDetail, { 
            transaction: transaction
            // updateOnDuplicate: [
            //     "rmRumahSakit",
            //     "rmBidan",
            //     "rmPuskesmas",
            //     "rmFaskesLainnya",
            //     "rmHidup",
            //     "rmMati",
            //     "rmTotal",
            //     "rnmHidup",
            //     "rnmMati",
            //     "rnmTotal",
            //     "nrHidup",
            //     "nrMati",
            //     "nrTotal",
            //     "dirujuk",
            // ],
        })
        // console.log(resultInsertDetail[0].id)
        await transaction.commit()
        res.status(201).send({
            status: true,
            message: "data created",
            data: {
                id: resultInsertHeader.id
            }
        })
    } catch (error) {
        console.log(error)
        await transaction.rollback()
        if(error.name === 'SequelizeUniqueConstraintError'){
            res.status(400).send({
                status: false,
                message: "Duplicate Entry"
            })
        } else {
            res.status(400).send({
                status: false,
                message: error
            })
        }
    }
}

export const updateDataRLTigaTitikTujuh = async(req,res)=>{
    try{
        await rlTigaTitikTujuhDetail.update(req.body,{
            where:{
                id: req.params.id
            }
        });
        res.status(200).json({message: "RL Updated"});
    }catch(error){
        console.log(error.message);
    }
}

export const deleteDataRLTigaTitikTujuh = async(req, res) => {
    try {
        const count = await rlTigaTitikTujuhDetail.destroy({
            where: {
                id: req.params.id
            }
        })
        res.status(201).send({
            status: true,
            message: "data deleted successfully",
            data: {
                'deleted_rows': count
            }
        })
    } catch (error) {
        res.status(404).send({
            status: false,
            message: error
        })
    }
}

export const getRLTigaTitikTujuhById = async(req,res)=>{
    rlTigaTitikTujuhDetail.findOne({
        where:{
            id:req.params.id
        },
        include:{
            model: jenisKegiatan
        }
    })
    .then((results) => {
        res.status(200).send({
            status: true,
            message: "data found",
            data: results
        })
    })
    .catch((err) => {
        res.status(422).send({
            status: false,
            message: err
        })
        return
    })
}

export const getDataRLTigaTitikTujuhSatuSehat = async (req, res) => {
    try {
        const toMonthDate = (value, fallbackPeriode) => {
            const raw = (value ?? fallbackPeriode ?? '')
                .toString()
                .trim()

            const match = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)

            if (!match) return null

            const month = Number(match[2])

            if (!Number.isFinite(month) || month < 1 || month > 12) {
                return null
            }

            return `${match[1]}-${match[2]}-01`
        }

        const periode = (
            req.query.periode ||
            req.query.month ||
            ''
        ).toString().trim()

        if (!periode) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'periode' wajib diisi."
            })
        }

        const isValidPeriode = /^\d{4}-\d{2}$/.test(periode)

        if (!isValidPeriode) {
            return res.status(400).json({
                status: false,
                message: "Format periode harus YYYY-MM."
            })
        }


        const baseUrl =
            process.env.SATUSEHAT_BASE_URL ||
            'https://api-dev.dto.kemkes.go.id/fhir-sirs'

        // =========================================
        // API KEY
        // =========================================
        const apiKeyFromHeader = (
            req.headers['x-api-key'] || ''
        ).toString().trim()

        const apiKey =
            apiKeyFromHeader ||
            process.env.SATUSEHAT_API_KEY

        if (!apiKey) {
            return res.status(500).json({
                status: false,
                message: "API key tidak tersedia."
            })
        }
        const koders = req.query.rsId;


        if (!koders) {
            return res.status(401).json({
                status: false,
                message: "Session user tidak ditemukan."
            })
        }
        const satuSehat = await satu_sehat_id.findOne({
            where: {
                kode_baru_faskes: koders
            },
            attributes: ["organization_id"]
        })


        if (!satuSehat) {
            return res.status(404).json({
                status: false,
                message: "OrganizationId Tidak Ada"
            })
        }

        const organization_id =
            satuSehat.organization_id

        console.log(
            "ORGANIZATION ID:",
            organization_id
        )
        const cleanBaseUrl = baseUrl
            .replace(/\/?v1\/rlreport\/?$/, '')
            .replace(/\/$/, '')

        const url =
            `${cleanBaseUrl}/v1/rlreport/rl37` +
            `?bulan_laporan=${encodeURIComponent(periode)}` +
            `&organization_id=${encodeURIComponent(organization_id)}`

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        })

        const raw = response?.data
        const candidates = [
            raw?.data?.pelayanan_neonatal_bayi_balita,
            raw?.data?.data?.pelayanan_neonatal_bayi_balita,
            raw?.pelayanan_neonatal_bayi_balita,
            raw?.data,
            raw
        ]

        let items = []

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                items = candidate
                break
            }
        }

        // =========================================
        // JIKA DATA KOSONG
        // =========================================
        if (!items || items.length === 0) {
            return res.status(200).json({
                status: true,
                message: 'Data belum tersedia untuk periode ini.',
                meta: {
                    parsed_count: 0,
                    inserted_count: 0,
                    updated_count: 0,
                    skipped_count: 0
                },
                data: raw
            })
        }

        // =========================================
        // SIMPAN / UPDATE DATABASE
        // =========================================
        let insertedCount = 0
        let updatedCount = 0
        let skippedCount = 0

        for (const item of items) {
            const bulan_laporan = toMonthDate(
                item?.bulan_laporan || item?.month,
                periode
            )

            const organization_id_final = (
                item?.organization_id ??
                organization_id
            ).toString().trim()

            const nama_kegiatan = (
                item?.nama_kegiatan || ''
            ).toString().trim()

            if (
                !bulan_laporan ||
                !organization_id_final ||
                !nama_kegiatan
            ) {
                skippedCount += 1
                continue
            }

            const payload = {
                bulan_laporan,
                organization_id: organization_id_final,
                tahun: raw?.data?.tahun || Number(periode.split('-')[0]),
                nama_kegiatan,
                rujukan_medis_rumah_sakit: Number(item?.rujukan_medis_rumah_sakit ?? 0),
                rujukan_medis_bidan: Number(item?.rujukan_medis_bidan ?? 0),
                rujukan_medis_puskesmas: Number(item?.rujukan_medis_puskesmas ?? 0),
                rujukan_medis_faskes_lainnya: Number(item?.rujukan_medis_faskes_lainnya ?? 0),
                rujukan_medis_jumlah_hidup: Number(item?.rujukan_medis_jumlah_hidup ?? 0),
                rujukan_medis_jumlah_mati: Number(item?.rujukan_medis_jumlah_mati ?? 0),
                rujukan_medis_total: Number(item?.rujukan_medis_total ?? 0),
                rujukan_non_medis_jumlah_hidup: Number(item?.rujukan_non_medis_jumlah_hidup ?? 0),
                rujukan_non_medis_jumlah_mati: Number(item?.rujukan_non_medis_jumlah_mati ?? 0),
                rujukan_non_medis_total: Number(item?.rujukan_non_medis_total ?? 0),
                non_rujukan_jumlah_hidup: Number(item?.non_rujukan_jumlah_hidup ?? 0),
                non_rujukan_jumlah_mati: Number(item?.non_rujukan_jumlah_mati ?? 0),
                non_rujukan_total: Number(item?.non_rujukan_total ?? 0),
                dirujuk: Number(item?.dirujuk ?? 0)
            }

            const existing =
                await RLTigaTitikTujuhSatusehat.findOne({
                    where: {
                        bulan_laporan: payload.bulan_laporan,
                        organization_id: payload.organization_id,
                        nama_kegiatan: payload.nama_kegiatan
                    }
                })

            if (existing) {
                await existing.update(payload)
                updatedCount += 1
            } else {
                await RLTigaTitikTujuhSatusehat.create(payload)
                insertedCount += 1
            }
        }

        // =========================================
        // RESPONSE SUCCESS
        // =========================================
        return res.status(200).json({
            status: true,
            message: 'success',
            meta: {
                parsed_count: items.length,
                inserted_count: insertedCount,
                updated_count: updatedCount,
                skipped_count: skippedCount
            },
            data: raw
        })

    } catch (err) {
        console.error(err)
        const statusCode = err?.response?.status || 500

        if (statusCode === 404) {
            return res.status(200).json({
                status: true,
                message: 'Data belum tersedia untuk periode ini.',
                meta: {
                    parsed_count: 0,
                    inserted_count: 0,
                    updated_count: 0,
                    skipped_count: 0
                },
                data: err?.response?.data || null
            })
        }

        return res.status(statusCode).json({
            status: false,
            message: 'Gagal memproses data RL 3.7 Satusehat',
            detail: err?.response?.data || err.message
        })
    }
}

export const getDataRLTigaTitikTujuhSatusehatLocal = async (req, res) => {
    try {
        console.log("Request params:", req.query);
        const where = {}
        if (req.query.bulan_laporan) where.bulan_laporan = req.query.bulan_laporan
        
        // If rsId is provided, get organization_id from satu_sehat_id table
        if (req.query.rsId) {
            console.log("Looking for organization_id with kode_baru_faskes:", req.query.rsId);
            const satuSehat = await satu_sehat_id.findOne({
                where: { kode_baru_faskes: req.query.rsId },
                attributes: ["organization_id"]
            });
            console.log("satuSehat result:", satuSehat);
            if (satuSehat) {
                where.organization_id = satuSehat.organization_id;
            }
        } else if (req.query.organization_id) {
            where.organization_id = req.query.organization_id
        }
        
        console.log("Query where clause:", where);
        const data = await RLTigaTitikTujuhSatusehat.findAll({ where })
        console.log("Query result:", data);
        res.status(200).json({
            status: true,
            message: 'data found',
            data: data
        })
    } catch (err) {
        console.error("Error in getDataRLTigaTitikTujuhSatusehatLocal:", err);
        res.status(500).json({
            status: false,
            message: 'Gagal mengambil data RL 3.7 Satusehat lokal',
            detail: err.message
        })
    }
}