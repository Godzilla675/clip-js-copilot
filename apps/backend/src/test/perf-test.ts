import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createUploadRouter } from '../routes/upload.js';
import { config } from '../config.js';

async function runTest() {
    console.log('Setting up benchmark...');
    const app = express();
    const uploadDir = path.join(config.projectDir, 'uploads');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // create dummy files
    const dummyFiles: string[] = [];
    for (let i = 0; i < 50; i++) {
        const id = `testfile_${i}.txt`;
        const p = path.join(uploadDir, id);
        fs.writeFileSync(p, crypto.randomBytes(1024));
        dummyFiles.push(id);
    }

    app.use('/api/upload', createUploadRouter());
    const server = app.listen(3003, () => {
        console.log('Server running on 3003');
    });

    await new Promise(res => setTimeout(res, 500));

    console.log('Running sequential read benchmark on /api/upload/:id (info)...');

    const start = Date.now();
    for (let i = 0; i < 2000; i++) {
        const fileId = dummyFiles[i % dummyFiles.length];
        const res = await fetch(`http://localhost:3003/api/upload/${fileId}`);
        await res.json();
    }
    const duration = Date.now() - start;
    console.log(`Baseline info time for 2000 requests: ${duration}ms`);

    const startDownload = Date.now();
    for (let i = 0; i < 2000; i++) {
        const fileId = dummyFiles[i % dummyFiles.length];
        const res = await fetch(`http://localhost:3003/api/upload/${fileId}/download`);
        await res.blob();
    }
    const durationDownload = Date.now() - startDownload;
    console.log(`Baseline download time for 2000 requests: ${durationDownload}ms`);

    server.close();
    process.exit(0);
}

runTest().catch(err => {
    console.error(err);
    process.exit(1);
});
