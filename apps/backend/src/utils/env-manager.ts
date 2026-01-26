import fs from 'fs/promises';
import path from 'path';

export async function updateEnvFile(updates: Record<string, string>, filePath?: string): Promise<void> {
  // Use config.projectDir logic or just process.cwd()?
  // The .env file is usually in the root of the backend package during dev,
  // or passed via env vars in prod.
  // Assuming local setup where .env is in apps/backend/.env

  // We need to find the .env file.
  // If we are in apps/backend/dist, we want apps/backend/.env
  // process.cwd() is usually the root of the repo or the package root.

  const envPath = filePath || path.resolve(process.cwd(), '.env');

  let content = '';
  try {
    content = await fs.readFile(envPath, 'utf-8');
  } catch (error) {
    // If file doesn't exist, we'll create it.
    console.log('.env file not found, creating new one.');
  }

  const lines = content.split('\n');
  const newLines: string[] = [];
  const updatedKeys = new Set(Object.keys(updates));
  const foundKeys = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      newLines.push(line);
      continue;
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      if (updatedKeys.has(key)) {
        newLines.push(`${key}=${updates[key]}`);
        foundKeys.add(key);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  // Append missing keys
  for (const key of updatedKeys) {
    if (!foundKeys.has(key)) {
      newLines.push(`${key}=${updates[key]}`);
    }
  }

  // Add trailing newline if needed
  if (newLines.length > 0 && newLines[newLines.length - 1] !== '') {
    newLines.push('');
  }

  await fs.writeFile(envPath, newLines.join('\n'), 'utf-8');
  console.log('Updated .env file at', envPath);
}
