import { z } from 'zod';
import { detectSilence } from '../ffmpeg-utils.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSilenceTool(server: McpServer) {
  server.tool(
    "detect_silence",
    "Detects silent segments in an audio or video file.",
    {
      inputPath: z.string().describe("Path to the input file"),
      minDuration: z.number().optional().describe("Minimum duration of silence in seconds (default: 2)"),
      threshold: z.number().optional().describe("Silence threshold in dB (default: -30)")
    },
    async ({ inputPath, minDuration, threshold }) => {
      try {
        const segments = await detectSilence(inputPath, minDuration, threshold);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(segments, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error detecting silence: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
