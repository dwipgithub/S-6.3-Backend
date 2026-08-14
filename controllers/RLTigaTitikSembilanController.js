import { databaseSIRS } from '../config/Database.js'
import { get, show, rlTigaTitikSembilan, rlTigaTitikSembilanDetail } from '../models/RLTigaTitikSembilanModel.js'
import { rlTigaTitikSembilanSatuSehat } from '../models/RLTigaTitikSembilanSatuSehatModel.js'

import Joi from 'joi'
import joiDate from "@joi/date"
import { satu_sehat_id, users_sso } from "../models/UserModel.js";
import { Sequelize } from "sequelize";

import {
  isStale,
  isSyncing39,
  doSync39,
  getLastSyncInfo39,
} from "../services/rlSync.service.js";

export const getRLTigaTitikSembilan = (req, res) => {
    const joi = Joi.extend(joiDate) 

    const schema = joi.object({
        rsId: joi.string().required(),
        periode: joi.date().format("YYYY-MM").required(),
        page: joi.number(),
        limit: joi.number()
    })

    const { error, value } = schema.validate(req.query)

    if (error) {
        return res.status(400).send({
            status: false,
            message: error.details[0].message
        })
    }

    get(req, (err, results) => {
        if (err) {
            return res.status(500).send({
                status: false,
                message: err.message || err
            })
        }
        const message = results && results.length ? 'data found' : 'data not found'
        res.status(200).send({
            status: true,
            message: message,
            data: results || []
        })
    })
}

export const showRLTigaTitikSembilan = (req, res) => {
    show(req.params.id, (err, results) => {
        if (err) {
            return res.status(422).send({
                status: false,
                message: typeof err === 'object' ? err.message : err
            })
        }

        const message = results && results.length ? 'data found' : 'data not found'
        const data = results && results.length ? results[0] : null

        return res.status(200).send({
            status: true,
            message: message,
            data: data
        })
    })
}

export const insertRLTigaTitikSembilan = async (req, res) => {
    const schema = Joi.object({
        periodeBulan: Joi.number().greater(0).less(13).required(),
        periodeTahun: Joi.number().greater(2022).required(),
        data: Joi.array()
            .items(
                Joi.object().keys({
                    jenisKegiatanId: Joi.number().required(),
                    jumlah: Joi.number().required(),
                }).required()
            ).required()
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
        return res.status(400).send({ // Diubah dari 404 ke 400 untuk error validasi input
            status: false,
            message: error.details[0].message
        })
    }

    const periodeBulan = String(req.body.periodeBulan).padStart(2, '0')
    const periodeTahun = String(req.body.periodeTahun)
    const periode = `${periodeTahun}-${periodeBulan}-01`

    const transaction = await databaseSIRS.transaction()
    try {
        const resultInsertHeader = await rlTigaTitikSembilan.create({
            rs_id: req.user.satKerId,
            periode: periode,
            user_id: req.user.id
        }, { 
            transaction: transaction
        })

        const dataDetail = req.body.data.map((value) => {
            return {
                rs_id: req.user.satKerId,
                periode: periode,
                rl_tiga_titik_sembilan_id: resultInsertHeader.id,
                jenis_kegiatan_id: value.jenisKegiatanId,
                jumlah: value.jumlah,
                user_id: req.user.id
            }
        })

        await rlTigaTitikSembilanDetail.bulkCreate(dataDetail, { 
            transaction: transaction
        })
        
        await transaction.commit()
        return res.status(201).send({
            status: true,
            message: "data created",
            data: {
                id: resultInsertHeader.id
            }
        })
    } catch (error) {
        console.error(error)
        await transaction.rollback()
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).send({
                status: false,
                message: "Duplicate Entry"
            })
        } else {
            return res.status(500).send({
                status: false,
                message: error.message || error
            })
        }
    }
}

