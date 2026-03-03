import fs from 'fs';
import path from 'path';

let fileObjMap: Record<string, string> = {
    "const filePath = path.join(uploadDir, req.params.fileId);": `const filePath = path.join(uploadDir, req.params.fileId);

        try { await fs.promises.access(filePath, fs.constants.R_OK); } catch { return res.status(404).json({ error: 'File not found' }); }
        res.sendFile(filePath);
`
};
