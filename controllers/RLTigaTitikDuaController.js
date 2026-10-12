import { databaseSIRS } from '../config/Database.js'
import { get, show, rlTigaTitikDuaHeader, rlTigaTitikDuaDetail, RLTigaTitikDuaSatusehat } from '../models/RLTigaTitikDuaModel.js'
import Joi from 'joi'
import joiDate from "@joi/date"
import axios from 'axios'
import { satu_sehat_id } from '../models/UserModel.js'
import ExcelJS from "exceljs"

export const getRLTigaTitikDua = (req, res) => {
    const joi = Joi.extend(joiDate) 

    const schema = joi.object({
        rsId: joi.string().required(),
        periode: joi.date().format("YYYY-M").required(),
        page: joi.number(),
        limit: joi.number()
    })

    const { error, value } =  schema.validate(req.query)

    if (error) {
        res.status(400).send({
            status: false,
            message: error.details[0].message
        })
        return
    }

    get(req, (err, results) => {
        const message = results.length ? 'data found' : 'data not found'
        res.status(200).send({
            status: true,
            message: message,
            data: results
        })
    })
}

export const showRLTigaTitikDua = (req, res) => {
    show(req.params.id, (err, results) => {
        if (err) {
            res.status(422).send({
                status: false,
                message: err
            })
            return
        }

        const message = results.length ? 'data found' : 'data not found'
        const data = results.length ? results[0] : null

        res.status(200).send({
            status: true,
            message: message,
            data: data
        })
    })
}

