// controllers/UserProfileController.js
import { UserModel } from "../models/index.js"; // Pastikan path import UserModel sudah benar
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

// Dapatkan __filename dan __dirname untuk Node.js ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direktori publik tempat gambar akan disimpan dan disajikan
// Pastikan folder 'public' ini ada di root project backend Anda
const PUBLIC_DIR = path.join(__dirname, '../public');
const PROFILE_IMAGE_DIR = path.join(PUBLIC_DIR, 'profiles'); // Folder untuk foto profil
const COVER_IMAGE_DIR = path.join(PUBLIC_DIR, 'covers');   // Folder untuk foto sampul

// Pastikan direktori ada (Synchronous untuk memastikan folder siap saat server start)
// Ini akan membuat folder jika belum ada
try {
    if (!fs.existsSync(PROFILE_IMAGE_DIR)) {
        fs.mkdirSync(PROFILE_IMAGE_DIR, { recursive: true });
        console.log(`Direktori dibuat: ${PROFILE_IMAGE_DIR}`);
    }
    if (!fs.existsSync(COVER_IMAGE_DIR)) {
        fs.mkdirSync(COVER_IMAGE_DIR, { recursive: true });
        console.log(`Direktori dibuat: ${COVER_IMAGE_DIR}`);
    }
} catch (err) {
    console.error("Gagal membuat direktori upload:", err);
    // Mungkin keluar dari aplikasi jika tidak bisa membuat direktori penting
    // process.exit(1);
}

// Helper untuk menghapus file lama
const deleteFile = (fileName) => {
    if (!fileName) {
        console.log("Tidak ada nama file yang diberikan untuk dihapus.");
        return; // Tidak ada file untuk dihapus
    }

    const fullPathProfile = path.join(PROFILE_IMAGE_DIR, fileName);
    const fullPathCover = path.join(COVER_IMAGE_DIR, fileName);

    let fileDeleted = false;

    // Coba hapus dari direktori profil
    if (fs.existsSync(fullPathProfile)) {
        try {
            fs.unlinkSync(fullPathProfile);
            console.log(`File profil lama dihapus: ${fullPathProfile}`);
            fileDeleted = true;
        } catch (err) {
            console.error(`Gagal menghapus file profil lama ${fullPathProfile}:`, err);
        }
    }

    // Jika tidak ditemukan di profil atau gagal dihapus, coba dari direktori sampul
    if (!fileDeleted && fs.existsSync(fullPathCover)) {
        try {
            fs.unlinkSync(fullPathCover);
            console.log(`File sampul lama dihapus: ${fullPathCover}`);
            fileDeleted = true;
        } catch (err) {
            console.error(`Gagal menghapus file sampul lama ${fullPathCover}:`, err);
        }
    }

    if (!fileDeleted) {
        console.warn(`File '${fileName}' tidak ditemukan di direktori profiles atau covers untuk dihapus.`);
    }
};


// Mendapatkan data profil user yang sedang login
export const getUserProfile = async (req, res) => {
    try {
        // Log ini sangat membantu untuk debugging sesi
        console.log("GET /profile: Sesi Pengguna:", req.session);
        console.log("GET /profile: UserID dari Sesi:", req.session.userId);

        if (!req.session.userId) {
            console.warn("GET /profile: Tidak terautentikasi: UserID tidak ditemukan di sesi.");
            return res.status(401).json({ msg: "Tidak terautentikasi: UserID tidak ditemukan di sesi." });
        }

        const user = await UserModel.findOne({
            attributes: { exclude: ['password'] }, // Jangan sertakan password
            where: {
                id: req.session.userId
            }
        });

        if (!user) {
            console.warn(`GET /profile: User dengan ID ${req.session.userId} tidak ditemukan di database.`);
            return res.status(404).json({ msg: "User tidak ditemukan di database." });
        }

        const profileImageUrl = user.foto_profile ? `${req.protocol}://${req.get('host')}/profiles/${user.foto_profile}` : null;
        const coverImageUrl = user.foto_sampul ? `${req.protocol}://${req.get('host')}/covers/${user.foto_sampul}` : null;

        const userData = {
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            bio: user.bio,
            ttl: user.ttl,
            jenis_kelamin: user.jenis_kelamin,
            alamat: user.alamat,
            no_telp: user.no_telp,
            nama_institusi: user.nama_institusi,
            prodi: user.prodi,
            fakultas: user.fakultas,
            semester: user.semester,
            ipk: user.ipk,
            minat_bidang: user.minat_bidang,
            rencana: user.rencana,
            motivator_karir: user.motivator_karir,
            url_foto_profile: profileImageUrl,
            url_foto_sampul: coverImageUrl
        };

        res.status(200).json(userData);

    } catch (error) {
        console.error("Error getting user profile:", error);
        res.status(500).json({ msg: error.message || "Internal Server Error" });
    }
};

