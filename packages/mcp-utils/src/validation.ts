import path from 'path';

/**
 * Validates that a path is within one of the allowed directories.
 * @param requestedPath The path to check.
 * @param allowedDirs List of allowed directory paths.
 * @returns True if the path is safe (inside an allowed directory), false otherwise.
 */
export function validatePath(requestedPath: string, allowedDirs: string[]): boolean {
  const resolvedPath = path.resolve(requestedPath);
  return allowedDirs.some(allowedDir => {
    const resolvedAllowed = path.resolve(allowedDir);
    // Ensure we don't match partial folder names (e.g. /data matching /dataset)
    // by appending path separator if needed, or using relative path check
    const relative = path.relative(resolvedAllowed, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  });
}

/**
 * Sanitizes a filename to remove dangerous characters.
 * @param name The filename to sanitize.
 * @returns A sanitized filename.
 */
export function sanitizeFilename(name: string): string {
  // Remove dangerous characters, allow alphanumeric, dot, underscore, dash
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Checks if a file path points to a video file based on extension.
 * @param filePath The path to the file.
 * @returns True if it's a video file.
 */
export function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
}

/**
 * Checks if a file path points to an audio file based on extension.
 * @param filePath The path to the file.
 * @returns True if it's an audio file.
 */
export function isAudioFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg'].includes(ext);
}

/**
 * Checks if a file path points to an image file based on extension.
 * @param filePath The path to the file.
 * @returns True if it's an image file.
 */
export function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'].includes(ext);
}
