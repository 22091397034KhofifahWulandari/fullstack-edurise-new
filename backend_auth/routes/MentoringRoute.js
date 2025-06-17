// routes/MentoringRoute.js (contoh nama file)

import express from "express";
import {
    getMentoring,
    getMentoringById,
    createMentoring,
    updateMentoring,
    deleteMentoring,
    joinMentoring // Jika rute ini juga ada di sini
} from "../controllers/MentoringController.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js"; // Middleware autentikasi/otorisasi Anda
import uploadMentorPicture from "../middleware/uploadMentorPhoto.js"; // Pastikan path ini benar

const router = express.Router();

// Rute untuk semua pengguna (melihat)
router.get('/mentoring', getMentoring);
router.get('/mentoring/:id', getMentoringById);
router.post('/mentoring/:id/join', verifyUser, joinMentoring); // Contoh rute join mentoring

// Rute untuk admin (dengan Multer)
// Penting: uploadMentorPicture sebagai middleware sebelum createMentoring
router.post('/mentoring', verifyUser, adminOnly, uploadMentorPicture, createMentoring);
// Penting: uploadMentorPicture sebagai middleware sebelum updateMentoring
router.patch('/mentoring/:id', verifyUser, adminOnly, uploadMentorPicture, updateMentoring);
router.delete('/mentoring/:id', verifyUser, adminOnly, deleteMentoring);

export default router;