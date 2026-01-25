import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

const getParams = (serverName: string) => {
  // Assuming we are running from apps/backend
  const mcpServersDir = path.resolve(process.cwd(), '../../mcp-servers');
  const serverDir = path.join(mcpServersDir, `${serverName}-server`);

  if (isDev) {
    return {
      command: 'npx',
      args: ['-y', 'tsx', path.join(serverDir, 'src/index.ts')]
    };
  } else {
    return {
      command: 'node',
      args: [path.join(serverDir, 'dist/index.js')]
    };
  }
};

export const serverConfigs = {
  ffmpeg: getParams('ffmpeg'),
  whisper: getParams('whisper'),
  vision: getParams('vision'),
  asset: getParams('asset'),
  codeRunner: getParams('code-runner'),
};
