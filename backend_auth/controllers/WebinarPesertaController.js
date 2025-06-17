import WebinarPeserta from "../models/WebinarPesertaModel.js";
import Webinar from "../models/WebinarModel.js";
import { Op } from "sequelize";

// --- FUNGSI AKSES PUBLIK (PENDAFTARAN) ---

/**
 * Mendaftarkan peserta baru ke webinar.
 * Membutuhkan pengguna login untuk mendapatkan userId dari sesi/token (melalui middleware verifyUser).
 * Jika pendaftaran tidak memerlukan login, middleware verifyUser harus dihapus dari rute ini
 * dan kolom userId di WebinarPesertaModel harus allowNull: true.
 */
export const registerWebinarPeserta = async (req, res) => {
    const userId = req.userId || null;

    const {
        webinarId, // Ini diharapkan adalah UUID dari webinar
        nama,
        jenjang,
        instansi,
        jurusan,
        email,
        nomor_hp,
        alasan
    } = req.body;

    // --- Validasi Data Input Awal ---
    if (!webinarId || !nama || !jenjang || !instansi || !email || !nomor_hp || !alasan) {
        const missingFields = [];
        if (!webinarId) missingFields.push('webinarId');
        if (!nama) missingFields.push('nama');
        if (!jenjang) missingFields.push('jenjang');
        if (!instansi) missingFields.push('instansi');
        if (!email) missingFields.push('email');
        if (!nomor_hp) missingFields.push('nomor_hp');
        if (!alasan) missingFields.push('alasan');

        return res.status(400).json({
            msg: `Semua kolom wajib diisi untuk pendaftaran. Kolom yang hilang: ${missingFields.join(', ')}`
        });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ msg: "Format email tidak valid." });
    }
    if (!/^\d{10,15}$/.test(nomor_hp)) {
        return res.status(400).json({ msg: "Nomor HP tidak valid. Hanya angka dan minimal 10 digit." });
    }

    try {
        // 1. Validasi keberadaan dan status webinar
        // Cari webinar berdasarkan UUID yang diterima dari frontend (req.body.webinarId)
        const webinar = await Webinar.findOne({ where: { uuid: webinarId } });
        
        if (!webinar) {
            return res.status(404).json({ msg: `Webinar dengan ID ${webinarId} tidak ditemukan.` });
        }
        
        if (webinar.status !== 'upcoming') {
            return res.status(400).json({ msg: "Pendaftaran hanya dibuka untuk webinar yang akan datang." });
        }

        // 2. Cek apakah pengguna (berdasarkan email) sudah terdaftar untuk webinar ini
        // Gunakan webinar.uuid untuk mencocokkan dengan webinarId di WebinarPeserta
        const existingRegistration = await WebinarPeserta.findOne({
            where: {
                webinarId: webinar.uuid, // PENTING: Gunakan UUID dari webinar yang ditemukan
                email: email
            }
        });

        if (existingRegistration) {
            return res.status(409).json({ msg: `Email ${email} sudah terdaftar untuk webinar ini.` });
        }

        // 3. Buat entri pendaftaran baru di database
        await WebinarPeserta.create({
            webinarId: webinar.uuid, // PENTING: Simpan UUID dari webinar yang ditemukan ke kolom webinarId
            userId: userId,
            nama: nama,
            jenjang: jenjang,
            instansi: instansi,
            jurusan: jurusan,
            email: email,
            nomor_hp: nomor_hp,
            alasan: alasan,
            status_pendaftaran: 'terdaftar'
        });

        res.status(201).json({ msg: "Pendaftaran webinar berhasil!", webinarId: webinarId });

    } catch (error) {
        console.error("Error during webinar registration:", error);

        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ msg: "Validasi data gagal. Pastikan semua data benar dan sesuai format.", errors: errors });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ msg: "Data yang Anda masukkan sudah ada dan unik (misal: email untuk webinar ini sudah terdaftar).", error: error.message });
        }
        if (!userId && error.name === 'SequelizeForeignKeyConstraintError' && error.fields.includes('userId')) {
             return res.status(401).json({ msg: "Autentikasi gagal. Anda perlu login untuk mendaftar webinar ini." });
        }

        res.status(500).json({ msg: "Terjadi kesalahan pada server saat mendaftar webinar.", error: error.message });
    }
};

// --- FUNGSI AKSES ADMIN (membutuhkan middleware verifyUser & adminOnly) ---

