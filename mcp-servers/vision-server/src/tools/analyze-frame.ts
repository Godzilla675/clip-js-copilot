import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extractFrameAtTimestamp } from '../frame-extractor.js';

export function registerAnalyzeFrameTool(server: McpServer) {
  server.tool(
    "analyze_frame",
    {
      videoPath: z.string(),
      timestamp: z.number().describe("Timestamp in seconds"),
      query: z.string().optional().describe("Question about the frame (context for the LLM)"),
    },
    async ({ videoPath, timestamp, query }) => {
      try {
        const base64 = await extractFrameAtTimestamp(videoPath, timestamp);

        return {
          content: [
            {
              type: "text",
              text: `Frame at timestamp ${timestamp}s. ${query ? `Query: ${query}` : ''}`
            },
            {
              type: "image",
              data: base64,
              mimeType: "image/png"
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error analyzing frame: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
