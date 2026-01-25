import { z } from 'zod';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { validatePath, sanitizeFilename } from '@ai-video-editor/mcp-utils';
import { config } from '../config.js';

export const downloadAssetTool = {
  name: 'download_asset',
  description: 'Download an asset from a URL to a local file',
  parameters: z.object({
    url: z.string().url().describe('The URL of the asset to download'),
    filename: z.string().describe('The filename to save as'),
    destinationDir: z.string().optional().describe('The directory to save the file in (must be an allowed directory)'),
  }),
  handler: async ({ url, filename, destinationDir }: { url: string, filename: string, destinationDir?: string }) => {
    const targetDir = destinationDir ? path.resolve(destinationDir) : config.downloadDir;

    // Ensure filename is safe
    const safeFilename = sanitizeFilename(filename);
    const fullPath = path.join(targetDir, safeFilename);

    // Validate path
    // We check if the target directory is allowed.
    // If destinationDir is provided, it must be within allowedDirs.
    // If using default downloadDir, we assume it's allowed (or we should add it to allowedDirs in config).
    // Let's rely on validatePath to check if fullPath is within any of config.allowedDirs.

    // Ensure downloadDir is in allowedDirs if we are using it?
    // Config logic: allowedDirs = env.ALLOWED_DIRS || './assets'. downloadDir = env.ASSET_DOWNLOAD_DIR || './assets'.
    // So usually they match or downloadDir is a subdir.

    if (!validatePath(fullPath, config.allowedDirs)) {
      throw new Error(`Access denied: Directory '${targetDir}' is not in the allowed directories list.`);
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      // Check if we can create it (parent must be allowed?)
      // Simplification: We assume if the path is allowed, we can mkdir recursive.
      // But wait, validatePath checks if it is *inside* an allowed dir.
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      if (!response.body) {
         throw new Error('No response body');
      }

      const fileStream = fs.createWriteStream(fullPath);
      await pipeline(response.body, fileStream);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Successfully downloaded to: ${fullPath}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error downloading file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};
