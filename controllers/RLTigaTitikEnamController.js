import { databaseSIRS } from '../config/Database.js'
import { rlTigaTitikEnamHeader, rlTigaTitikEnamDetail, jenisKegiatan, jenisGroupKegiatanHeader, RLTigaTitikEnamSatusehat } from '../models/RLTigaTitikEnamModel.js'
import Joi from 'joi'
import axios from 'axios'
import { satu_sehat_id } from '../models/UserModel.js'

export const getDataRLTigaTitikEnam = (req, res) => {
    rlTigaTitikEnamHeader.findAll({
        attributes: ['id','tahun'],
        where:{
            rs_id: req.query.rsId,
            tahun: req.query.tahun
        },
        include:{
            model: rlTigaTitikEnamDetail,
            include: {
                model: jenisKegiatan,
                
            include: {
                model: jenisGroupKegiatanHeader
            },
            },
            order: [[{ model: jenisGroupKegiatanHeader }, 'no', 'DESC']]
        }
        // include:{
        //     model: rlTigaTitikEnamDetail,
        //     include: {
        //         model: jenisKegiatan
        //     }
        // },
        // order: [[{ model: rlTigaTitikEnamDetail }, 'jenis_kegiatan_id', 'ASC']]
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

export const insertDataRLTigaTitikEnam =  async (req, res) => {
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

    const transaction = await databaseSIRS.transaction()
    try {
        const resultInsertHeader = await rlTigaTitikEnamHeader.create({
            rs_id: req.user.satKerId,
            tahun: req.body.tahunDanBulan,
            user_id: req.user.id
        }, { 
            transaction: transaction 
        })

        const dataDetail = req.body.data.map((value, index) => {
            return {
                rs_id: req.user.satKerId,
                tahun: req.body.tahunDanBulan,
                rl_tiga_titik_enam_id: resultInsertHeader.id,
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

        const resultInsertDetail = await rlTigaTitikEnamDetail.bulkCreate(dataDetail, { 
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

export const updateDataRLTigaTitikEnam = async(req,res)=>{
    try{
        await rlTigaTitikEnamDetail.update(req.body,{
            where:{
                id: req.params.id
            }
        });
        res.status(200).json({message: "RL Updated"});
    }catch(error){
        console.log(error.message);
    }
}

export const deleteDataRLTigaTitikEnam = async(req, res) => {
    try {
        const count = await rlTigaTitikEnamDetail.destroy({
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

export const getRLTigaTitikEnamById = async(req,res)=>{
    rlTigaTitikEnamDetail.findOne({
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

export const getDataRLTigaTitikEnamSatuSehat = async (req, res) => {
    try {
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

        if (!/^\d{4}-\d{2}$/.test(periode)) {
            return res.status(400).json({
                status: false,
                message: "Format periode harus YYYY-MM."
            })
        }

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

        const rsId = req.query.rsId

        if (!rsId) {
            return res.status(401).json({
                status: false,
                message: "Session user tidak ditemukan."
            })
        }

        const satuSehat = await satu_sehat_id.findOne({
            where: {
                kode_baru_faskes: rsId
            },
            attributes: ["organization_id"]
        })

        if (!satuSehat) {
            return res.status(404).json({
                status: false,
                message: "OrganizationId Tidak Ada"
            })
        }

        const organization_id = satuSehat.organization_id
        const baseUrl =
            process.env.SATUSEHAT_BASE_URL ||
            'https://api-dev.dto.kemkes.go.id/fhir-sirs'
        const cleanBaseUrl = baseUrl
            .replace(/\/?v1\/rlreport\/?$/, '')
            .replace(/\/$/, '')

        const url =
            `${cleanBaseUrl}/v1/rlreport/rl36` +
            `?bulan_laporan=${encodeURIComponent(periode)}` +
            `&organization_id=${encodeURIComponent(organization_id)}`

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        })

        const raw = response?.data
        const pelayanan = raw?.data?.pelayanan_kebidanan

        if (!Array.isArray(pelayanan) || pelayanan.length === 0) {
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

        const bulan_laporan = `${periode}-01`
        let insertedCount = 0
        let updatedCount = 0
        let skippedCount = 0
        let parsedCount = 0

        for (const groupItem of pelayanan) {
            const jenis_kegiatan = (
                groupItem?.jenis_kegiatan || ''
            ).toString().trim()
            const detailKegiatan = Array.isArray(groupItem?.detail_kegiatan)
                ? groupItem.detail_kegiatan
                : []

            for (const detailItem of detailKegiatan) {
                parsedCount += 1

                const nama_kegiatan = (
                    detailItem?.nama_kegiatan || ''
                ).toString().trim()

                if (!jenis_kegiatan || !nama_kegiatan) {
                    skippedCount += 1
                    continue
                }

                const payload = {
                    bulan_laporan,
                    organization_id,
                    jenis_kegiatan,
                    nama_kegiatan,
                    rujukan_rs: Number(detailItem?.rujukan_rs ?? 0),
                    rujukan_bidan: Number(detailItem?.rujukan_bidan ?? 0),
                    rujukan_puskesmas: Number(detailItem?.rujukan_puskesmas ?? 0),
                    rujukan_faskes_lain: Number(detailItem?.rujukan_faskes_lain ?? 0),
                    non_medis: Number(detailItem?.non_medis ?? 0),
                    non_rujukan: Number(detailItem?.non_rujukan ?? 0),
                    dirujuk: Number(detailItem?.dirujuk ?? 0),
                    hidup: Number(detailItem?.hidup ?? 0),
                    mati: Number(detailItem?.mati ?? 0)
                }

                const existing = await RLTigaTitikEnamSatusehat.findOne({
                    where: {
                        bulan_laporan: payload.bulan_laporan,
                        organization_id: payload.organization_id,
                        jenis_kegiatan: payload.jenis_kegiatan,
                        nama_kegiatan: payload.nama_kegiatan
                    }
                })

                if (existing) {
                    await existing.update(payload)
                    updatedCount += 1
                } else {
                    await RLTigaTitikEnamSatusehat.create(payload)
                    insertedCount += 1
                }
            }
        }

        return res.status(200).json({
            status: true,
            message: 'success',
            meta: {
                parsed_count: parsedCount,
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
            message: 'Gagal memproses data RL 3.6 Satusehat',
            detail: err?.response?.data || err.message
        })
    }
}

export const getDataRLTigaTitikEnamSatusehatLocal = async (req, res) => {
    try {
        const where = {}

        if (req.query.bulan_laporan) {
            where.bulan_laporan = req.query.bulan_laporan
        }

        if (req.query.rsId) {
            const satuSehat = await satu_sehat_id.findOne({
                where: { kode_baru_faskes: req.query.rsId },
                attributes: ["organization_id"]
            })

            if (satuSehat) {
                where.organization_id = satuSehat.organization_id
            }
        } else if (req.query.organization_id) {
            where.organization_id = req.query.organization_id
        }

        const data = await RLTigaTitikEnamSatusehat.findAll({
            where,
            order: [
                ['jenis_kegiatan', 'ASC'],
                ['nama_kegiatan', 'ASC']
            ]
        })

        res.status(200).json({
            status: true,
            message: 'data found',
            data
        })
    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Gagal mengambil data RL 3.6 Satusehat lokal',
            detail: err.message
        })
    }
}

