import Mentoring from "../models/MentoringModel.js";
import User from "../models/UserModel.js";
import fs from 'fs';
import path from 'path';

// --- Fungsi untuk Admin (Create, Update, Delete) ---

export const createMentoring = async (req, res) => {
    // Multer (uploadMentorPicture) akan menjalankan tugasnya sebelum fungsi ini dipanggil.
    // Jika ada error upload dari Multer, ia akan ditangkap oleh middleware penanganan error atau langsung direspon oleh Multer.
    // Jika berhasil, req.file dan req.body sudah tersedia.

    const { judul, deskripsi, namaMentor, keahlianMentor, jumlahPeserta, statusMentoring, kategoriMentoring, link } = req.body;

    let fotoMentor = null;
    if (req.file) {
        // req.file akan tersedia jika Multer berhasil mengunggah file
        fotoMentor = `/images/mentors/${req.file.filename}`;
    }

    try {
        await Mentoring.create({
            judul: judul,
            deskripsi: deskripsi,
            namaMentor: namaMentor,
            keahlianMentor: keahlianMentor,
            fotoMentor: fotoMentor,
            jumlahPeserta: jumlahPeserta,
            statusMentoring: statusMentoring,
            kategoriMentoring: kategoriMentoring,
            link: link,
            userId: req.userId // Pastikan req.userId tersedia dari middleware autentikasi Anda
        });
        res.status(201).json({ msg: "Sesi mentoring berhasil ditambahkan!" });
    } catch (error) {
        // Jika ada error database setelah file diunggah, hapus file yang sudah terunggah
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Error creating mentoring:", error);
        res.status(400).json({ msg: error.message });
    }
};

export const updateMentoring = async (req, res) => {
    // Multer (uploadMentorPicture) akan menjalankan tugasnya sebelum fungsi ini dipanggil.
    try {
        const mentoring = await Mentoring.findOne({
            where: { uuid: req.params.id }
        });
        if (!mentoring) {
            // Jika sesi mentoring tidak ditemukan, hapus file baru jika ada
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ msg: "Sesi mentoring tidak ditemukan" });
        }

        const { judul, deskripsi, namaMentor, keahlianMentor, jumlahPeserta, statusMentoring, kategoriMentoring, removePicture } = req.body;
        let updatedFields = {
            judul: judul,
            deskripsi: deskripsi,
            namaMentor: namaMentor,
            keahlianMentor: keahlianMentor,
            jumlahPeserta: jumlahPeserta,
            statusMentoring: statusMentoring,
            kategoriMentoring: kategoriMentoring
        };

        // Logika update atau hapus gambar mentor
        if (req.file) {
            // Ada file baru yang diunggah
            if (mentoring.fotoMentor) {
                // Hapus gambar lama jika ada
                const oldImagePath = path.join('public', mentoring.fotoMentor);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updatedFields.fotoMentor = `/images/mentors/${req.file.filename}`;
        } else if (removePicture === 'true') { // Cek flag removePicture dari frontend
            // Jika frontend meminta penghapusan gambar dan tidak ada file baru
            if (mentoring.fotoMentor) {
                const oldImagePath = path.join('public', mentoring.fotoMentor);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updatedFields.fotoMentor = null; // Set fotoMentor menjadi null di database
        }
        // Jika tidak ada file baru dan removePicture bukan 'true', fotoMentor tidak berubah

        await Mentoring.update(updatedFields, {
            where: { uuid: req.params.id }
        });
        res.status(200).json({ msg: "Sesi mentoring berhasil diperbarui!" });
    } catch (error) {
        // Hapus file baru jika ada error database
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Error updating mentoring:", error);
        res.status(400).json({ msg: error.message });
    }
};

export const deleteMentoring = async (req, res) => {
    try {
        const mentoring = await Mentoring.findOne({
            where: {
                uuid: req.params.id
            }
        });
        if (!mentoring) return res.status(404).json({ msg: "Sesi mentoring tidak ditemukan" });

        if (mentoring.fotoMentor) {
            const imagePath = path.join('public', mentoring.fotoMentor);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Mentoring.destroy({
            where: {
                uuid: req.params.id
            }
        });
        res.status(200).json({ msg: "Sesi mentoring berhasil dihapus!" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// --- Fungsi untuk Semua Pengguna (Admin & User) - Melihat ---
// Fungsi getMentoring dan getMentoringById tidak perlu diubah
export const getMentoring = async (req, res) => {
    try {
        const response = await Mentoring.findAll({
            attributes: [
                'uuid', 'judul', 'deskripsi', 'namaMentor', 'keahlianMentor',
                'fotoMentor', 'jumlahPeserta', 'statusMentoring', 'kategoriMentoring', 'link',
                'createdAt'
            ],
            include: [{
                model: User,
                as: 'creator',
                attributes: ['uuid', 'name', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(response);
    } catch (error) {
        console.error("Error in getMentoring:", error);
        res.status(500).json({ msg: error.message });
    }
};

export const getMentoringById = async (req, res) => {
    try {
        const mentoring = await Mentoring.findOne({
            attributes: [
                'uuid', 'judul', 'deskripsi', 'namaMentor', 'keahlianMentor',
                'fotoMentor', 'jumlahPeserta', 'statusMentoring', 'kategoriMentoring', 'link',
                'createdAt'
            ],
            where: {
                uuid: req.params.id
            },
            include: [{
                model: User,
                as: 'creator',
                attributes: ['uuid', 'name', 'role']
            }]
        });
        if (!mentoring) return res.status(404).json({ msg: "Sesi mentoring tidak ditemukan" });
        res.status(200).json(mentoring);
    } catch (error) {
        console.error("Error in getMentoringById:", error);
        res.status(500).json({ msg: error.message });
    }
};

// --- Fungsi untuk User (Join Mentoring) ---
export const joinMentoring = async (req, res) => {
    try {
        const mentoring = await Mentoring.findOne({
            attributes: ["uuid", "judul", "namaMentor", "statusMentoring", "jumlahPeserta", "link"],
            where: {
                uuid: req.params.id,
            },
        });

        if (!mentoring) {
            return res.status(404).json({ msg: "Sesi mentoring tidak ditemukan." });
        }

        if (mentoring.statusMentoring === "Penuh") {
            return res.status(400).json({ msg: "Sesi mentoring ini sudah penuh." });
        }

        res.status(200).json({
            msg: `Anda berhasil menyatakan minat untuk bergabung dengan sesi mentoring "${mentoring.judul}" bersama ${mentoring.namaMentor}. Silakan bergabung melalui link: ${mentoring.link}`,
            mentoring: mentoring,
        });
    } catch (error) {
        console.error("Kesalahan saat mencoba bergabung dengan mentoring:", error);
        res.status(500).json({ msg: error.message || "Terjadi kesalahan server." });
    }
};