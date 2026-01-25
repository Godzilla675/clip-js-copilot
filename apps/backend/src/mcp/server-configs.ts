import path from 'path';

// When running from apps/backend, we need to go up two levels to reach root
// However, let's verify where we are running from.
// If process.cwd() is the repo root, we don't need ../..
// But typically 'npm start' or 'pnpm dev' runs in the package directory.

const getRootDir = () => {
    // fast check if we are in apps/backend
    if (process.cwd().endsWith('backend')) {
        return path.resolve(process.cwd(), '../..');
    }
    return process.cwd();
};

const ROOT_DIR = getRootDir();
const MCP_SERVERS_DIR = path.resolve(ROOT_DIR, 'mcp-servers');

export const serverConfigs = {
  ffmpeg: {
    command: 'node',
    args: [path.resolve(MCP_SERVERS_DIR, 'ffmpeg-server/dist/index.js')]
  },
  whisper: {
    command: 'node',
    args: [path.resolve(MCP_SERVERS_DIR, 'whisper-server/dist/index.js')]
  },
  vision: {
    command: 'node',
    args: [path.resolve(MCP_SERVERS_DIR, 'vision-server/dist/index.js')]
  },
  asset: {
    command: 'node',
    args: [path.resolve(MCP_SERVERS_DIR, 'asset-server/dist/index.js')]
  },
  codeRunner: {
    command: 'node',
    args: [path.resolve(MCP_SERVERS_DIR, 'code-runner-server/dist/index.js')]
  }
};
