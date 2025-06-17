import { DataTypes } from 'sequelize';
import db from '../config/Database.js'; // Pastikan path ini benar untuk koneksi database Anda

const WebinarPeserta = db.define('webinar_peserta', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    uuid: {
        type: DataTypes.STRING, 
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true
    },
    webinarId: {
        type: DataTypes.STRING, 
        allowNull: false,
        references: {
            model: 'webinar', // Nama tabel yang dirujuk (pastikan sudah ada)
            key: 'uuid'      // Nama kolom primary key di tabel webinar
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    userId: {
        type: DataTypes.INTEGER, 
        allowNull: true,
        references: {
            model: 'users', // Nama tabel yang dirujuk (pastikan sudah ada)
            key: 'id'      // Nama kolom primary key di tabel users
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Nama tidak boleh kosong"
            }
        }
    },
    jenjang: { 
        type: DataTypes.ENUM('SMA/SMK', 'D3', 'S1', 'S2', 'S3'), 
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Jenjang pendidikan tidak boleh kosong"
            },
            isIn: {
                args: [['SMA/SMK', 'D3', 'S1', 'S2', 'S3']], 
                msg: "Jenjang pendidikan tidak valid"
            }
        }
    },
    instansi: { 
        type: DataTypes.ENUM(
            'Universitas Indonesia',
            'Institut Teknologi Bandung',
            'Universitas Gadjah Mada'
        ), 
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Instansi pendidikan tidak boleh kosong"
            },
            isIn: {
                args: [[
                    'Universitas Indonesia',
                    'Institut Teknologi Bandung',
                    'Universitas Gadjah Mada'
                ]], 
                msg: "Instansi pendidikan tidak valid"
            }
        }
    },
    jurusan: {
        type: DataTypes.ENUM(
            'Teknik Informatika',
            'Sistem Informasi',
            'Ilmu Komputer',
            'Manajemen'
        ), 
        allowNull: true, 
        validate: {
            isIn: {
                args: [[
                    'Teknik Informatika',
                    'Sistem Informasi',
                    'Ilmu Komputer',
                    'Manajemen'
                ]],
                msg: "Jurusan tidak valid"
            }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
        validate: {
            notEmpty: {
                msg: "Email tidak boleh kosong"
            },
            isEmail: {
                msg: "Format email tidak valid"
            }
        }
    },
    nomor_hp: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: {
                args: /^[0-9]{10,15}$/,
                msg: "Nomor HP tidak valid"
            }
        }
    },
    alasan: { 
        type: DataTypes.TEXT,
        allowNull: true
    },
    status_pendaftaran: {
        type: DataTypes.ENUM('pending', 'terdaftar', 'hadir', 'dibatalkan'),
        allowNull: false,
        defaultValue: 'terdaftar',
        validate: {
            isIn: {
                args: [['pending', 'terdaftar', 'hadir', 'dibatalkan']],
                msg: "Status pendaftaran tidak valid"
            }
        }
    }
}, {
    freezeTableName: true
});

export default WebinarPeserta;