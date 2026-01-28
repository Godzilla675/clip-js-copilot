import { nodewhisper } from 'nodejs-whisper';
import path from 'path';
import fs from 'fs';
import { extractAudio, isAudioFile } from './ffmpeg-utils.js';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

export interface TranscriptionOptions {
  language?: string;
  wordTimestamps?: boolean;
  outputFormat?: 'json' | 'srt' | 'vtt' | 'txt' | 'csv' | 'lrc';
  model?: string;
}

export interface TranscriptionResult {
  text?: string;
  segments?: any[];
  language?: string;
  [key: string]: any;
}

export class WhisperEngine {
  private defaultModel: string;

  constructor(defaultModel: string = 'base.en') {
    this.defaultModel = defaultModel;
  }

  /**
   * Transcribes an audio or video file.
   * If video, extracts audio first.
   */
  async transcribe(
    inputPath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    let modelName = options.model || this.defaultModel;

    // Check if input exists
    try {
      await fs.promises.access(inputPath);
    } catch {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Always use a temp file to ensure safe filenames and clean conversion
    const tempDir = os.tmpdir();
    const audioPath = path.join(tempDir, `whisper-${uuidv4()}.wav`);

    // Extract or copy audio to temp WAV
    console.log(`Preparing audio at ${audioPath}...`);
    await extractAudio(inputPath, audioPath);

    try {
      // If language is provided and we are using default 'base.en', switch to 'base'
      if (options.language && options.language !== 'en' && modelName === 'base.en') {
        modelName = 'base';
      }

      console.log(`Starting transcription with model ${modelName}...`);

      const whisperOptions: any = {
        modelName: modelName,
        autoDownloadModelName: modelName,
        removeWavFileAfterTranscription: true,
        whisperOptions: {
          wordTimestamps: options.wordTimestamps ?? false,
          translateToEnglish: false,
          language: options.language
        }
      };

      whisperOptions.whisperOptions.outputInJson = true;

      if (options.outputFormat === 'srt') whisperOptions.whisperOptions.outputInSrt = true;
      if (options.outputFormat === 'vtt') whisperOptions.whisperOptions.outputInVtt = true;
      if (options.outputFormat === 'txt') whisperOptions.whisperOptions.outputInText = true;

      await nodewhisper(audioPath, whisperOptions);

      // nodejs-whisper output is audioPath + '.json' (e.g. file.wav.json)
      // We check both likely variants to be safe, but usually it appends extension
      let jsonPath = audioPath + '.json';

      const checkFileExists = async (p: string) => {
        try {
          await fs.promises.access(p);
          return true;
        } catch {
          return false;
        }
      };

      if (!(await checkFileExists(jsonPath)) && (await checkFileExists(audioPath + '.wav.json'))) {
         jsonPath = audioPath + '.wav.json';
      }

      let result: TranscriptionResult = {};

      if (await checkFileExists(jsonPath)) {
        const jsonContent = await fs.promises.readFile(jsonPath, 'utf-8');
        result = JSON.parse(jsonContent);
        await fs.promises.unlink(jsonPath);
      } else {
        console.warn(`Expected JSON output not found at ${jsonPath}`);
      }

      return result;

    } finally {
      try {
        await fs.promises.access(audioPath);
        await fs.promises.unlink(audioPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }

  /**
   * Generates subtitles for a video/audio file and saves them to outputPath.
   */
  async generateSubtitles(
    inputPath: string,
    outputPath: string,
    format: 'srt' | 'vtt' = 'srt',
    options: TranscriptionOptions = {}
  ): Promise<void> {
    let modelName = options.model || this.defaultModel;

    try {
      await fs.promises.access(inputPath);
    } catch {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const tempDir = os.tmpdir();
    const audioPath = path.join(tempDir, `whisper-${uuidv4()}.wav`);

    console.log(`Preparing audio at ${audioPath}...`);
    await extractAudio(inputPath, audioPath);

    try {
      if (options.language && options.language !== 'en' && modelName === 'base.en') {
        modelName = 'base';
      }

      console.log(`Starting transcription for subtitles with model ${modelName}...`);

      const whisperOptions: any = {
        modelName: modelName,
        autoDownloadModelName: modelName,
        removeWavFileAfterTranscription: true,
        whisperOptions: {
          wordTimestamps: options.wordTimestamps ?? false,
          translateToEnglish: false,
          language: options.language
        }
      };

      if (format === 'srt') whisperOptions.whisperOptions.outputInSrt = true;
      if (format === 'vtt') whisperOptions.whisperOptions.outputInVtt = true;

      await nodewhisper(audioPath, whisperOptions);

      // Find the generated file
      const generatedFile = audioPath + '.' + format; // e.g. file.wav.srt

      try {
        await fs.promises.access(generatedFile);
      } catch {
        throw new Error(`Subtitle file not generated at ${generatedFile}`);
      }

      await fs.promises.copyFile(generatedFile, outputPath);
      await fs.promises.unlink(generatedFile);
    } finally {
      try {
        await fs.promises.access(audioPath);
        await fs.promises.unlink(audioPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }
}