export const insertRLTigaTitikDua =  async (req, res) => {
    const schema = Joi.object({
        periodeBulan: Joi.number().greater(0).less(13).required(),
        periodeTahun: Joi.number().greater(2022).required(),
        data: Joi.array()
            .items(
                Joi.object().keys({
                    rlTigaTitikDuaJenisPelayananId: Joi.number().required(),
                    pasienAwalBulan: Joi.number().required(),
                    pasienMasuk: Joi.number().required(),
                    pasienPindahan: Joi.number().required(),
                    pasienDipindahkan: Joi.number().required(),
                    pasienKeluarHidup: Joi.number().required(),
                    pasienKeluarMatiKurangDari48Jam: Joi.number().required(),
                    pasienKeluarMatiLebihDariAtauSamaDengan48Jam: Joi.number().required(),
                    pasienWanitaKeluarMatiKurangDari48Jam: Joi.number().required(),
                    pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam: Joi.number().required(),
                    jumlahLamaDirawat: Joi.number().required(),
                    rincianHariPerawatanKelasVVIP: Joi.number().required(),
                    rincianHariPerawatanKelasVIP: Joi.number().required(),
                    rincianHariPerawatanKelas1: Joi.number().required(),
                    rincianHariPerawatanKelas2: Joi.number().required(),
                    rincianHariPerawatanKelas3: Joi.number().required(),
                    rincianHariPerawatanKelasKhusus: Joi.number().required(),
                    jumlahAlokasiTempatTidurAwalBulan: Joi.number().required()
                }).required()
            ).required()
    })

    const { error, value } =  schema.validate(req.body)
    if (error) {
        res.status(400).send({
            status: false,
            message: error.details[0].message
        })
        return
    }

    let errorPasienAkhirBulan = false
    let errorJumlahHariPerawatan = false
    let errorJumlahAlokasiTempatTidurAwalBulan = false
    let errorPerbandinganJumlahHariPerawatan = false
    req.body.data.forEach(element => { 
        // hitung jumlah pasien akhir bulan
        const pasienAkhirBulan = (parseInt(element.pasienAwalBulan) + parseInt(element.pasienMasuk) + parseInt(element.pasienPindahan)) -
        (parseInt(element.pasienDipindahkan) + parseInt(element.pasienKeluarHidup) + parseInt(element.pasienKeluarMatiKurangDari48Jam) + 
        parseInt(element.pasienKeluarMatiLebihDariAtauSamaDengan48Jam))

        // hitung jumlah hari perawatan
        const jumlahHariPerawatan = parseInt(element.rincianHariPerawatanKelasVVIP) +
            parseInt(element.rincianHariPerawatanKelasVIP) + 
            parseInt(element.rincianHariPerawatanKelas1) + 
            parseInt(element.rincianHariPerawatanKelas2) + 
            parseInt(element.rincianHariPerawatanKelas3) + 
            parseInt(element.rincianHariPerawatanKelasKhusus)

        const jumlahAlokasiTempatTidurAwalBulan = parseInt(element.jumlahAlokasiTempatTidurAwalBulan)

        if (pasienAkhirBulan < 0) {
            errorPasienAkhirBulan = true
        }

        if (jumlahHariPerawatan <= 0) {
            errorJumlahHariPerawatan = true
        }

        if (jumlahAlokasiTempatTidurAwalBulan <= 0) {
            errorJumlahAlokasiTempatTidurAwalBulan = true
        }

        if (element.rlTigaTitikDuaJenisPelayananId == 100) {
            errorPasienAkhirBulan = false
            errorJumlahHariPerawatan = false
            errorJumlahAlokasiTempatTidurAwalBulan = false
        }

        // if (jumlahHariPerawatan < element.jumlahLamaDirawat) {
        //     errorPerbandinganJumlahHariPerawatan = true
        // }
    })

    if (errorPasienAkhirBulan) {
        res.status(400).send({
            status: false,
            message: 'pasien akhir bulan tidak boleh kurang dari nilai 0'
        })
        return
    }

    if (errorJumlahHariPerawatan) {
        res.status(400).send({
            status: false,
            message: 'jumlah hari perawatan tidak boleh kurang dari nilai 1'
        })
        return
    }

    if (errorJumlahAlokasiTempatTidurAwalBulan) {
        res.status(400).send({
            status: false,
            message: 'jumlah alokasi tempat tidur awal bulan tidak boleh kurang dari nilai 1'
        })
        return
    }

    // if (errorPerbandinganJumlahHariPerawatan) {
    //     res.status(400).send({
    //         status: false,
    //         message: 'jumlah hari perawatan tidak boleh lebih kecil dari jumlah lama dirawat'
    //     })
    //     return
    // }

    const periodeBulan = String(req.body.periodeBulan)
    const periodeTahun = String(req.body.periodeTahun)
    const periode = periodeTahun.concat("-").concat(periodeBulan).concat("-").concat("1")

    const transaction = await databaseSIRS.transaction()
    try {
        const resultInsertHeader = await rlTigaTitikDuaHeader.create({
            rs_id: req.user.satKerId,
            periode: periode,
            user_id: req.user.id
        }, { 
            transaction: transaction
        })

        const dataDetail = req.body.data.map((value, index) => {
            return {
                rs_id: req.user.satKerId,
                periode: periode,
                rl_tiga_titik_dua_id: resultInsertHeader.id,
                rl_tiga_titik_dua_jenis_pelayanan_id: value.rlTigaTitikDuaJenisPelayananId,
                pasien_awal_bulan: value.pasienAwalBulan,
                pasien_masuk: value.pasienMasuk,
                pasien_pindahan: value.pasienPindahan,
                pasien_dipindahkan: value.pasienDipindahkan,
                pasien_keluar_hidup: value.pasienKeluarHidup,
                pasien_keluar_mati_kurang_dari_48_jam: value.pasienKeluarMatiKurangDari48Jam,
                pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam: value.pasienKeluarMatiLebihDariAtauSamaDengan48Jam,
                pasien_wanita_keluar_mati_kurang_dari_48_jam: value.pasienWanitaKeluarMatiKurangDari48Jam,
                pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam: value.pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam,
                jumlah_lama_dirawat: value.jumlahLamaDirawat,
                rincian_hari_perawatan_kelas_VVIP: value.rincianHariPerawatanKelasVVIP,
                rincian_hari_perawatan_kelas_VIP: value.rincianHariPerawatanKelasVIP,
                rincian_hari_perawatan_kelas_1: value.rincianHariPerawatanKelas1,
                rincian_hari_perawatan_kelas_2: value.rincianHariPerawatanKelas2,
                rincian_hari_perawatan_kelas_3: value.rincianHariPerawatanKelas3,
                rincian_hari_perawatan_kelas_khusus: value.rincianHariPerawatanKelasKhusus,
                jumlah_alokasi_tempat_tidur_awal_bulan: value.jumlahAlokasiTempatTidurAwalBulan,
                user_id: req.user.id
            }
        })

        await rlTigaTitikDuaDetail.bulkCreate(dataDetail, { 
            transaction: transaction
        })
        
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

export const updateRLTigaTitikDua = async(req,res)=>{
    let errorPasienAkhirBulan = false
    let errorJumlahHariPerawatan = false
    let errorJumlahAlokasiTempatTidurAwalBulan = false
    let errorPerbandinganJumlahHariPerawatan = false

    // hitung jumlah pasien akhir bulan
    const pasienAkhirBulan = (parseInt(req.body.pasienAwalBulan) + parseInt(req.body.pasienMasuk) + parseInt(req.body.pasienPindahan)) -
    (parseInt(req.body.pasienDipindahkan) + parseInt(req.body.pasienKeluarHidup) + parseInt(req.body.pasienKeluarMatiKurangDari48Jam) + 
    parseInt(req.body.pasienKeluarMatiLebihDariAtauSamaDengan48Jam))

    // hitung jumlah hari perawatan
    const jumlahHariPerawatan = parseInt(req.body.rincianHariPerawatanKelasVVIP) +
        parseInt(req.body.rincianHariPerawatanKelasVIP) + 
        parseInt(req.body.rincianHariPerawatanKelas1) + 
        parseInt(req.body.rincianHariPerawatanKelas2) + 
        parseInt(req.body.rincianHariPerawatanKelas3) + 
        parseInt(req.body.rincianHariPerawatanKelasKhusus)

    const jumlahAlokasiTempatTidurAwalBulan = parseInt(req.body.jumlahAlokasiTempatTidurAwalBulan)

    if (pasienAkhirBulan < 0) {
        errorPasienAkhirBulan = true
    }

    if (jumlahHariPerawatan <= 0) {
        errorJumlahHariPerawatan = true
    }

    if (jumlahAlokasiTempatTidurAwalBulan <= 0) {
        errorJumlahAlokasiTempatTidurAwalBulan = true
    }

    if (jumlahHariPerawatan < req.body.jumlahLamaDirawat) {
        errorPerbandinganJumlahHariPerawatan = true
    }

    if (errorPasienAkhirBulan) {
        res.status(400).send({
            status: false,
            message: 'pasien akhir bulan tidak boleh kurang dari nilai 0'
        })
        return
    }

    if (errorJumlahHariPerawatan) {
        res.status(400).send({
            status: false,
            message: 'jumlah hari perawatan tidak boleh kurang dari nilai 1'
        })
        return
    }

    if (errorJumlahAlokasiTempatTidurAwalBulan) {
        res.status(400).send({
            status: false,
            message: 'jumlah alokasi tempat tidur awal bulan tidak boleh kurang dari nilai 1'
        })
        return
    }

    if (errorPerbandinganJumlahHariPerawatan) {
        res.status(400).send({
            status: false,
            message: 'jumlah hari perawatan tidak boleh lebih kecil dari jumlah lama dirawat'
        })
        return
    }

    try{
        const update = await rlTigaTitikDuaDetail.update(
            {
                pasien_awal_bulan: req.body.pasienAwalBulan,
                pasien_masuk: req.body.pasienMasuk,
                pasien_pindahan: req.body.pasienPindahan,
                pasien_dipindahkan: req.body.pasienDipindahkan,
                pasien_keluar_hidup: req.body.pasienKeluarHidup,
                pasien_keluar_mati_kurang_dari_48_jam: req.body.pasienKeluarMatiKurangDari48Jam,
                pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam: req.body.pasienKeluarMatiLebihDariAtauSamaDengan48Jam,
                pasien_wanita_keluar_mati_kurang_dari_48_jam: req.body.pasienWanitaKeluarMatiKurangDari48Jam,
                pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam: req.body.pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam,
                jumlah_lama_dirawat: req.body.jumlahLamaDirawat,
                rincian_hari_perawatan_kelas_VVIP: req.body.rincianHariPerawatanKelasVVIP,
                rincian_hari_perawatan_kelas_VIP: req.body.rincianHariPerawatanKelasVIP,
                rincian_hari_perawatan_kelas_1: req.body.rincianHariPerawatanKelas1,
                rincian_hari_perawatan_kelas_2: req.body.rincianHariPerawatanKelas2,
                rincian_hari_perawatan_kelas_3: req.body.rincianHariPerawatanKelas3,
                rincian_hari_perawatan_kelas_khusus: req.body.rincianHariPerawatanKelasKhusus,
                jumlah_alokasi_tempat_tidur_awal_bulan: req.body.jumlahAlokasiTempatTidurAwalBulan,
                user_id: req.user.id
            },
            {
                where:{
                    id: req.params.id,
                    rs_id: req.user.satKerId
            }
        });
        
        res.status(200).json({
            status: true,
            message: update
        });
    }catch(error){
        console.log(error.message);
    }
}

export const deleteRLTigaTitikDua = async(req, res) => {
    try {
        const count = await rlTigaTitikDuaDetail.destroy({
            where: {
                id: req.params.id,
                rs_id: req.user.satKerId
            }
        })
        if (count == 0) {
            res.status(404).send({
                status: true,
                message: "Data Not Found",
                data: {
                    'deleted_rows': count
                }
            })
        } else {
            res.status(201).send({
                status: true,
                message: "data deleted successfully",
                data: {
                    'deleted_rows': count
                }
            })
        }
    } catch (error) {
        res.status(404).send({
            status: false,
            message: error
        })
    }
}

export const getDataRLTigaTitikDuaSatuSehat = async (req, res) => {
    try {

        const toMonthDate = (value, fallbackPeriode) => {

            const raw = (value ?? fallbackPeriode ?? '')
                .toString()
                .trim()

            const match = raw.match(
                /^(\d{4})-(\d{2})(?:-(\d{2}))?/
            )

            if (!match) return null

            const month = Number(match[2])

            if (
                !Number.isFinite(month) ||
                month < 1 ||
                month > 12
            ) {
                return null
            }

            return `${match[1]}-${match[2]}`
        }

        const bulan_laporan_param = (
            req.query.bulan_laporan ||
            req.query.periode ||
            req.query.month ||
            ''
        ).toString().trim()

        if (!bulan_laporan_param) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'periode' wajib diisi."
            })
        }

        const isValidPeriode =
            /^\d{4}-\d{2}$/.test(bulan_laporan_param)

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

        const koders = req.query.rsId

        if (!koders) {
            return res.status(401).json({
                status: false,
                message: "Session user tidak ditemukan."
            })
        }

        const satuSehat =
            await satu_sehat_id.findOne({
                where: {
                    kode_baru_faskes: koders
                },
                attributes: ['organization_id']
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
            `${cleanBaseUrl}/v1/rlreport/rl32` +
            `?organization_id=${encodeURIComponent(organizationIdFinal)}` +
            `&bulan_laporan=${encodeURIComponent(bulan_laporan_param)}`

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        })

        const raw = response?.data

        const candidates = [
            raw?.data?.data?.daftar_jenis_pelayanan,
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
                    candidate.jenis_pelayanan ||
                    candidate.daftar_jenis_pelayanan
                )
            ) {
                items = Array.isArray(candidate.daftar_jenis_pelayanan)
                    ? candidate.daftar_jenis_pelayanan
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
                message:
                    'Data belum tersedia untuk periode ini.',
                meta: {
                    parsed_count: 0,
                    inserted_count: 0,
                    updated_count: 0,
                    skipped_count: 0
                },
                data: {
                    daftar_jenis_pelayanan: []
                }
            })
        }

        // =========================================
        // SIMPAN / UPDATE DATABASE
        // =========================================
        let insertedCount = 0
        let updatedCount = 0
        let skippedCount = 0

        for (const item of items) {

            const bulan_laporan =
                toMonthDate(
                    item?.bulan_laporan || raw?.data?.bulan_laporan,
                    bulan_laporan_param
                )

            const organization_id = (
                item?.organization_id ??
                raw?.data?.organization_id ??
                organizationIdFinal
            ).toString().trim()

            const jenis_pelayanan = (
                item?.jenis_pelayanan || ''
            ).toString().trim()

            const code = (
                item?.code ??
                item?.kode ??
                item?.jenis_pelayanan_code ??
                ''
            ).toString().trim()

            if (
                !bulan_laporan ||
                !organization_id ||
                !jenis_pelayanan ||
                !code
            ) {
                skippedCount += 1
                continue
            }

            const payload = {

                bulan_laporan,
                organization_id,
                jenis_pelayanan,
                code,

                pasien_awal_bulan:
                    Number(
                        item?.pasien_awal_bulan ?? 0
                    ),

                pasien_masuk:
                    Number(
                        item?.pasien_masuk ?? 0
                    ),

                pasien_pindahan:
                    Number(
                        item?.pasien_pindahan ?? 0
                    ),

                pasien_dipindahkan:
                    Number(
                        item?.pasien_dipindahkan ?? 0
                    ),

                pasien_keluar_hidup:
                    Number(
                        item?.pasien_keluar_hidup ?? 0
                    ),

                mati_lk_kurang_48_jam:
                    Number(
                        item?.pasien_keluar_mati
                            ?.laki_laki
                            ?.kurang_48_jam ?? 0
                    ),

                mati_lk_lebih_sama_48_jam:
                    Number(
                        item?.pasien_keluar_mati
                            ?.laki_laki
                            ?.lebih_sama_48_jam ?? 0
                    ),

                mati_pr_kurang_48_jam:
                    Number(
                        item?.pasien_keluar_mati
                            ?.perempuan
                            ?.kurang_48_jam ?? 0
                    ),

                mati_pr_lebih_sama_48_jam:
                    Number(
                        item?.pasien_keluar_mati
                            ?.perempuan
                            ?.lebih_sama_48_jam ?? 0
                    ),

                jumlah_lama_dirawat:
                    Number(
                        item?.jumlah_lama_dirawat ?? 0
                    ),

                pasien_akhir_bulan:
                    Number(
                        item?.pasien_akhir_bulan ?? 0
                    ),

                jumlah_hari_perawatan:
                    Number(
                        item?.jumlah_hari_perawatan ?? 0
                    ),

                hari_vvip:
                    Number(
                        item?.rincian_hari_perawatan_per_kelas?.VVIP ?? 0
                    ),

                hari_vip:
                    Number(
                        item?.rincian_hari_perawatan_per_kelas?.VIP ?? 0
                    ),

                hari_kelas_1:
                    Number(
                        item?.rincian_hari_perawatan_per_kelas?.I ?? 0
                    ),

                hari_kelas_2:
                    Number(
                        item?.rincian_hari_perawatan_per_kelas?.II ?? 0
                    ),

                hari_kelas_3:
                    Number(
                        item?.rincian_hari_perawatan_per_kelas?.III ?? 0
                    ),

                hari_kelas_khusus:
                    Number(
                        item?.rincian_hari_perawatan_per_kelas?.kelas_khusus ?? 0
                    ),

                alokasi_tempat_tidur_awal_bulan:
                    Number(
                        item?.alokasi_tempat_tidur_awal_bulan ?? 0
                    )
            }

            const existing =
                await RLTigaTitikDuaSatusehat.findOne({
                    where: {
                        bulan_laporan:
                            payload.bulan_laporan,
                        organization_id:
                            payload.organization_id,
                        jenis_pelayanan:
                            payload.jenis_pelayanan,
                        code:
                            payload.code
                    }
                })

            if (existing) {

                await existing.update(payload)

                updatedCount += 1

            } else {

                await RLTigaTitikDuaSatusehat.create(payload)

                insertedCount += 1
            }
        }

        const bulan_laporan_key =
            toMonthDate(
                raw?.data?.bulan_laporan,
                bulan_laporan_param
            ) || bulan_laporan_param

        const savedRows =
            await RLTigaTitikDuaSatusehat.findAll({
                where: {
                    bulan_laporan: bulan_laporan_key,
                    organization_id: organizationIdFinal
                },
                order: [
                    ['jenis_pelayanan', 'ASC']
                ]
            })

        return res.status(200).json({
            status: true,
            meta: {
                parsed_count: items.length,
                inserted_count: insertedCount,
                updated_count: updatedCount,
                skipped_count: skippedCount
            },
            data: {
                daftar_jenis_pelayanan:
                    savedRows.map((row) => row.toJSON())
            }
        })

    } catch (err) {

        console.error(err)

        const statusCode =
            err?.response?.status || 500

        if (statusCode === 404) {

            return res.status(200).json({
                status: true,
                message:
                    'Data belum tersedia untuk periode ini.',
                meta: {
                    parsed_count: 0,
                    inserted_count: 0,
                    updated_count: 0,
                    skipped_count: 0
                },
                data: {
                    daftar_jenis_pelayanan: []
                }
            })
        }

        return res.status(statusCode).json({
            status: false,
            message:
                'Gagal memproses data RL 3.2 Satusehat',
            detail:
                err?.response?.data || err.message
        })
    }
}

