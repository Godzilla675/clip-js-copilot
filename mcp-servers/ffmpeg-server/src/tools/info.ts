import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';

export function registerGetVideoInfo(server: McpServer) {
  server.tool(
    'get_video_info',
    {
      inputPath: z.string().describe('Path to the video file'),
    },
    async ({ inputPath }) => {
      try {
        const metadata = await new Promise<any>((resolve, reject) => {
          ffmpeg.ffprobe(inputPath, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });

        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');

        const info = {
          duration: metadata.format.duration,
          size: metadata.format.size,
          format: metadata.format.format_name,
          video: videoStream ? {
            width: videoStream.width,
            height: videoStream.height,
            codec: videoStream.codec_name,
            fps: videoStream.r_frame_rate,
            bitrate: videoStream.bit_rate
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            channels: audioStream.channels,
            sampleRate: audioStream.sample_rate
          } : null
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to get video info: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
