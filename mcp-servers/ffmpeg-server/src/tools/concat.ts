import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';
import os from 'os';
import path from 'path';

export function registerConcatVideos(server: McpServer) {
  server.tool(
    'concat_videos',
    {
      inputPaths: z.array(z.string()).describe('Array of paths to videos to concatenate'),
      outputPath: z.string().describe('Path where the concatenated video will be saved'),
    },
    async ({ inputPaths, outputPath }) => {
      try {
        await new Promise<void>((resolve, reject) => {
          const command = ffmpeg();

          inputPaths.forEach(p => {
            command.input(p);
          });

          command
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .mergeToFile(outputPath, os.tmpdir());
        });

        return {
          content: [{ type: 'text', text: `Successfully concatenated videos to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to concat videos: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
