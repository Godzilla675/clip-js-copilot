import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';

export function registerAudioTools(server: McpServer) {
  server.tool(
    'extract_audio',
    {
      inputPath: z.string().describe('Path to the input video'),
      outputPath: z.string().describe('Path where the extracted audio will be saved'),
    },
    async ({ inputPath, outputPath }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(inputPath)
            .noVideo()
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully extracted audio to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to extract audio: ${err.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'add_audio_track',
    {
      videoPath: z.string().describe('Path to the video file'),
      audioPath: z.string().describe('Path to the audio file'),
      outputPath: z.string().describe('Path for the output video'),
      replace: z.boolean().optional().default(true).describe('If true, replaces existing audio. If false, mixes it.'),
    },
    async ({ videoPath, audioPath, outputPath, replace }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          const command = ffmpeg(videoPath).input(audioPath);

          if (replace) {
            // Map video from first input (0:v) and audio from second input (1:a)
            command
              .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
              .output(outputPath);
          } else {
            // Mix audio
            command
              .complexFilter([
                {
                  filter: 'amix',
                  options: { inputs: 2, duration: 'shortest' }
                }
              ])
              .outputOptions(['-c:v copy']) // Copy video stream
              .output(outputPath);
          }

          command
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully added audio to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to add audio: ${err.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'adjust_volume',
    {
      inputPath: z.string().describe('Path to the input file'),
      outputPath: z.string().describe('Path for the output file'),
      volume: z.number().describe('Volume multiplier (e.g. 1.0 is original, 0.5 is half, 2.0 is double)'),
    },
    async ({ inputPath, outputPath, volume }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(inputPath)
            .audioFilters(`volume=${volume}`)
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully adjusted volume to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to adjust volume: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
