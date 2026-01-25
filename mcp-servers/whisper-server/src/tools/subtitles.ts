import { z } from 'zod';
import { WhisperEngine } from '../whisper-engine.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const whisperEngine = new WhisperEngine();

export function registerSubtitlesTool(server: McpServer) {
  server.tool(
    "generate_subtitles",
    "Generates subtitles (SRT/VTT) for an audio or video file.",
    {
      inputPath: z.string().describe("Path to the input file"),
      outputPath: z.string().describe("Path where the subtitle file should be saved"),
      format: z.enum(['srt', 'vtt']).optional().describe("Subtitle format (default: srt)"),
      wordTimestamps: z.boolean().optional().describe("Whether to include word-level timestamps (karaoke-style)")
    },
    async ({ inputPath, outputPath, format, wordTimestamps }) => {
      try {
        await whisperEngine.generateSubtitles(
          inputPath,
          outputPath,
          format || 'srt',
          { wordTimestamps }
        );

        return {
          content: [
            {
              type: "text",
              text: `Subtitles successfully generated at ${outputPath}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating subtitles: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