export const updateRLTigaTitikSembilan = async (req, res) => {
    try {
        const [updatedRows] = await rlTigaTitikSembilanDetail.update(
            {
                jumlah: req.body.jumlah,
                user_id: req.user.id
            },
            {
                where: {
                    id: req.params.id,
                    rs_id: req.user.satKerId
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({
                status: false,
                message: "Data tidak ditemukan atau tidak ada perubahan"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Data berhasil diperbarui"
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

export const deleteRLTigaTitikSembilan = async (req, res) => {
    try {
        const count = await rlTigaTitikSembilanDetail.destroy({
            where: {
                id: req.params.id,
                rs_id: req.user.satKerId
            }
        })
        if (count === 0) {
            return res.status(404).send({
                status: false,
                message: "Data Not Found",
                data: {
                    'deleted_rows': count
                }
            })
        } else {
            return res.status(200).send({ // Menggunakan HTTP status 200 untuk DELETE
                status: true,
                message: "data deleted successfully",
                data: {
                    'deleted_rows': count
                }
            })
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message || error
        })
    }
}

export const getRLTigaTitikSembilanSatuSehat = async (req, res) => {
    const joi = Joi.extend(joiDate);
    const schema = joi.object({
        rsId: joi.string().required(),
        periode: joi.date().format("YYYY-MM").required(),
        page: joi.number().min(1).default(1),
        limit: joi.number().min(1).max(200).default(50),
    });

    const { error, value } = schema.validate(req.query);
    if (error)
        return res
            .status(400)
            .send({ status: false, message: error.details[0].message });

    const { rsId, periode, page, limit } = value;

    if (req.user.jenisUserId == 4 && rsId != req.user.satKerId) {
        return res
            .status(403)
            .send({ status: false, message: "Kode RS Tidak Sesuai" });
    }

    const rsIdFinal = req.user.jenisUserId == 4 ? req.user.satKerId : rsId;
    const periodeFormatted = req.query.periode; 
    const periodeShort = req.query.periode;

    const [tahunStr, bulanStr] = periodeFormatted.split('-'); 
    const bulanClean = parseInt(bulanStr, 10);

    try {
        const offset = (page - 1) * limit;

        const satuSehat = await satu_sehat_id.findOne({
            where: { kode_baru_faskes: rsIdFinal },
            attributes: ["organization_id"],
        });

        if (!satuSehat) {
            return res
                .status(404)
                .send({ status: false, message: "OrganizationId Tidak Ada" });
        }

        const organization_id = satuSehat.organization_id?.substring(0, 9);

        // PERBAIKAN: Mengganti isSyncing -> isSyncing39
        const [rows, totalRows, syncInfo, currentlySyncing] = await Promise.all([
            rlTigaTitikSembilanSatuSehat.findAll({
                where: { 
                    organization_id, 
                    bulan: bulanClean, 
                    tahun: tahunStr 
                },
                limit,
                offset,
                order: [
                    [Sequelize.literal("SUBSTRING_INDEX(jenis_kegiatan, '.', 1)"), "ASC"],
                    [Sequelize.literal("INSTR(jenis_kegiatan, '.')"), "ASC"],
                    ["jenis_kegiatan", "ASC"],
                ],
            }),
            rlTigaTitikSembilanSatuSehat.count({
                where: { 
                    organization_id, 
                    bulan: bulanClean, 
                    tahun: tahunStr 
                },
            }),
            getLastSyncInfo39(organization_id, periodeShort),
            isSyncing39(organization_id, periodeShort), // FIXED
        ]);

        return res.status(200).send({
            status: true,
            message: rows.length ? "data found" : "data not found",
            data: rows,
            pagination: {
                page,
                limit,
                totalRows,
                totalPages: Math.ceil(totalRows / limit),
            },
            sync: {
                lastSync: syncInfo?.synced_at ?? null,
                status: syncInfo?.status ?? "never",
                totalData: syncInfo?.total_data ?? 0,
                isUpdating: currentlySyncing,
            },
        });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

export const manualSyncRL39 = async (req, res) => {
    const { rsId, periode } = req.body;

    if (!rsId || !periode) {
        return res
            .status(400)
            .send({ status: false, message: "rsId dan periode wajib diisi" });
    }

    if (req.user.jenisUserId == 4 && rsId != req.user.satKerId) {
        return res
            .status(403)
            .send({ status: false, message: "Kode RS Tidak Sesuai" });
    }

    try {
        const satuSehat = await satu_sehat_id.findOne({
            where: { kode_baru_faskes: rsId },
            attributes: ["organization_id"],
        });

        if (!satuSehat) {
            return res
                .status(404)
                .send({ status: false, message: "OrganizationId Tidak Ada" });
        }

        const organization_id = satuSehat.organization_id?.substring(0, 9);

        const syncing = await isSyncing39(organization_id, periode);
        if (syncing) {
            return res
                .status(200)
                .send({ status: true, message: "Sedang dalam proses sync" });
        }

        // PERBAIKAN: Menghapus / Mengamankan notifySseClients jika tidak di-import
        doSync39(organization_id, periode)
            .then(() => {
                // Jika Anda punya helper SSE/Socket, aktifkan kembali import & panggilannya di sini
                // typeof notifySseClients === 'function' && notifySseClients(organization_id, periode);
            })
            .catch((err) => console.error("[Manual Sync Error]", err.message));

        return res.status(200).send({ status: true, message: "Sync dimulai" });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};