export const getDataRLTigaTitikDuaSatusehatLocal = async (req, res) => {
    try {
        const bulan_laporan = (
            req.query.bulan_laporan ||
            req.query.periode ||
            req.query.month_year ||
            ''
        ).toString().trim()

        if (!bulan_laporan) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'bulan_laporan' wajib diisi."
            })
        }

        if (!/^\d{4}-\d{2}$/.test(bulan_laporan)) {
            return res.status(400).json({
                status: false,
                message: "Format bulan_laporan harus YYYY-MM."
            })
        }

        const rsId = (req.query.rsId || '').toString().trim()

        if (!rsId) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'rsId' wajib diisi."
            })
        }

        const satuSehat = await satu_sehat_id.findOne({
            where: {
                kode_baru_faskes: rsId
            },
            attributes: ['organization_id']
        })

        if (!satuSehat) {
            return res.status(404).json({
                status: false,
                message: "OrganizationId Tidak Ada"
            })
        }

        const organization_id = satuSehat.organization_id?.substring(0, 9)

        const data = await RLTigaTitikDuaSatusehat.findAll({
            where: {
                bulan_laporan,
                organization_id
            },
            order: [['jenis_pelayanan', 'ASC']]
        })

        return res.status(200).json({
            status: true,
            message: data.length ? 'data found' : 'data not found',
            data: data.map((row) => row.toJSON())
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Gagal mengambil data RL 3.2 Satusehat lokal",
            detail: error.message
        })
    }
}

