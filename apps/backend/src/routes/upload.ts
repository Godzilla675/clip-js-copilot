import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

// Configure multer for file uploads
const uploadDir = path.join(config.projectDir, 'uploads');

// Ensure upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use UUID + original extension to avoid conflicts
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
    }
});

export function createUploadRouter(): Router {
    const router = Router();

    // Upload a single file
    router.post('/', upload.single('file'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = path.join(uploadDir, req.file.filename);

        res.json({
            success: true,
            fileId: req.file.filename,
            fileName: req.file.originalname,
            filePath: filePath,
            mimeType: req.file.mimetype,
            size: req.file.size
        });
    });

    // Upload multiple files
    router.post('/batch', upload.array('files', 10), (req, res) => {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const files = (req.files as Express.Multer.File[]).map(file => ({
            fileId: file.filename,
            fileName: file.originalname,
            filePath: path.join(uploadDir, file.filename),
            mimeType: file.mimetype,
            size: file.size
        }));

        res.json({
            success: true,
            files
        });
    });

    // Get file info
    router.get('/:fileId', (req, res) => {
        const filePath = path.join(uploadDir, req.params.fileId);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const stats = fs.statSync(filePath);
        res.json({
            fileId: req.params.fileId,
            filePath,
            size: stats.size,
            created: stats.birthtime
        });
    });

    // Serve file
    router.get('/:fileId/download', (req, res) => {
        const filePath = path.join(uploadDir, req.params.fileId);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.sendFile(filePath);
    });

    return router;
}
