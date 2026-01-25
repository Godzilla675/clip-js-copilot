import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';

export function registerSpeedTool(server: McpServer) {
  server.tool(
    'change_speed',
    {
      inputPath: z.string().describe('Path to the input video'),
      outputPath: z.string().describe('Path for the output video'),
      speed: z.number().describe('Speed multiplier (e.g. 0.5 for half speed, 2.0 for double speed)'),
      preservePitch: z.boolean().optional().default(true).describe('Preserve audio pitch'),
    },
    async ({ inputPath, outputPath, speed, preservePitch }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          const command = ffmpeg(inputPath);

          // Video speed
          const videoFilter = `setpts=${1/speed}*PTS`;

          // Audio speed
          let audioFilterParts: string[] = [];

          if (preservePitch) {
             // atempo filter is limited to [0.5, 2.0]. Chain them for other values.
             let r = speed;
             while (r > 2.0) {
               audioFilterParts.push('atempo=2.0');
               r /= 2.0;
             }
             while (r < 0.5) {
               audioFilterParts.push('atempo=0.5');
               r /= 0.5;
             }
             if (r !== 1.0) {
               audioFilterParts.push(`atempo=${r}`);
             }
          } else {
             // Fallback to same logic if pitch preservation is not requested,
             // as we want to keep audio synced with video duration.
             let r = speed;
             while (r > 2.0) {
               audioFilterParts.push('atempo=2.0');
               r /= 2.0;
             }
             while (r < 0.5) {
               audioFilterParts.push('atempo=0.5');
               r /= 0.5;
             }
             if (r !== 1.0) {
               audioFilterParts.push(`atempo=${r}`);
             }
          }

          const audioFilter = audioFilterParts.join(',');

          command
            .videoFilters(videoFilter)
            .audioFilters(audioFilter)
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully changed speed to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to change speed: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
