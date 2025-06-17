// middleware/uploadBeasiswaImage.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join('public', 'images', 'beasiswa');
        // Pastikan direktori ada, buat jika belum ada
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
            if (err) {
                console.error('Failed to create upload directory:', err);
                return cb(err);
            }
            cb(null, uploadDir);
        });
    },
    filename: (req, file, cb) => {
        // Nama file unik: fieldname-timestamp.ext
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Check file type
const checkFileType = (file, cb) => {
    // Ekstensi yang diizinkan
    const filetypes = /jpeg|jpg|png|gif/;
    // Cek ekstensi
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Cek tipe mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Hanya file gambar (JPEG, JPG, PNG, GIF) yang diizinkan!'));
    }
};

// Init upload
const uploadBeasiswaImage = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('img'); // 'img' harus sesuai dengan nama field di FormData.append('img', ...) dari frontend

export default uploadBeasiswaImage;