// Memperbarui informasi profil utama user
export const updateProfileInfo = async (req, res) => {
    const {
        name, bio, ttl, jenis_kelamin, alamat, no_telp,
        nama_institusi, prodi, fakultas, semester, ipk,
        minat_bidang, rencana, motivator_karir
    } = req.body;

    try {
        const user = await UserModel.findOne({
            where: { id: req.session.userId }
        });

        if (!user) {
            console.warn("UPDATE /profile: User tidak ditemukan untuk ID sesi:", req.session.userId);
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        const fieldsToUpdate = {};
        if (name !== undefined) fieldsToUpdate.name = name;
        if (bio !== undefined) fieldsToUpdate.bio = bio;
        if (ttl !== undefined) fieldsToUpdate.ttl = ttl;
        if (jenis_kelamin !== undefined) fieldsToUpdate.jenis_kelamin = jenis_kelamin;
        if (alamat !== undefined) fieldsToUpdate.alamat = alamat;
        if (no_telp !== undefined) fieldsToUpdate.no_telp = no_telp;
        if (nama_institusi !== undefined) fieldsToUpdate.nama_institusi = nama_institusi;
        if (prodi !== undefined) fieldsToUpdate.prodi = prodi;
        if (fakultas !== undefined) fieldsToUpdate.fakultas = fakultas;
        if (semester !== undefined) fieldsToUpdate.semester = semester;
        if (ipk !== undefined) fieldsToUpdate.ipk = ipk;
        if (minat_bidang !== undefined) fieldsToUpdate.minat_bidang = minat_bidang;
        if (rencana !== undefined) fieldsToUpdate.rencana = rencana;
        if (motivator_karir !== undefined) fieldsToUpdate.motivator_karir = motivator_karir;

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ msg: "Tidak ada data yang disediakan untuk diperbarui." });
        }

        await UserModel.update(fieldsToUpdate, {
            where: { id: req.session.userId }
        });

        const updatedUser = await UserModel.findOne({
            attributes: { exclude: ['password'] },
            where: { id: req.session.userId }
        });

        res.status(200).json({ msg: "Profil berhasil diperbarui", data: updatedUser.toJSON() });
    } catch (error) {
        console.error("Error updating profile info:", error);
        res.status(400).json({ msg: error.message || "Gagal memperbarui info profil" });
    }
};

// Mengunggah dan memperbarui foto profil
export const uploadProfilePicture = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            where: { id: req.session.userId }
        });
        if (!user) {
            console.warn("UPLOAD PROFILE PICTURE: User tidak ditemukan untuk ID sesi:", req.session.userId);
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Pastikan req.files tidak null/undefined dan memiliki properti 'file'
        // 'file' di sini sesuai dengan formData.append("file", file) di frontend
        if (!req.files || !req.files.file) {
            console.warn("UPLOAD PROFILE PICTURE: Tidak ada file yang diunggah atau nama field tidak cocok.");
            return res.status(400).json({ msg: "Tidak ada file yang diunggah." });
        }

        const file = req.files.file;
        const fileSize = file.data.length;
        const ext = path.extname(file.name).toLowerCase(); // Selalu konversi ke lowercase
        const fileName = file.md5 + ext;

        const allowedType = ['.png', '.jpg', '.jpeg', '.gif'];

        if (!allowedType.includes(ext)) {
            console.warn(`UPLOAD PROFILE PICTURE: Tipe file tidak valid: ${ext}`);
            return res.status(422).json({ msg: "Tipe file tidak valid. Hanya PNG, JPG, JPEG, GIF yang diizinkan." });
        }
        if (fileSize > 5000000) { // 5MB
            console.warn(`UPLOAD PROFILE PICTURE: Ukuran file terlalu besar: ${fileSize} bytes`);
            return res.status(422).json({ msg: "Ukuran gambar harus kurang dari 5MB" });
        }

        // Hapus foto profil lama jika ada di server
        if (user.foto_profile) {
            deleteFile(user.foto_profile);
        }

        const filePath = path.join(PROFILE_IMAGE_DIR, fileName);
        const url = `${req.protocol}://${req.get('host')}/profiles/${fileName}`;

        file.mv(filePath, async (err) => {
            if (err) {
                console.error("UPLOAD PROFILE PICTURE: Error saat memindahkan file foto profil:", err);
                return res.status(500).json({ msg: err.message || "Gagal memindahkan file" });
            }
            try {
                await UserModel.update({
                    foto_profile: fileName,
                    url_foto_profile: url // Jika Anda menyimpan URL lengkap di DB
                }, {
                    where: { id: req.session.userId }
                });
                res.status(200).json({ msg: "Foto profil berhasil diperbarui", url_foto_profile: url });
            } catch (error) {
                // Jika update DB gagal, hapus file yang sudah diunggah
                deleteFile(fileName);
                console.error("UPLOAD PROFILE PICTURE: Error updating profile picture DB:", error);
                res.status(500).json({ msg: error.message || "Gagal memperbarui database setelah upload." });
            }
        });
    } catch (error) {
        console.error("UPLOAD PROFILE PICTURE: Kesalahan umum:", error);
        res.status(500).json({ msg: error.message || "Internal Server Error saat upload foto profil." });
    }
};

