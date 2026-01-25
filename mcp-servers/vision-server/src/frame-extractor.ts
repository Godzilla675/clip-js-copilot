import { createTempDir, cleanupTempDir } from '@ai-video-editor/mcp-utils';
import { ffmpeg } from './setup-ffmpeg.js';
import fs from 'fs';
import path from 'path';

export interface ExtractedFrame {
  timestamp: number;
  base64: string;
}

export async function getVideoMetadata(videoPath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
}

export async function readImageAsBase64(filePath: string): Promise<string> {
  const data = await fs.promises.readFile(filePath);
  return data.toString('base64');
}

export async function extractFrameAtTimestamp(videoPath: string, timestamp: number): Promise<string> {
  const tempDir = await createTempDir('vision-frame-');
  const filename = 'frame.png';
  const outputPath = path.join(tempDir, filename);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: filename,
          folder: tempDir,
          size: '100%'
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    return await readImageAsBase64(outputPath);
  } finally {
    await cleanupTempDir(tempDir);
  }
}

export async function extractFrames(
  videoPath: string,
  timestamps: number[]
): Promise<ExtractedFrame[]> {
  if (timestamps.length === 0) return [];

  const tempDir = await createTempDir('vision-frames-');

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: timestamps,
          filename: 'frame-%s.png',
          folder: tempDir
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    const results: ExtractedFrame[] = [];
    const files = await fs.promises.readdir(tempDir);

    for (const file of files) {
      // Filename format from fluent-ffmpeg for %s replaces points with nothing or keeps them?
      // Actually usually it puts the number.
      // Let's assume the filename contains the timestamp.
      const match = file.match(/frame-(.+)\.png/);
      if (match) {
        const ts = parseFloat(match[1]);
        const base64 = await readImageAsBase64(path.join(tempDir, file));
        results.push({ timestamp: ts, base64 });
      }
    }

    results.sort((a, b) => a.timestamp - b.timestamp);
    return results;

  } finally {
    await cleanupTempDir(tempDir);
  }
}
