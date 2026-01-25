import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Creates a temporary directory with the given prefix.
 * @param prefix The prefix for the temporary directory name.
 * @returns The path to the created temporary directory.
 */
export async function createTempDir(prefix: string = 'mcp-'): Promise<string> {
  const tmpDir = os.tmpdir();
  return fs.promises.mkdtemp(path.join(tmpDir, prefix));
}

/**
 * Recursively deletes a directory and its contents.
 * @param dirPath The path to the directory to remove.
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.promises.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to cleanup temp dir ${dirPath}:`, error);
    // We don't throw here to avoid interrupting the main flow if cleanup fails
  }
}

/**
 * Executes a promise-returning function with a timeout.
 * @param fn The function to execute.
 * @param timeoutMs The timeout in milliseconds.
 * @param errorMessage Optional error message for timeout.
 * @returns The result of the function execution.
 * @throws Error if the execution times out or the function throws.
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