/**
 * Mendapatkan semua pendaftar untuk semua webinar.
 * Mendukung filter by webinarId dan status_pendaftaran melalui query parameter.
 */
export const getAllWebinarPeserta = async (req, res) => {
    try {
        const { webinarId, status_pendaftaran } = req.query;

        console.log("Menerima permintaan getAllWebinarPeserta.");
        console.log("Filter Webinar ID dari query:", webinarId);
        console.log("Filter Status Pendaftaran dari query:", status_pendaftaran);

        let whereClause = {};

        if (webinarId && webinarId.trim() !== '') {
            // Tetap cari webinar berdasarkan UUID yang dikirim di query parameter
            const webinar = await Webinar.findOne({ where: { uuid: webinarId } });
            if (!webinar) {
                return res.status(404).json({ msg: `Webinar dengan ID ${webinarId} tidak ditemukan.` });
            }
            // Karena webinarId di WebinarPeserta sekarang menyimpan UUID, filter juga dengan UUID
            whereClause.webinarId = webinar.uuid; 
        }

        if (status_pendaftaran && status_pendaftaran.trim() !== '') {
            const validStatuses = ['pending', 'terdaftar', 'hadir', 'dibatalkan'];
            const lowerCaseStatus = status_pendaftaran.toLowerCase();
            if (!validStatuses.includes(lowerCaseStatus)) {
                return res.status(400).json({ msg: "Status pendaftaran tidak valid. Pilih antara 'pending', 'terdaftar', 'hadir', atau 'dibatalkan'." });
            }
            whereClause.status_pendaftaran = lowerCaseStatus;
        }

        const participants = await WebinarPeserta.findAll({
            where: whereClause,
            attributes: [
                'uuid', 'webinarId', 'userId', 'nama', 'jenjang',
                'instansi', 'jurusan', 'email', 'nomor_hp',
                'alasan', 'status_pendaftaran', 'createdAt', 'updatedAt'
            ],
            order: [['createdAt', 'DESC']],
            include: [{
                model: Webinar,
                attributes: ['uuid', 'judul', 'tanggal_pelaksanaan', 'jam_pelaksanaan', 'penyelenggara'],
                as: 'webinar'
            }]
        });

        if (participants.length === 0) {
            return res.status(200).json({ msg: "Tidak ada pendaftar ditemukan dengan kriteria tersebut.", data: [] });
        }

        res.status(200).json(participants);
    } catch (error) {
        console.error("Error fetching all webinar participants:", error);
        res.status(500).json({ msg: "Kesalahan server saat mengambil data peserta webinar.", error: error.message });
    }
};

/**
 * Mendapatkan detail pendaftar berdasarkan UUID pendaftaran.
 */
export const getWebinarPesertaById = async (req, res) => {
    try {
        const participant = await WebinarPeserta.findOne({
            where: {
                uuid: req.params.id
            },
            attributes: [
                'uuid', 'webinarId', 'userId', 'nama', 'jenjang',
                'instansi', 'jurusan', 'email', 'nomor_hp',
                'alasan', 'status_pendaftaran', 'createdAt', 'updatedAt'
            ],
            include: [{
                model: Webinar,
                attributes: ['uuid', 'judul', 'tanggal_pelaksanaan', 'jam_pelaksanaan', 'penyelenggara'],
                as: 'webinar'
            }]
        });
        if (!participant) {
            return res.status(404).json({ msg: "Pendaftar tidak ditemukan." });
        }
        res.status(200).json(participant);
    } catch (error) {
        console.error("Error fetching webinar participant by ID:", error);
        res.status(500).json({ msg: "Kesalahan server saat mengambil detail pendaftar webinar.", error: error.message });
    }
};

/**
 * Memperbarui status atau data pendaftar.
 * Hanya bisa diakses oleh admin.
 */
