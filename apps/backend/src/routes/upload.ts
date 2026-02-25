import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = new Set([
    // Video
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/flac',
    // Image
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
]);

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
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type '${file.mimetype}' is not allowed. Only video, audio, and image files are accepted.`));
        }
    }
});

/**
 * Validate that a fileId does not contain path traversal sequences.
 * Returns true if safe, false otherwise.
 */
function isSafeFileId(fileId: string): boolean {
    // Reject any path separators, traversal patterns, null bytes, or hidden files
    if (fileId.includes('/') || fileId.includes('\\') || fileId.includes('\0') || fileId.startsWith('.')) {
        return false;
    }
    // Normalize to collapse any remaining traversal and ensure it stays within uploadDir
    const normalized = path.normalize(fileId);
    if (normalized !== fileId || normalized.includes('..')) {
        return false;
    }
    const resolved = path.resolve(uploadDir, normalized);
    return resolved.startsWith(path.resolve(uploadDir));
}

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
        if (!isSafeFileId(req.params.fileId)) {
            return res.status(400).json({ error: 'Invalid file ID' });
        }
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
        if (!isSafeFileId(req.params.fileId)) {
            return res.status(400).json({ error: 'Invalid file ID' });
        }
        const filePath = path.join(uploadDir, req.params.fileId);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.sendFile(filePath);
    });

    // Handle multer errors (file type rejection, size limit, etc.)
    router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });
            }
            return res.status(400).json({ error: err.message });
        }
        if (err && err.message) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    });

    return router;
}
