import { databaseSIRS } from '../config/Database.js'
import { rlTigaTitikEnamHeader, rlTigaTitikEnamDetail, jenisKegiatan, jenisGroupKegiatanHeader, RLTigaTitikEnamSatusehat } from '../models/RLTigaTitikEnamModel.js'
import Joi from 'joi'
import axios from 'axios'
import { satu_sehat_id } from '../models/UserModel.js'
import ExcelJS from 'exceljs'

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

        const organization_id = satuSehat.organization_id?.substring(0, 9);
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
            },
            timeout: 90000
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
        const existingRows = await RLTigaTitikEnamSatusehat.findAll({
            where: {
                bulan_laporan,
                organization_id,
            },
            attributes: ['bulan_laporan', 'organization_id', 'jenis_kegiatan', 'nama_kegiatan', 'id']
        })

        const existingMap = new Map(
            existingRows.map((row) => [`${row.jenis_kegiatan}::${row.nama_kegiatan}`, row])
        )

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

                const key = `${payload.jenis_kegiatan}::${payload.nama_kegiatan}`
                const existing = existingMap.get(key)

                if (existing) {
                    await existing.update(payload)
                    updatedCount += 1
                } else {
                    const created = await RLTigaTitikEnamSatusehat.create(payload)
                    existingMap.set(key, created)
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
                where.organization_id = satuSehat.organization_id?.substring(0, 9);
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

export const downloadRLTigaTitikEnamSatusehatExcel = async (req, res) => {
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
        const satuSehat = await satu_sehat_id.findOne({
            where: { kode_baru_faskes: value.rsId },
            attributes: ['organization_id']
        })
        const organizationId = satuSehat?.organization_id?.substring(0, 9)

        if (!organizationId) {
            return res.status(404).json({
                status: false,
                message: 'OrganizationId Tidak Ada'
            })
        }

        const data = await RLTigaTitikEnamSatusehat.findAll({
            where: {
                bulan_laporan: `${value.periode}-01`,
                organization_id: organizationId
            },
            order: [
                ['jenis_kegiatan', 'ASC'],
                ['nama_kegiatan', 'ASC']
            ]
        })
        const [tahun, bulan] = value.periode.split('-')
        const namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ][Number(bulan) - 1]
        const headers = [
            'No',
            'Kode RS',
            'Rumah Sakit',
            'Provinsi',
            'Kabupaten/Kota',
            'Jenis Kegiatan',
            'Nama Kegiatan',
            'Rujukan RS',
            'Rujukan Bidan',
            'Rujukan Puskesmas',
            'Rujukan Faskes Lain',
            'Non Medis',
            'Non Rujukan',
            'Dirujuk',
            'Hidup',
            'Mati'
        ]
        const rows = data.map((record, index) => {
            const row = record.toJSON()
            return [
                index + 1,
                String(value.kodeRS),
                value.namaRS,
                value.provinsi,
                value.kabupatenKota,
                row.jenis_kegiatan ?? '-',
                row.nama_kegiatan ?? '-',
                Number(row.rujukan_rs || 0),
                Number(row.rujukan_bidan || 0),
                Number(row.rujukan_puskesmas || 0),
                Number(row.rujukan_faskes_lain || 0),
                Number(row.non_medis || 0),
                Number(row.non_rujukan || 0),
                Number(row.dirujuk || 0),
                Number(row.hidup || 0),
                Number(row.mati || 0)
            ]
        })
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('RL 3.6 SatuSehat')
        ;[
            ['RL 3.6 KEBIDANAN- SATUSEHAT'],
            [],
            ['Periode Data'],
            [`Bulan : ${namaBulan}`],
            [`Tahun : ${tahun}`],
            [],
            headers,
            ...rows
        ].forEach((row) => worksheet.addRow(row))

        ;[8, 16, 30, 22, 24, 25, 30, 18, 18, 20, 22, 16, 18, 16, 14, 14]
            .forEach((width, index) => {
                worksheet.getColumn(index + 1).width = width
            })
        ;[1, 3, 4, 5].forEach((rowNumber) => {
            worksheet.mergeCells(rowNumber, 1, rowNumber, headers.length)
        })

        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
                cell.alignment = { vertical: 'middle', wrapText: true }

                if (rowNumber >= 7) {
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: rowNumber === 7
                            ? 'center'
                            : [2, 3, 4, 5, 6, 7].includes(columnNumber)
                                ? 'left'
                                : 'right',
                        wrapText: true
                    }
                } else {
                    cell.border = {}
                }
            })
        })

        worksheet.getRow(7).font = { bold: true }
        worksheet.getCell('A1').font = { name: 'Calibri', size: 16, bold: true }
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' }
        worksheet.getRow(1).height = 24
        ;['A3', 'A4', 'A5'].forEach((address) => {
            const cell = worksheet.getCell(address)
            cell.font = { name: 'Calibri', size: 12, bold: true }
            cell.alignment = { vertical: 'middle', horizontal: 'left' }
        })

        const buffer = await workbook.xlsx.writeBuffer()
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        res.attachment(`rl36_satusehat_${tahun}_${Number(bulan)}.xlsx`)
        return res.send(Buffer.from(buffer))
    } catch (err) {
        console.error('Gagal membuat Excel RL 3.6 Satusehat:', err)
        return res.status(500).json({
            status: false,
            message: 'Gagal membuat Excel RL 3.6 Satusehat',
            detail: err.message
        })
    }
}
