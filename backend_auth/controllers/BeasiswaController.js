import BeasiswaModel from "../models/BeasiswaModel.js";
import { Op } from "sequelize";
import fs from 'fs';
import path from 'path';

// Fungsi helper untuk menghapus file dari disk
const deleteFile = (filePath) => {
    // filePath yang diterima di sini diharapkan adalah path relatif dari root public directory,
    // seperti '/images/beasiswa/filename.ext'
    const absolutePath = path.join('public', filePath);

    // Verifikasi tambahan untuk mencegah penghapusan file di luar direktori yang diinginkan
    const targetDir = path.join('public', 'images', 'beasiswa');
    const resolvedPath = path.resolve(absolutePath);

    if (!resolvedPath.startsWith(path.resolve(targetDir))) {
        console.warn("Attempted to delete file outside designated image directory:", resolvedPath);
        return; // Jangan hapus jika di luar direktori yang diizinkan
    }

    if (fs.existsSync(absolutePath)) {
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete file:", absolutePath, err);
            else console.log("Deleted file:", absolutePath);
        });
    }
};

// --- MENDAPATKAN SEMUA BEASISWA (Dapat Diakses Umum/User Biasa) ---
export const getBeasiswa = async (req, res) => {
    try {
        const { kategori, jenjang, lokasi, deadline } = req.query;
        const whereClause = {};

        if (kategori) {
            whereClause.kategori = { [Op.like]: `%${kategori}%` };
        }
        if (jenjang) {
            whereClause.jenjang = { [Op.like]: `%${jenjang}%` };
        }
        if (lokasi) {
            whereClause.lokasi = { [Op.like]: `%${lokasi}%` };
        }
        if (deadline) {
            try {
                const filterDate = new Date(deadline);
                if (isNaN(filterDate.getTime())) {
                    return res.status(400).json({ msg: "Format tanggal deadline tidak valid. Gunakan format YYYY-MM-DD." });
                }
                whereClause.deadline = { [Op.gte]: filterDate };
            } catch (error) {
                console.error("Error parsing deadline date in backend:", error);
                return res.status(400).json({ msg: "Kesalahan pemrosesan tanggal deadline." });
            }
        }

        const response = await BeasiswaModel.findAll({
            where: whereClause,
            attributes: ['uuid', 'img', 'title', 'description', 'detail', 'penyelenggara', 'link', 'kategori', 'jenjang', 'lokasi', 'deadline', 'createdAt', 'updatedAt']
        });
        res.status(200).json(response);
    } catch (error) {
        console.error("Error in getBeasiswa:", error);
        res.status(500).json({ msg: error.message });
    }
};

// --- MENDAPATKAN BEASISWA BERDASARKAN ID (Dapat Diakses Umum/User Biasa) ---
export const getBeasiswaById = async (req, res) => {
    try {
        const response = await BeasiswaModel.findOne({
            where: {
                uuid: req.params.id
            },
            attributes: ['uuid', 'img', 'title', 'description', 'detail', 'penyelenggara', 'link', 'kategori', 'jenjang', 'lokasi', 'deadline', 'createdAt', 'updatedAt']
        });

        if (!response) {
            return res.status(404).json({ msg: "Beasiswa tidak ditemukan" });
        }

        res.status(200).json(response);
    } catch (error) {
        console.error("Error in getBeasiswaById:", error);
        res.status(500).json({ msg: error.message });
    }
};

// --- MEMBUAT BEASISWA BARU (Hanya Admin) ---
export const createBeasiswa = async (req, res) => {
    const { title, description, detail, kategori, jenjang, lokasi, deadline, penyelenggara, link } = req.body;

    let imgPath = null;
    if (req.file) { // Cek jika ada file yang diunggah oleh Multer
        imgPath = path.join('/images', 'beasiswa', req.file.filename).replace(/\\/g, '/'); // Simpan path relatif
    }

    // Validasi input
    // Ensure imgPath is not null for new creations if an image is required
    if (!title || !description || !detail || !kategori || !jenjang || !lokasi || !deadline || !penyelenggara || !imgPath) {
        if (req.file) {
            // Delete the uploaded file if validation fails for required fields
            deleteFile(imgPath);
        }
        return res.status(400).json({ msg: "Semua kolom wajib diisi, termasuk gambar." });
    }

    try {
        await BeasiswaModel.create({
            title: title,
            description: description,
            detail: detail,
            kategori: kategori,
            jenjang: jenjang,
            lokasi: lokasi,
            deadline: deadline,
            penyelenggara: penyelenggara,
            link: link,
            img: imgPath // Gunakan path gambar dari Multer
        });
        res.status(201).json({ msg: "Beasiswa berhasil ditambahkan" });
    } catch (error) {
        console.error("Error in createBeasiswa:", error);
        if (req.file) {
            deleteFile(imgPath);
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ msg: error.errors.map(e => e.message).join(', ') });
        }
        res.status(400).json({ msg: error.message });
    }
};

