import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from root or local
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  pexelsApiKey: process.env.PEXELS_API_KEY || '',
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  allowedDirs: (process.env.ALLOWED_DIRS || './assets').split(',').map(d => path.resolve(d)),
  // For download tool, we might want a default download location
  downloadDir: process.env.ASSET_DOWNLOAD_DIR || path.resolve(process.cwd(), 'assets')
};

export const checkConfig = () => {
  const missing = [];
  if (!config.pexelsApiKey) missing.push('PEXELS_API_KEY');
  if (!config.unsplashAccessKey) missing.push('UNSPLASH_ACCESS_KEY');

  if (missing.length > 0) {
    console.warn(`[Asset Server] Warning: Missing API keys for: ${missing.join(', ')}. Some tools may not work.`);
  }
};
