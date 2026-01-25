import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';

export function registerTrimVideo(server: McpServer) {
  server.tool(
    'trim_video',
    {
      inputPath: z.string().describe('Path to the input video'),
      outputPath: z.string().describe('Path where the trimmed video will be saved'),
      startTime: z.union([z.string(), z.number()]).describe('Start time in seconds or HH:MM:SS format'),
      endTime: z.union([z.string(), z.number()]).describe('End time in seconds or HH:MM:SS format'),
    },
    async ({ inputPath, outputPath, startTime, endTime }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          // Use output seeking for frame-accurate cuts and correct behavior of -to
          // This ensures -to refers to the timestamp in the original stream (mostly) or works as expected range
          // Actually, if -ss is output option, -to is also output option, it implies "seek to start, then stop at end".
          // This works as users expect: trim from A to B.
          ffmpeg(inputPath)
            .outputOptions(['-ss', String(startTime), '-to', String(endTime)])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully trimmed video to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to trim video: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
