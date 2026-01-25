import { validatePath as utilsValidatePath } from '@ai-video-editor/mcp-utils';
import path from 'path';
import os from 'os';

// Get allowed directories from environment or default to minimal safe set
function getAllowedDirs(): string[] {
  const dirs: string[] = [];

  // Environment variable
  if (process.env.ALLOWED_DIRS) {
    const envDirs = process.env.ALLOWED_DIRS.split(',').map(d => d.trim()).filter(Boolean);
    dirs.push(...envDirs);
  }

  // Always allow temp directory
  dirs.push(os.tmpdir());

  // Also allow current working directory
  dirs.push(process.cwd());

  // Dedup and resolve
  return [...new Set(dirs.map(p => path.resolve(p)))];
}

const ALLOWED_DIRS = getAllowedDirs();

export function validatePath(filePath: string): boolean {
  return utilsValidatePath(filePath, ALLOWED_DIRS);
}

export function getAllowedDirsList(): string[] {
    return ALLOWED_DIRS;
}