export const updateWebinarPeserta = async (req, res) => {
    const participant = await WebinarPeserta.findOne({
        where: {
            uuid: req.params.id
        }
    });
    if (!participant) {
        return res.status(404).json({ msg: "Pendaftar tidak ditemukan." });
    }

    const {
        nama,
        jenjang,
        instansi,
        jurusan,
        email,
        nomor_hp,
        alasan,
        status_pendaftaran
    } = req.body;

    if (email && !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ msg: "Format email tidak valid." });
    }
    if (nomor_hp && !/^\d{10,15}$/.test(nomor_hp)) {
        return res.status(400).json({ msg: "Nomor HP tidak valid. Hanya angka dan minimal 10 digit." });
    }
    const validStatuses = ['pending', 'terdaftar', 'hadir', 'dibatalkan'];
    if (status_pendaftaran && !validStatuses.includes(status_pendaftaran.toLowerCase())) {
        return res.status(400).json({ msg: "Status pendaftaran tidak valid. Pilih antara 'pending', 'terdaftar', 'hadir', atau 'dibatalkan'." });
    }

    try {
        await WebinarPeserta.update({
            nama, jenjang, instansi, jurusan,
            email, nomor_hp, alasan, status_pendaftaran
        }, {
            where: {
                uuid: req.params.id
            }
        });
        res.status(200).json({ msg: "Data pendaftar berhasil diperbarui." });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ msg: "Email ini sudah terdaftar untuk webinar yang sama atau data unik lainnya sudah ada." });
        }
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ msg: "Validasi data gagal. Pastikan semua data benar.", errors: errors });
        }
        console.error("Error updating webinar participant:", error);
        res.status(500).json({ msg: "Kesalahan server saat memperbarui pendaftar.", error: error.message });
    }
};

/**
 * Menghapus pendaftar berdasarkan UUID pendaftaran.
 * Hanya bisa diakses oleh admin.
 */
export const deleteWebinarPeserta = async (req, res) => {
    const participant = await WebinarPeserta.findOne({
        where: {
            uuid: req.params.id
        }
    });
    if (!participant) {
        return res.status(404).json({ msg: "Pendaftar tidak ditemukan." });
    }

    try {
        await WebinarPeserta.destroy({
            where: {
                uuid: req.params.id
            }
        });
        res.status(200).json({ msg: "Pendaftar berhasil dihapus." });
    } catch (error) {
        console.error("Error deleting webinar participant:", error);
        res.status(500).json({ msg: "Kesalahan server saat menghapus pendaftar.", error: error.message });
    }
};

/**
 * Mendapatkan daftar peserta untuk webinar tertentu (berdasarkan UUID webinar).
 * Hanya bisa diakses oleh admin.
 */
export const getPesertaByWebinarId = async (req, res) => {
    try {
        const { id: webinarUuid } = req.params; 
        const { status_pendaftaran } = req.query;

        console.log("Menerima permintaan getPesertaByWebinarId.");
        console.log("Webinar UUID dari params:", webinarUuid);
        console.log("Filter Status Pendaftaran dari query:", status_pendaftaran);

        const webinar = await Webinar.findOne({
            where: {
                uuid: webinarUuid
            }
        });

        if (!webinar) {
            return res.status(404).json({ msg: `Webinar dengan UUID ${webinarUuid} tidak ditemukan.` });
        }

        let whereClause = { webinarId: webinar.uuid }; // Gunakan UUID dari webinar yang ditemukan untuk filter

        if (status_pendaftaran && status_pendaftaran.trim() !== '') {
            const validStatuses = ['pending', 'terdaftar', 'hadir', 'dibatalkan'];
            const lowerCaseStatus = status_pendaftaran.toLowerCase();
            if (!validStatuses.includes(lowerCaseStatus)) {
                return res.status(400).json({ msg: "Status pendaftaran tidak valid. Pilih antara 'pending', 'terdaftar', 'hadir', atau 'dibatalkan'." });
            }
            whereClause.status_pendaftaran = lowerCaseStatus;
        }

        const participants = await WebinarPeserta.findAll({
            where: whereClause,
            attributes: [
                'uuid', 'userId', 'nama', 'jenjang',
                'instansi', 'jurusan', 'email', 'nomor_hp',
                'alasan', 'status_pendaftaran', 'createdAt', 'updatedAt'
            ],
            order: [['createdAt', 'DESC']],
            include: [{
                model: Webinar,
                attributes: ['uuid', 'judul', 'tanggal_pelaksanaan', 'jam_pelaksanaan', 'penyelenggara'],
                as: 'webinar'
            }]
        });

        if (participants.length === 0) {
            return res.status(200).json({ msg: "Tidak ada pendaftar ditemukan untuk webinar ini atau filter tidak cocok.", data: [] });
        }

        res.status(200).json(participants);
    } catch (error) {
        console.error("Error fetching participants for webinar:", error);
        res.status(500).json({ msg: "Kesalahan server saat mengambil daftar peserta webinar.", error: error.message });
    }
};