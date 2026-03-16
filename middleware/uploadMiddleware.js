import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.join(__dirname, '../uploads');

// Ensure folders exist at startup
['audio', 'videos', 'images'].forEach(sub => {
    const dir = path.join(uploadsRoot, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let subDir = 'images';
        if (file.fieldname === 'audioFile')  subDir = 'audio';
        if (file.fieldname === 'videoFile')  subDir = 'videos';
        cb(null, path.join(uploadsRoot, subDir));
    },
    filename: (req, file, cb) => {
        const prefix = file.fieldname === 'audioFile' ? 'audio'
                     : file.fieldname === 'videoFile' ? 'video'
                     : 'image';
        const ext  = path.extname(file.originalname) || '.bin';
        cb(null, `${prefix}_${Date.now()}${ext}`);
    },
});

const ALLOWED_AUDIO = ['audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/mpeg'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
    const allowed = file.fieldname === 'audioFile' ? ALLOWED_AUDIO
                  : file.fieldname === 'videoFile' ? ALLOWED_VIDEO
                  : ALLOWED_IMAGE;
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed for ${file.fieldname}: ${file.mimetype}`), false);
    }
};

export const reportUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
}).fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 },
    { name: 'image',     maxCount: 1 },
]);
