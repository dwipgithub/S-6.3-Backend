import { databaseSIRS } from '../config/Database.js'
import { rlTigaTitikLimaHeader, rlTigaTitikLimaDetail, jenisKegiatan, RLTigaTitikLimaSatusehat } from '../models/RLTigaTitikLimaModel.js'
import Joi from 'joi'
import axios from 'axios'
import { satu_sehat_id } from '../models/UserModel.js'

export const getDataRLTigaTitikLima = (req, res) => {
    console.log(req.user)
    rlTigaTitikLimaDetail.findAll({
        where:{
            rs_id: req.query.rsId,
            tahun: req.query.tahun
        },
        include:{
            model: jenisKegiatan,
        },
        order: [['jenis_kegiatan_id', 'ASC']]
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

export const insertDataRLTigaTitikLima =  async (req, res) => {
    console.log(req.user)
    const schema = Joi.object({
        tahun: Joi.number().required(),
        tahunDanBulan: Joi.date().required(),
        data: Joi.array()
            .items(
                Joi.object().keys({
                    jenisKegiatanId: Joi.number().required(),
                    kunjungan_pasien_dalam_kabkota_laki: Joi.number().required(),
                    kunjungan_pasien_luar_kabkota_laki: Joi.number().required(),
                    kunjungan_pasien_luar_kabkota_perempuan: Joi.number().required(),
                    kunjungan_pasien_dalam_kabkota_perempuan: Joi.number().required(),
                    total_kunjungan: Joi.number().required()
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
        const resultInsertHeader = await rlTigaTitikLimaHeader.create({
            rs_id: req.user.satKerId,
            tahun: req.body.tahunDanBulan,
            user_id: req.user.id
        }, { transaction })

        const dataDetail = req.body.data.map((value, index) => {
            return {
                rs_id: req.user.satKerId,
                tahun: req.body.tahunDanBulan,
                rl_tiga_titik_lima_id: resultInsertHeader.id,
                jenis_kegiatan_id: value.jenisKegiatanId,
                kunjungan_pasien_dalam_kabkota_laki : value.kunjungan_pasien_dalam_kabkota_laki,
                kunjungan_pasien_luar_kabkota_perempuan : value.kunjungan_pasien_luar_kabkota_perempuan,
                kunjungan_pasien_dalam_kabkota_perempuan: value.kunjungan_pasien_dalam_kabkota_perempuan,
                kunjungan_pasien_luar_kabkota_laki: value.kunjungan_pasien_luar_kabkota_laki,
                total_kunjungan: value.total_kunjungan,
                user_id: req.user.id
            }
        })

        const resultInsertDetail = await rlTigaTitikLimaDetail.bulkCreate(dataDetail, { 
            transaction,
            updateOnDuplicate: [
                "kunjungan_pasien_dalam_kabkota_laki",   
                "kunjungan_pasien_luar_kabkota_laki",   
                "kunjungan_pasien_luar_kabkota_perempuan",   
                "kunjungan_pasien_dalam_kabkota_perempuan", 
                "total_kunjungan",
            ],
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
        // console.log(error)
        res.status(400).send({
            status: false,
            message: "data not created",
            error: "duplicate data"
        })
        if (transaction) {
            await transaction.rollback()
        }
    }
}

export const updateDataRLTigaTitikLima = async(req,res)=>{
    try{
        await rlTigaTitikLimaDetail.update(req.body,{
            where:{
                id: req.params.id
            }
        });
        res.status(200).json({message: "RL Updated"});
    }catch(error){
        console.log(error.message);
    }
}

export const deleteDataRLTigaTitikLima = async(req, res) => {
    try {
        const count = await rlTigaTitikLimaDetail.destroy({
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

export const getRLTigaTitikLimaById = async(req,res)=>{
    rlTigaTitikLimaDetail.findOne({
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

export const getDataRLTigaTitikLimaSatuSehat = async (req, res) => {
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

        const organizationIdFinal =
            satuSehat.organization_id?.substring(0, 9);

        console.log(
            "ORGANIZATION ID:",
            organizationIdFinal
        )
        const cleanBaseUrl = baseUrl
            .replace(/\/?v1\/rlreport\/?$/, '')
            .replace(/\/$/, '')

        const url =
            `${cleanBaseUrl}/v1/rlreport/rl35` +
            `?month=${encodeURIComponent(periode)}` +
            `&organization_id=${encodeURIComponent(organizationIdFinal)}`

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        })

        const raw = response?.data
        const candidates = [
            raw?.data?.data?.visits,
            raw?.data?.records,
            raw?.data?.data,
            raw?.data?.items,
            raw?.data,
            raw?.records,
            raw?.items,
            raw
        ]

        let items = []

        for (const candidate of candidates) {

            if (Array.isArray(candidate)) {
                items = candidate
                break
            }

            if (
                candidate &&
                Array.isArray(candidate.records)
            ) {
                items = candidate.records
                break
            }

            if (
                candidate &&
                typeof candidate === 'object' &&
                (
                    candidate.jenis_kegiatan ||
                    candidate.visits
                )
            ) {
                items = Array.isArray(candidate.visits)
                    ? candidate.visits
                    : [candidate]

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

            const organization_id = (
                item?.organization_id ??
                organizationIdFinal
            ).toString().trim()

            const jenis_kegiatan = (
                item?.jenis_kegiatan || ''
            ).toString().trim()

            if (
                !bulan_laporan ||
                !organization_id ||
                !jenis_kegiatan
            ) {
                skippedCount += 1
                continue
            }

            const payload = {
                bulan_laporan,
                organization_id,
                jenis_kegiatan,

                kunjungan_dalam_kab_kota_laki_laki:
                    Number(
                        item?.kunjungan_dalam_kab_kota?.laki_laki ?? 0
                    ),

                kunjungan_dalam_kab_kota_perempuan:
                    Number(
                        item?.kunjungan_dalam_kab_kota?.perempuan ?? 0
                    ),

                kunjungan_luar_kab_kota_laki_laki:
                    Number(
                        item?.kunjungan_luar_kab_kota?.laki_laki ?? 0
                    ),

                kunjungan_luar_kab_kota_perempuan:
                    Number(
                        item?.kunjungan_luar_kab_kota?.perempuan ?? 0
                    ),

                total_kunjungan:
                    Number(item?.total_kunjungan ?? 0),

                rata_rata_kunjungan_perhari:
                    Number(item?.rata_rata_kunjungan_perhari ?? 0)
            }

            const existing =
                await RLTigaTitikLimaSatusehat.findOne({
                    where: {
                        bulan_laporan: payload.bulan_laporan,
                        organization_id: payload.organization_id,
                        jenis_kegiatan: payload.jenis_kegiatan
                    }
                })

            if (existing) {

                await existing.update(payload)

                updatedCount += 1

            } else {

                await RLTigaTitikLimaSatusehat.create(payload)

                insertedCount += 1
            }
        }

        // =========================================
        // RESPONSE SUCCESS
        // =========================================
        return res.status(200).json({
            status: true,
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

        const statusCode =
            err?.response?.status || 500

        // =========================================
        // JIKA DATA SATUSEHAT TIDAK ADA
        // =========================================
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

        // =========================================
        // ERROR UMUM
        // =========================================
        return res.status(statusCode).json({
            status: false,
            message: 'Gagal memproses data RL 3.5 Satusehat',
            detail: err?.response?.data || err.message
        })
    }
}
