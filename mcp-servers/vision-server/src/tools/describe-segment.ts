import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extractFrames } from '../frame-extractor.js';

export function registerDescribeSegmentTool(server: McpServer) {
  server.tool(
    "describe_video_segment",
    {
      videoPath: z.string(),
      startTime: z.number().describe("Start time in seconds"),
      endTime: z.number().describe("End time in seconds"),
      sampleFps: z.number().optional().default(0.5).describe("Frames per second to sample"),
    },
    async ({ videoPath, startTime, endTime, sampleFps }) => {
      try {
        const fps = sampleFps || 0.5;
        const targetTimestamps: number[] = [];
        const step = 1 / fps;

        for (let t = startTime; t <= endTime; t += step) {
          targetTimestamps.push(t);
        }

        const frames = await extractFrames(videoPath, targetTimestamps);

        const content: any[] = [];

        // Add a header
        content.push({
            type: "text",
            text: `Frames for segment ${startTime}s to ${endTime}s (sampled at ${fps} fps):`
        });

        for (const frame of frames) {
          content.push({
            type: "text",
            text: `Timestamp: ${frame.timestamp.toFixed(2)}s`
          });
          content.push({
            type: "image",
            data: frame.base64,
            mimeType: "image/png"
          });
        }

        return { content };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error describing segment: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
