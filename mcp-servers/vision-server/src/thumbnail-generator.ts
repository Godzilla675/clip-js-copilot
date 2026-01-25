import sharp from 'sharp';
import { extractFrameAtTimestamp, extractFrames } from './frame-extractor.js';

export async function generateThumbnail(
  videoPath: string,
  timestamp: number,
  width: number = 320,
  height?: number
): Promise<string> {
  // Extract full frame first
  const base64Frame = await extractFrameAtTimestamp(videoPath, timestamp);
  const buffer = Buffer.from(base64Frame, 'base64');

  // Resize using sharp
  let pipeline = sharp(buffer).resize({ width, height });

  const outputBuffer = await pipeline.toBuffer();
  return outputBuffer.toString('base64');
}

export async function generateFilmstrip(
  videoPath: string,
  timestamps: number[],
  width: number = 160
): Promise<{ timestamp: number; base64: string }[]> {
  const frames = await extractFrames(videoPath, timestamps);

  const results = await Promise.all(frames.map(async (frame) => {
    const buffer = Buffer.from(frame.base64, 'base64');
    const resized = await sharp(buffer).resize({ width }).toBuffer();
    return {
      timestamp: frame.timestamp,
      base64: resized.toString('base64')
    };
  }));

  return results;
}
