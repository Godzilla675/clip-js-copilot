import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extractFrames, getVideoMetadata } from '../frame-extractor.js';

export function registerExtractFramesTool(server: McpServer) {
  server.tool(
    "extract_frames",
    {
      videoPath: z.string(),
      mode: z.enum(['timestamps', 'interval', 'range']),
      timestamps: z.array(z.number()).optional().describe("Array of timestamps in seconds (for 'timestamps' mode)"),
      interval: z.number().optional().describe("Interval in seconds (for 'interval' mode)"),
      startTime: z.number().optional().describe("Start time in seconds (for 'range' mode)"),
      endTime: z.number().optional().describe("End time in seconds (for 'range' mode)"),
      fps: z.number().optional().default(1).describe("Frames per second (for 'range' mode)"),
    },
    async ({ videoPath, mode, timestamps, interval, startTime, endTime, fps }) => {
      let targetTimestamps: number[] = [];

      if (mode === 'timestamps') {
        if (!timestamps) {
          return {
            content: [{ type: "text", text: "Error: timestamps required for 'timestamps' mode" }],
            isError: true
          };
        }
        targetTimestamps = timestamps;
      } else if (mode === 'interval') {
        if (!interval) {
          return {
            content: [{ type: "text", text: "Error: interval required for 'interval' mode" }],
            isError: true
          };
        }
        const metadata = await getVideoMetadata(videoPath);
        const duration = metadata.format.duration;
        if (!duration) {
            return {
                content: [{ type: "text", text: "Error: Could not determine video duration" }],
                isError: true
            };
        }

        for (let t = 0; t < duration; t += interval) {
          targetTimestamps.push(t);
        }
      } else if (mode === 'range') {
        if (startTime === undefined || endTime === undefined) {
          return {
            content: [{ type: "text", text: "Error: startTime and endTime required for 'range' mode" }],
            isError: true
          };
        }
        const effectiveFps = fps || 1;
        const step = 1 / effectiveFps;
        for (let t = startTime; t <= endTime; t += step) {
          targetTimestamps.push(t);
        }
      }

      try {
        const frames = await extractFrames(videoPath, targetTimestamps);

        const content: any[] = [];
        for (const frame of frames) {
          content.push({
            type: "text",
            text: `Frame at timestamp ${frame.timestamp.toFixed(2)}s:`
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
          content: [{ type: "text", text: `Error extracting frames: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
