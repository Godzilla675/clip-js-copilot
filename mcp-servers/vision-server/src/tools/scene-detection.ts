import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ffmpeg } from '../setup-ffmpeg.js';

export function registerSceneDetectionTool(server: McpServer) {
  server.tool(
    "find_scene_changes",
    {
      videoPath: z.string(),
      sensitivity: z.number().optional().default(0.4).describe("Scene change threshold (0-1)"),
      minSceneDuration: z.number().optional().describe("Minimum duration of a scene in seconds (ignored for now)"),
    },
    async ({ videoPath, sensitivity, minSceneDuration }) => {
      try {
        const timestamps: number[] = [];

        await new Promise<void>((resolve, reject) => {
          ffmpeg(videoPath)
            .videoFilters(`select='gt(scene,${sensitivity})',showinfo`)
            .format('null')
            .output('-')
            .on('stderr', (line: string) => {
               if (line.includes('pts_time:')) {
                   const match = line.match(/pts_time:([\d\.]+)/);
                   if (match) {
                       timestamps.push(parseFloat(match[1]));
                   }
               }
            })
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        // Remove duplicates and sort
        const uniqueTimestamps = [...new Set(timestamps)].sort((a, b) => a - b);

        return {
          content: [{ type: "text", text: JSON.stringify(uniqueTimestamps) }]
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error detecting scenes: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
