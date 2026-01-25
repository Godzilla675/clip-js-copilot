import { spawn } from 'child_process';
import { executeWithTimeout } from '@ai-video-editor/mcp-utils';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function executeCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number = 30000,
  envOverrides: NodeJS.ProcessEnv = {}
): Promise<ExecutionResult> {
  return executeWithTimeout(async () => {
    return new Promise<ExecutionResult>((resolve, reject) => {
      // Security: shell: false prevents shell injection attacks
      const child = spawn(command, args, {
        cwd,
        shell: false,
        env: { ...process.env, ...envOverrides }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        // If the command itself fails to spawn (e.g. not found)
        reject(error);
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code
        });
      });
    });
  }, timeoutMs, `Command ${command} timed out after ${timeoutMs}ms`);
}
