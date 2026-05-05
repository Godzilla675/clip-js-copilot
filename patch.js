const fs = require('fs');

let content = fs.readFileSync('apps/backend/src/routes/upload.ts', 'utf8');

content = content.replace(
`    // Get file info
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
    });`,
`    // Get file info
    router.get('/:fileId', async (req, res, next) => {
        if (!isSafeFileId(req.params.fileId)) {
            return res.status(400).json({ error: 'Invalid file ID' });
        }
        const filePath = path.join(uploadDir, req.params.fileId);

        try {
            const stats = await fs.promises.stat(filePath);
            res.json({
                fileId: req.params.fileId,
                filePath,
                size: stats.size,
                created: stats.birthtime
            });
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: 'File not found' });
            }
            next(err);
        }
    });

    // Serve file
    router.get('/:fileId/download', async (req, res, next) => {
        if (!isSafeFileId(req.params.fileId)) {
            return res.status(400).json({ error: 'Invalid file ID' });
        }
        const filePath = path.join(uploadDir, req.params.fileId);

        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            res.sendFile(filePath, (err) => {
                if (err) next(err);
            });
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: 'File not found' });
            }
            next(err);
        }
    });`
);

fs.writeFileSync('apps/backend/src/routes/upload.ts', content);
