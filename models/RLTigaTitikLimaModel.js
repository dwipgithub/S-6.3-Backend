import { DataTypes, QueryTypes } from "sequelize"
import { databaseSIRS } from "../config/Database.js"

export const rlTigaTitikLimaHeader = databaseSIRS.define('rl_tiga_titik_lima', 
    {
        rs_id: {
            type: DataTypes.STRING
        },
        tahun: {
            type: DataTypes.DATEONLY
        },
        user_id: {
            type: DataTypes.INTEGER
        },
    }
)

export const rlTigaTitikLimaDetail = databaseSIRS.define('rl_tiga_titik_lima_detail',{
    rs_id: {
        type: DataTypes.STRING
    },
    tahun: {
        type: DataTypes.DATEONLY
    },
    rl_tiga_titik_lima_id: {
        type: DataTypes.INTEGER
    },
    jenis_kegiatan_id: {
        type: DataTypes.INTEGER
    },
    kunjungan_pasien_dalam_kabkota_laki: {
        type: DataTypes.INTEGER
    },
    kunjungan_pasien_luar_kabkota_laki: {
        type: DataTypes.INTEGER
    },
    kunjungan_pasien_dalam_kabkota_perempuan: {
        type: DataTypes.INTEGER
    },
    kunjungan_pasien_luar_kabkota_perempuan: {
        type: DataTypes.INTEGER
    },
    total_kunjungan: {
        type: DataTypes.INTEGER
    },
    user_id: {
        type: DataTypes.INTEGER
    }
})

export const jenisKegiatan = databaseSIRS.define('jenis_kegiatan_rl_tiga_titik_lima', 
    {
        nama: {
            type: DataTypes.STRING
        }
    }
)


rlTigaTitikLimaHeader.hasMany(rlTigaTitikLimaDetail, {
    foreignKey:'rl_tiga_titik_lima_id'
})
rlTigaTitikLimaDetail.belongsTo(rlTigaTitikLimaHeader, {
    foreignKey:'id'
})

jenisKegiatan.hasMany(rlTigaTitikLimaDetail, {
    foreignKey:'id'
})
rlTigaTitikLimaDetail.belongsTo(jenisKegiatan, {
    foreignKey:'jenis_kegiatan_id'
})

export const RLTigaTitikLimaSatusehat = databaseSIRS.define(
    'rl_tiga_titik_lima_satusehat',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        bulan_laporan: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            unique: 'uq_rl35'
        },
        organization_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: 'uq_rl35'
        },
        jenis_kegiatan: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: 'uq_rl35'
        },
        kunjungan_dalam_kab_kota_laki_laki: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        kunjungan_dalam_kab_kota_perempuan: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        kunjungan_luar_kab_kota_laki_laki: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        kunjungan_luar_kab_kota_perempuan: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        total_kunjungan: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        rata_rata_kunjungan_perhari: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        tableName: 'rl_tiga_titik_lima_satusehat',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'modified_at'
    }
)
