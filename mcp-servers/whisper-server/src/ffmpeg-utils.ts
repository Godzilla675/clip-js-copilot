import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// Set ffmpeg path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
} else {
  console.warn('ffmpeg-static not found, relying on system ffmpeg');
}

/**
 * Extracts audio from a video file.
 * @param inputPath Path to the input video file
 * @param outputPath Path where the extracted audio should be saved (e.g., .wav)
 * @returns Promise that resolves when extraction is complete
 */
export async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  const outputDir = path.dirname(outputPath);
  await fs.promises.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioFrequency(16000) // Whisper expects 16kHz
      .audioChannels(1)      // Mono
      .audioCodec('pcm_s16le') // PCM 16-bit
      .format('wav')
      .save(outputPath)
      .on('end', () => {
        resolve();
      })
      .on('error', (err: Error) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      });
  });
}

/**
 * Checks if a file is an audio file supported by Whisper directly.
 * Although Whisper works best with 16kHz WAV, nodejs-whisper handles conversion.
 * This helper is mainly to decide if we need to pre-process (like extracting from video).
 */
export function isAudioFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.wav', '.mp3', '.m4a', '.ogg', '.flac'].includes(ext);
}

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

/**
 * Detects silence in a media file using FFmpeg silencedetect filter.
 * @param inputPath Path to input file
 * @param minDuration Minimum duration of silence in seconds (default: 2)
 * @param threshold Noise threshold in dB (default: -30dB)
 */
export async function detectSilence(
  inputPath: string,
  minDuration: number = 2,
  threshold: number = -30
): Promise<SilenceSegment[]> {
  return new Promise((resolve, reject) => {
    const segments: SilenceSegment[] = [];
    let currentStart: number | null = null;

    ffmpeg(inputPath)
      .audioFilters(`silencedetect=n=${threshold}dB:d=${minDuration}`)
      .format('null') // We only care about stderr output for silencedetect
      .output('-')
      .on('stderr', (line: string) => {
        // Parse lines like:
        // [silencedetect @ 0x...] silence_start: 45.678
        // [silencedetect @ 0x...] silence_end: 49.123 | silence_duration: 3.445

        const startMatch = line.match(/silence_start: ([\d.]+)/);
        if (startMatch) {
          currentStart = parseFloat(startMatch[1]);
        }

        const endMatch = line.match(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/);
        if (endMatch && currentStart !== null) {
          const end = parseFloat(endMatch[1]);
          const duration = parseFloat(endMatch[2]);
          segments.push({
            start: currentStart,
            end: end,
            duration: duration
          });
          currentStart = null;
        }
      })
      .on('end', () => {
        resolve(segments);
      })
      .on('error', (err: Error) => {
        reject(new Error(`FFmpeg silence detection error: ${err.message}`));
      })
      .run();
  });
}
