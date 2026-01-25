import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';

export function registerFilterTool(server: McpServer) {
  server.tool(
    'apply_filter',
    {
      inputPath: z.string().describe('Path to the input video'),
      outputPath: z.string().describe('Path for the output video'),
      filterName: z.enum(['blur', 'grayscale', 'brightness', 'contrast', 'saturation']).describe('Name of the filter to apply'),
      value: z.number().optional().describe('Value for the filter (e.g. radius for blur, value for eq filters)'),
    },
    async ({ inputPath, outputPath, filterName, value }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          const command = ffmpeg(inputPath);
          const val = value !== undefined ? value : 1; // Default to 1 (or specific defaults below)

          switch (filterName) {
            case 'blur':
              // value is radius, default 5?
              const radius = value !== undefined ? value : 5;
              command.videoFilters(`boxblur=${radius}:1`);
              break;
            case 'grayscale':
              command.videoFilters('hue=s=0');
              break;
            case 'brightness':
              // val: -1.0 to 1.0, default 0
              const brightness = value !== undefined ? value : 0.1;
              command.videoFilters(`eq=brightness=${brightness}`);
              break;
            case 'contrast':
              // val: 0.0 to 2.0+, default 1
              const contrast = value !== undefined ? value : 1.2;
              command.videoFilters(`eq=contrast=${contrast}`);
              break;
            case 'saturation':
              // val: 0.0 to 3.0, default 1
              const saturation = value !== undefined ? value : 1.5;
              command.videoFilters(`eq=saturation=${saturation}`);
              break;
          }

          command
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully applied ${filterName} filter to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to apply filter: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
