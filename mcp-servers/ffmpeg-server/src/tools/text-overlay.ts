import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';

export function registerTextOverlayTool(server: McpServer) {
  server.tool(
    'add_text_overlay',
    {
      inputPath: z.string().describe('Path to the input video'),
      outputPath: z.string().describe('Path for the output video'),
      text: z.string().describe('Text to overlay'),
      x: z.string().optional().default('(w-text_w)/2').describe('X position (FFmpeg expression, default centered)'),
      y: z.string().optional().default('(h-text_h)/2').describe('Y position (FFmpeg expression, default centered)'),
      fontSize: z.number().optional().default(24).describe('Font size'),
      fontColor: z.string().optional().default('white').describe('Font color'),
      startTime: z.number().optional().describe('Start time in seconds'),
      endTime: z.number().optional().describe('End time in seconds'),
    },
    async ({ inputPath, outputPath, text, x, y, fontSize, fontColor, startTime, endTime }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          let filterOptions: any = {
            filter: 'drawtext',
            options: {
              text: text,
              x: x,
              y: y,
              fontsize: fontSize,
              fontcolor: fontColor,
            }
          };

          if (startTime !== undefined && endTime !== undefined) {
            filterOptions.options.enable = `between(t,${startTime},${endTime})`;
          } else if (startTime !== undefined) {
             filterOptions.options.enable = `gte(t,${startTime})`;
          } else if (endTime !== undefined) {
             filterOptions.options.enable = `lte(t,${endTime})`;
          }

          ffmpeg(inputPath)
            .videoFilters(filterOptions)
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully added text overlay to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to add text overlay: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