export const downloadRLTigaTitikDuaSatusehatExcel = async (req, res) => {
    const schema = Joi.object({
        rsId: Joi.string().trim().required(),
        periode: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required(),
        kodeRS: Joi.alternatives()
            .try(Joi.string().max(255), Joi.number().integer().min(0))
            .required(),
        namaRS: Joi.string().max(255).required(),
        provinsi: Joi.string().max(255).required(),
        kabupatenKota: Joi.string().max(255).required()
    })
    const { error, value } = schema.validate(req.body)

    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message
        })
    }

    try {
        const kodeRS = String(value.kodeRS)
        const satuSehat = await satu_sehat_id.findOne({
            where: {
                kode_baru_faskes: value.rsId
            },
            attributes: ['organization_id']
        })

        if (!satuSehat) {
            return res.status(404).json({
                status: false,
                message: "OrganizationId Tidak Ada"
            })
        }

        const organization_id = satuSehat.organization_id?.substring(0, 9)
        const data = await RLTigaTitikDuaSatusehat.findAll({
            where: {
                bulan_laporan: value.periode,
                organization_id
            },
            order: [['jenis_pelayanan', 'ASC']]
        })

        const namaBulan = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ][Number(value.periode.slice(5, 7)) - 1]
        const tahunData = value.periode.slice(0, 4)
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet("data RL 32 Satusehat")
        const titleAndMetadata = [
            ["RL 3.2 RAWAT INAP - SATUSEHAT"],
            [],
            ["Periode Data"],
            [`Bulan : ${namaBulan}`],
            [`Tahun: ${tahunData}`],
            []
        ]
        const tableHeader = [
            [
                "No", "Kode RS", "Rumah Sakit", "Provinsi", "Kabupaten/Kota",
                "Jenis Pelayanan", "Pasien Awal Bulan", "Pasien Masuk",
                "Pasien Pindahan", "Pasien Dipindahkan", "Pasien Keluar Hidup",
                "Pasien Pria Keluar Mati", "", "Pasien Wanita Keluar Mati", "",
                "Jumlah Lama Dirawat", "Pasien Akhir Bulan", "Jumlah Hari Perawatan",
                "Rincian Hari Perawatan", "", "", "", "", "", "TT Awal"
            ],
            [
                "", "", "", "", "", "", "", "", "", "", "", "<48 jam",
                ">=48 jam", "<48 jam", ">=48 jam", "", "", "", "VVIP", "VIP",
                "1", "2", "3", "Khusus", ""
            ]
        ]
        const tableBody = data.map((row, index) => {
            const valueRow = row.toJSON()
            return [
                index + 1,
                kodeRS,
                value.namaRS,
                value.provinsi,
                value.kabupatenKota,
                valueRow.nama_jenis_pelayanan || valueRow.jenis_pelayanan || "-",
                valueRow.pasien_awal_bulan || 0,
                valueRow.pasien_masuk || 0,
                valueRow.pasien_pindahan || 0,
                valueRow.pasien_dipindahkan || 0,
                valueRow.pasien_keluar_hidup || 0,
                valueRow.mati_lk_kurang_48_jam || 0,
                valueRow.mati_lk_lebih_sama_48_jam || 0,
                valueRow.mati_pr_kurang_48_jam || 0,
                valueRow.mati_pr_lebih_sama_48_jam || 0,
                valueRow.jumlah_lama_dirawat || 0,
                valueRow.pasien_akhir_bulan || 0,
                valueRow.jumlah_hari_perawatan || 0,
                valueRow.hari_vvip || 0,
                valueRow.hari_vip || 0,
                valueRow.hari_kelas_1 || 0,
                valueRow.hari_kelas_2 || 0,
                valueRow.hari_kelas_3 || 0,
                valueRow.hari_kelas_khusus || 0,
                valueRow.alokasi_tempat_tidur_awal_bulan || 0
            ]
        })
        const lastDataRowIndex = titleAndMetadata.length + tableHeader.length + tableBody.length

        ;[...titleAndMetadata, ...tableHeader, ...tableBody].forEach((row) => worksheet.addRow(row))

        ;[
            "A1:Y1", "A3:Y3", "A4:Y4", "A5:Y5",
            "A7:A8", "B7:B8", "C7:C8", "D7:D8", "E7:E8", "F7:F8",
            "G7:G8", "H7:H8", "I7:I8", "J7:J8", "K7:K8",
            "L7:M7", "N7:O7", "P7:P8", "Q7:Q8", "R7:R8",
            "S7:X7"
        ].forEach((range) => worksheet.mergeCells(range))
        worksheet.mergeCells(7, 25, 8, 25)

        worksheet.columns = [
            { width: 8 }, { width: 16 }, { width: 30 }, { width: 22 },
            { width: 24 }, { width: 25 }, ...Array(19).fill({ width: 18 })
        ]

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 7 && rowNumber <= lastDataRowIndex) {
                row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
                    cell.alignment = {
                        vertical: "middle",
                        horizontal: rowNumber === 7 || rowNumber === 8
                            ? "center"
                            : [2, 3, 4, 5, 6].includes(columnNumber)
                                ? "left"
                                : "right",
                        wrapText: true
                    }
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" }
                    }
                })
            }
        })

        worksheet.getRow(7).font = { bold: true }
        worksheet.getRow(8).font = { bold: true }
        const titleCell = worksheet.getCell("A1")
        titleCell.font = { name: "Calibri", size: 16, bold: true }
        titleCell.alignment = { vertical: "middle", horizontal: "left" }
        worksheet.getRow(1).height = 24

        ;["A3", "A4", "A5"].forEach((address) => {
            const cell = worksheet.getCell(address)
            cell.font = { name: "Calibri", size: 12, bold: true }
            cell.alignment = { vertical: "middle", horizontal: "left" }
        })

        const buffer = await workbook.xlsx.writeBuffer()
        const safeRsId = value.rsId.replace(/[^A-Za-z0-9_-]/g, "") || "rs"
        const fileName = `rl32_satusehat_${safeRsId}_${value.periode}-01.xlsx`
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res.attachment(fileName)
        return res.send(Buffer.from(buffer))
    } catch (error) {
        console.error("Gagal membuat Excel RL 3.2 Satusehat:", error)
        return res.status(500).json({
            status: false,
            message: "Gagal membuat Excel RL 3.2 Satusehat",
            detail: error.message
        })
    }
}
