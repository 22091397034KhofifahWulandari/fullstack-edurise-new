// routes/BeasiswaRoute.js
import express from "express";
import {
    getBeasiswa,
    getBeasiswaById,
    createBeasiswa,
    updateBeasiswa,
    deleteBeasiswa
} from "../controllers/BeasiswaController.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";
import uploadBeasiswaImage from "../middleware/uploadBeasiswaImage.js"; // IMPORT INI

const router = express.Router();

// Rute yang dapat diakses oleh siapa saja
router.get('/beasiswa', getBeasiswa);
router.get('/beasiswa/:id', getBeasiswaById);

// Rute khusus untuk admin (CRUD Beasiswa)
// TAMBAHKAN uploadBeasiswaImage DI SINI SEBELUM createBeasiswa/updateBeasiswa
router.post('/beasiswa', verifyUser, adminOnly, uploadBeasiswaImage, createBeasiswa);
router.patch('/beasiswa/:id', verifyUser, adminOnly, uploadBeasiswaImage, updateBeasiswa);
router.delete('/beasiswa/:id', verifyUser, adminOnly, deleteBeasiswa);

export default router;