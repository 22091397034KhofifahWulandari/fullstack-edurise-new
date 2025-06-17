// index.js
import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import db from "./config/Database.js";
import SequelizeStore from "connect-session-sequelize";
// import fileUpload from "express-fileupload"; // <--- HAPUS BARIS INI
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Konfigurasi Session Store ---
const sessionStore = SequelizeStore(session.Store);
const store = new sessionStore({
    db: db,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000
});

// --- Import Semua Model dan Route ---
import {
    UserModel,
    OrangTuaModel,
    PortofolioModel,
    BeasiswaModel,
    UserSavedBeasiswaModel,
    ArticleModel,
    ForumModel,
    UserSavedForumModel,
    ForumParticipantModel,
    WebinarModel,
    WebinarPesertaModel,
    KompetisiModel,
    KompetisiRegistrasiModel,
    UserSavedKompetisiModel,
    EssayModel,
    PenilaianModel,
    DiskusiModel,
    MentoringModel
} from "./models/index.js";

import AuthRoute from "./routes/AuthRoute.js";
import UserRoute from "./routes/UserRoute.js";
import UserProfileRoutes from "./routes/UserProfileRoutes.js"
import OrangTuaRoutes from "./routes/OrangTuaRoutes.js";
import PortofolioRoutes from "./routes/PortofolioRoutes.js";
import BeasiswaRoute from "./routes/BeasiswaRoute.js";
import ArticleRoute from "./routes/ArticleRoute.js";
import UserSavedBeasiswaRoutes from "./routes/UserSavedBeasiswaRoutes.js";
import ForumRoute from "./routes/ForumRoutes.js";
import UserSavedForumRoutes from "./routes/UserSavedForumRoutes.js";
import ForumParticipantRoutes from "./routes/ForumParticipantRoutes.js";
import WebinarRoute from "./routes/webinarRoutes.js";
import WebinarPesertaRoutes from "./routes/webinarPesertaRoutes.js"
import KompetisiRoute from "./routes/KompetisiRoute.js";
import KompetisiRegistrasiRoute from "./routes/KompetisiRegistrasiRoute.js";
import UserSavedKompetisiRoute from "./routes/UserSavedKompetisiRoute.js";
import EssayRoute from "./routes/EssayRoute.js";
import PenilaianRoute from "./routes/PenilaianRoute.js";
import DiskusiRoute from './routes/DiskusiRoutes.js';
import MentoringRoute from './routes/MentoringRoute.js';


// --- Sinkronisasi Database (HANYA UNTUK PENGEMBANGAN) ---
(async () => {
    try {
        await db.authenticate();
        console.log('Database Connected Successfully!');

        // Pertimbangkan strategi sinkronisasi Anda untuk produksi
        // await db.sync({ alter: true });
        // await store.sync();

        console.log('Database synchronization (if configured) and Session Store Synced!');
    } catch (error) {
        console.error('Error connecting to database or during sync:', error);
        process.exit(1);
    }
})();

// --- Middleware ---

// 1. CORS
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// 2. Session Middleware (HARUS SEBELUM ROUTE YANG MEMBUTUHKAN SESI)
app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        secure: 'auto',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// 3. Parser untuk body request (JSON)
// Ini harus ada untuk request non-file upload (misal login, register, dll.)
// Multer akan memproses multipart/form-data sebelum ini di level rute.
app.use(express.json());

// 4. File upload (HAPUS INI KARENA ANDA SUDAH MENGGUNAKAN MULTER DI LEVEL RUTE)
// app.use(fileUpload({
//     limits: { fileSize: 5 * 1024 * 1024 },
//     abortOnLimit: true
// }));

// 5. Sajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));


// --- Integrasi Routes ---
// Urutan rute penting. Rute yang lebih spesifik sebaiknya di atas.

// Rute-rute ini akan menggunakan middleware Multer (uploadMentorPicture)
// secara spesifik di dalam file rute mereka masing-masing.
app.use(UserProfileRoutes);
app.use(OrangTuaRoutes);
app.use(PortofolioRoutes);
app.use(BeasiswaRoute);
app.use(ArticleRoute);
app.use(ForumRoute);
app.use(WebinarRoute);
app.use(KompetisiRoute);
app.use(DiskusiRoute);
app.use(MentoringRoute); // <-- Rute ini yang menggunakan Multer untuk mentoring

// Rute untuk relasi atau fitur spesifik lainnya
app.use(UserSavedBeasiswaRoutes);
app.use(UserSavedForumRoutes);
app.use(ForumParticipantRoutes);
app.use(WebinarPesertaRoutes);
app.use(KompetisiRegistrasiRoute);
app.use(UserSavedKompetisiRoute);
app.use(EssayRoute);
app.use(PenilaianRoute);

app.use(AuthRoute);
app.use(UserRoute);

// --- Mulai Server ---
const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server up and running on port ${PORT}...`);
    console.log(`Frontend URL (configured in CORS): ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});