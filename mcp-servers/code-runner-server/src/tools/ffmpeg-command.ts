import { z } from "zod";
import { executeCommand } from "../sandbox/executor.js";
import { validatePath, getAllowedDirsList } from "../sandbox/validator.js";
import path from "path";

// Regex to split arguments respecting quotes
function parseArgs(commandStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < commandStr.length; i++) {
    const char = commandStr[i];

    if (char === ' ' && !inQuote) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else {
      current += char;
    }
  }
  if (current) {
    args.push(current);
  }
  return args;
}

export const ffmpegCommandTool = {
  name: "run_ffmpeg_command",
  description: "Run a custom FFmpeg command. The input should be the arguments passed to ffmpeg (e.g. '-i input.mp4 output.mp4').",
  inputSchema: z.object({
    command: z.string().describe("The arguments to pass to ffmpeg (e.g. '-i input.mp4 output.mp4')"),
    workingDirectory: z.string().optional().describe("The directory to run the command in. Must be an allowed directory."),
    timeout: z.number().optional().default(30000).describe("Timeout in milliseconds (default 30000)")
  }),
  handler: async (args: { command: string; workingDirectory?: string; timeout?: number }) => {
    const { command, workingDirectory, timeout = 30000 } = args;
    const cwd = workingDirectory || process.cwd();

    // Validate working directory
    if (workingDirectory && !validatePath(workingDirectory)) {
      throw new Error(`Working directory ${workingDirectory} is not allowed. Allowed directories: ${getAllowedDirsList().join(', ')}`);
    }

    // Parse arguments
    const ffmpegArgs = parseArgs(command);

    // SECURITY: Check all potential path arguments
    for (const arg of ffmpegArgs) {
       // We treat any argument that doesn't start with '-' as a potential file path or value
       if (!arg.startsWith('-')) {
          // Resolve against cwd to handle relative paths like "../secret"
          const resolved = path.resolve(cwd, arg);

          // Check if the resolved path is allowed
          if (!validatePath(resolved)) {
             throw new Error(`Access to path ${arg} (resolved: ${resolved}) is not allowed.`);
          }
       }
    }

    try {
      const result = await executeCommand('ffmpeg', ffmpegArgs, cwd, timeout);
      return {
        content: [
          {
            type: "text" as const,
            text: `Exit Code: ${result.exitCode}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`
          }
        ],
        isError: result.exitCode !== 0
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing command: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
};
