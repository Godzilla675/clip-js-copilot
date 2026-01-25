import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const projectDir = process.env.PROJECT_DIR || path.join(process.cwd(), 'projects');
const allowedDirs = (process.env.ALLOWED_DIRS || '').split(',').map(d => d.trim()).filter(Boolean);

// Ensure project dir is in allowed dirs
if (!allowedDirs.includes(projectDir)) {
    allowedDirs.push(projectDir);
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  projectDir,
  allowedDirs,
};
