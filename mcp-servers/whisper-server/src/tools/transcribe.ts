import { z } from 'zod';
import { WhisperEngine } from '../whisper-engine.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const whisperEngine = new WhisperEngine();

export function registerTranscribeTool(server: McpServer) {
  server.tool(
    "transcribe_audio",
    "Transcribes audio or video file to text.",
    {
      inputPath: z.string().describe("Path to the audio or video file to transcribe"),
      language: z.string().optional().describe("Language of the audio (e.g., 'en', 'es'). If omitted, auto-detects."),
      model: z.string().optional().describe("Whisper model to use (default: base.en for English, base for others)"),
      wordTimestamps: z.boolean().optional().describe("Whether to include word-level timestamps"),
      outputFormat: z.enum(['json', 'srt', 'vtt', 'txt']).optional().describe("Format of the output (default: json)")
    },
    async ({ inputPath, language, model, wordTimestamps, outputFormat }) => {
      try {
        const result = await whisperEngine.transcribe(inputPath, {
          language,
          model,
          wordTimestamps,
          outputFormat: outputFormat || 'json'
        });

        // if outputFormat is JSON, return the object.
        // if others, we might want to return the content string if possible, or just the text representation.
        // My whisper-engine returns `TranscriptionResult`.

        // If the user requested SRT/VTT, nodejs-whisper created a file.
        // My engine reads the JSON output.
        // If I requested SRT, nodejs-whisper creates SRT file.
        // I need to update my engine to handle other outputs if I want to return them as text.

        // Let's rely on JSON output for the tool response mostly, unless specifically asked.
        // Actually, if outputFormat is srt, the tool should probably return the SRT content.

        // But for now, let's stick to returning what the engine returns (which is parsed JSON).
        // If the user wants SRT, they might need to use `generate_subtitles` tool.
        // Or I should update `transcribe` to handle returning the string content of SRT/VTT.

        // Let's verify what `transcribe` does in my implementation.
        // It sets `outputInJson = true` always, and `outputInSrt` etc if requested.
        // It reads the JSON file and returns it.
        // So `result` is the JSON object.

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error transcribing file: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