// --- MEMPERBARUI BEASISWA (Hanya Admin) ---
export const updateBeasiswa = async (req, res) => {
    const beasiswa = await BeasiswaModel.findOne({
        where: { uuid: req.params.id }
    });

    if (!beasiswa) {
        // If beasiswa not found, and a new file was uploaded, delete the new file.
        if (req.file) {
            deleteFile(path.join('/images', 'beasiswa', req.file.filename).replace(/\\/g, '/'));
        }
        return res.status(404).json({ msg: "Beasiswa tidak ditemukan" });
    }

    const { title, description, detail, kategori, jenjang, lokasi, deadline, penyelenggara, link, existingImg, removeImg } = req.body;

    let newImagePath = beasiswa.img; // Start with the existing image path from the database

    // Case 1: A new file has been uploaded
    if (req.file) {
        // Delete the old image if it exists and is different from the new one
        if (beasiswa.img) { // Only delete if an old image exists
            deleteFile(beasiswa.img);
        }
        newImagePath = path.join('/images', 'beasiswa', req.file.filename).replace(/\\/g, '/');
    }
    // Case 2: No new file, but frontend explicitly asked to remove the image
    else if (removeImg === 'true') {
        if (beasiswa.img) { // Only delete if an old image exists
            deleteFile(beasiswa.img);
        }
        newImagePath = null; // Set image in DB to null
    }
    // Case 3: No new file, no explicit removal, but frontend sent 'existingImg' (meaning keep current)
    // In this case, newImagePath already holds beasiswa.img, so no change needed.
    // If existingImg is not provided and no new file, it means imgPath will remain as beasiswa.img

    // Validasi input
    if (!title || !description || !detail || !kategori || !jenjang || !lokasi || !deadline || !penyelenggara) {
        if (req.file) {
            // If validation fails and a new file was uploaded, delete that new file.
            deleteFile(newImagePath);
        }
        return res.status(400).json({ msg: "Semua kolom wajib diisi kecuali link dan gambar." });
    }

    try {
        await BeasiswaModel.update({
            title: title,
            description: description,
            detail: detail,
            kategori: kategori,
            jenjang: jenjang,
            lokasi: lokasi,
            deadline: deadline,
            penyelenggara: penyelenggara,
            link: link,
            img: newImagePath // Use the determined image path
        }, {
            where: { uuid: beasiswa.uuid }
        });
        res.status(200).json({ msg: "Beasiswa berhasil diperbarui" });
    } catch (error) {
        console.error("Error in updateBeasiswa:", error);
        if (req.file) {
            // If an error occurs during DB update after a new file was uploaded, delete it.
            deleteFile(newImagePath);
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ msg: error.errors.map(e => e.message).join(', ') });
        }
        res.status(400).json({ msg: error.message });
    }
};

// --- MENGHAPUS BEASISWA (Hanya Admin) ---
export const deleteBeasiswa = async (req, res) => {
    const beasiswa = await BeasiswaModel.findOne({
        where: { uuid: req.params.id }
    });

    if (!beasiswa) {
        return res.status(404).json({ msg: "Beasiswa tidak ditemukan" });
    }

    try {
        // Hapus gambar terkait dari server sebelum menghapus entri database
        if (beasiswa.img) {
            deleteFile(beasiswa.img);
        }

        await BeasiswaModel.destroy({
            where: { uuid: beasiswa.uuid }
        });
        res.status(200).json({ msg: "Beasiswa berhasil dihapus" });
    } catch (error) {
        console.error("Error in deleteBeasiswa:", error);
        res.status(400).json({ msg: error.message });
    }
};