// Mengunggah dan memperbarui foto sampul (logika serupa)
export const uploadCoverPicture = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            where: { id: req.session.userId }
        });
        if (!user) {
            console.warn("UPLOAD COVER PICTURE: User tidak ditemukan untuk ID sesi:", req.session.userId);
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        if (!req.files || !req.files.file) {
            console.warn("UPLOAD COVER PICTURE: Tidak ada file yang diunggah atau nama field tidak cocok.");
            return res.status(400).json({ msg: "Tidak ada file yang diunggah." });
        }

        const file = req.files.file;
        const fileSize = file.data.length;
        const ext = path.extname(file.name).toLowerCase();
        const fileName = file.md5 + ext;

        const allowedType = ['.png', '.jpg', '.jpeg', '.gif'];

        if (!allowedType.includes(ext)) {
            console.warn(`UPLOAD COVER PICTURE: Tipe file tidak valid: ${ext}`);
            return res.status(422).json({ msg: "Tipe file tidak valid. Hanya PNG, JPG, JPEG, GIF yang diizinkan." });
        }
        if (fileSize > 5000000) { // 5MB
            console.warn(`UPLOAD COVER PICTURE: Ukuran file terlalu besar: ${fileSize} bytes`);
            return res.status(422).json({ msg: "Ukuran gambar harus kurang dari 5MB" });
        }

        // Hapus foto sampul lama jika ada di server
        if (user.foto_sampul) {
            deleteFile(user.foto_sampul);
        }

        const filePath = path.join(COVER_IMAGE_DIR, fileName);
        const url = `${req.protocol}://${req.get('host')}/covers/${fileName}`;

        file.mv(filePath, async (err) => {
            if (err) {
                console.error("UPLOAD COVER PICTURE: Error saat memindahkan file foto sampul:", err);
                return res.status(500).json({ msg: err.message || "Gagal memindahkan file" });
            }
            try {
                await UserModel.update({
                    foto_sampul: fileName,
                    url_foto_sampul: url // Jika Anda menyimpan URL lengkap di DB
                }, {
                    where: { id: req.session.userId }
                });
                res.status(200).json({ msg: "Foto sampul berhasil diperbarui", url_foto_sampul: url });
            } catch (error) {
                // Jika update DB gagal, hapus file yang sudah diunggah
                deleteFile(fileName);
                console.error("UPLOAD COVER PICTURE: Error updating cover picture DB:", error);
                res.status(500).json({ msg: error.message || "Gagal memperbarui database setelah upload." });
            }
        });
    } catch (error) {
        console.error("UPLOAD COVER PICTURE: Kesalahan umum:", error);
        res.status(500).json({ msg: error.message || "Internal Server Error saat upload foto sampul." });
    }
};

// Menghapus foto profil
export const deleteProfilePicture = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            where: { id: req.session.userId }
        });

        if (!user) {
            console.warn("DELETE PROFILE PICTURE: User tidak ditemukan untuk ID sesi:", req.session.userId);
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        if (user.foto_profile) {
            deleteFile(user.foto_profile); // Hapus file dari server
            await UserModel.update({
                foto_profile: null,
                url_foto_profile: null
            }, {
                where: { id: req.session.userId }
            });
            res.status(200).json({ msg: "Foto profil berhasil dihapus" });
        } else {
            console.warn("DELETE PROFILE PICTURE: Foto profil tidak ditemukan untuk user:", user.id);
            res.status(404).json({ msg: "Foto profil tidak ditemukan" });
        }
    } catch (error) {
        console.error("DELETE PROFILE PICTURE: Error deleting profile picture:", error);
        res.status(500).json({ msg: error.message || "Internal Server Error" });
    }
};

// Menghapus foto sampul
export const deleteCoverPicture = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            where: { id: req.session.userId }
        });

        if (!user) {
            console.warn("DELETE COVER PICTURE: User tidak ditemukan untuk ID sesi:", req.session.userId);
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        if (user.foto_sampul) {
            deleteFile(user.foto_sampul); // Hapus file dari server
            await UserModel.update({
                foto_sampul: null,
                url_foto_sampul: null
            }, {
                where: { id: req.session.userId }
            });
            res.status(200).json({ msg: "Foto sampul berhasil dihapus" });
        } else {
            console.warn("DELETE COVER PICTURE: Foto sampul tidak ditemukan untuk user:", user.id);
            res.status(404).json({ msg: "Foto sampul tidak ditemukan" });
        }
    } catch (error) {
        console.error("DELETE COVER PICTURE: Error deleting cover picture:", error);
        res.status(500).json({ msg: error.message || "Internal Server Error" });
    }
};