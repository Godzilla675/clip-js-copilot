import { z } from "zod";
import { executeCommand } from "../sandbox/executor.js";
import { createTempDir, cleanupTempDir } from "@ai-video-editor/mcp-utils";
import fs from "fs/promises";
import path from "path";

export const pythonScriptTool = {
  name: "run_python_script",
  description: "Run a Python script safely. Creates a temporary environment for execution.",
  inputSchema: z.object({
    script: z.string().describe("The Python script code to run"),
    requirements: z.string().optional().describe("Space-separated list of pip requirements (e.g. 'numpy pandas')"),
    timeout: z.number().optional().default(30000).describe("Timeout in milliseconds (default 30000)")
  }),
  handler: async (args: { script: string; requirements?: string; timeout?: number }) => {
    const { script, requirements, timeout = 30000 } = args;

    // Create temp dir
    const tempDir = await createTempDir('python-runner-');
    const scriptPath = path.join(tempDir, 'script.py');

    try {
      // Write script to file
      await fs.writeFile(scriptPath, script);

      let pythonPath = 'python3'; // Default

      // Handle requirements
      if (requirements) {
        // Install requirements to a local directory in tempDir
        // We use pip install -t . <pkgs>
        // This avoids venv creation overhead but provides isolation

        // Split requirements
        const pkgs = requirements.split(' ').filter(Boolean);
        if (pkgs.length > 0) {
             const installResult = await executeCommand('pip3', ['install', '-t', tempDir, ...pkgs], tempDir, 120000); // Give more time for install
             if (installResult.exitCode !== 0) {
                 throw new Error(`Failed to install requirements: ${installResult.stderr}`);
             }
        }
      }

      // Execute script with PYTHONPATH
      const env: NodeJS.ProcessEnv = {
          PYTHONPATH: tempDir + (process.env.PYTHONPATH ? path.delimiter + process.env.PYTHONPATH : '')
      };

      const result = await executeCommand(pythonPath, [scriptPath], tempDir, timeout, env);

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
            content: [{ type: "text" as const, text: `Error: ${error.message}` }],
            isError: true
        };
    } finally {
        await cleanupTempDir(tempDir);
    }
  }
};
