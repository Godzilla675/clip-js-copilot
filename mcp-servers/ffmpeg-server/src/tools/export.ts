import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ffmpeg } from '../ffmpeg-utils.js';
import fs from 'fs/promises';

export function registerExportTool(server: McpServer) {
  server.tool(
    'export_project',
    {
      projectPath: z.string().describe('Path to the project JSON file'),
      outputPath: z.string().describe('Path for the exported video'),
    },
    async ({ projectPath, outputPath }) => {
      try {
        const project = JSON.parse(await fs.readFile(projectPath, 'utf-8'));
        const command = ffmpeg();

        // 1. Inputs
        const assetIdToInputIndex = new Map<string, number>();
        project.assets.forEach((asset: any) => {
          if (!assetIdToInputIndex.has(asset.id)) {
            command.input(asset.path);
            assetIdToInputIndex.set(asset.id, assetIdToInputIndex.size);
          }
        });

        const duration = project.timeline.duration || 60;

        // Complex filter parts
        const filters: string[] = [];
        const audioLabels: string[] = [];

        // Create background
        // Resolution 1920x1080 default
        filters.push(`color=c=black:s=1920x1080:d=${duration}[v_bg]`);
        filters.push(`anullsrc=cl=stereo:r=44100:d=${duration}[a_bg]`);
        audioLabels.push('a_bg');

        let lastV = 'v_bg';
        let clipIdx = 0;

        for (const track of project.timeline.tracks) {
          // Check track type? Assuming 'video' or 'audio'
          // If track.type === 'audio', we only process audio.
          // If 'video', we process both (assuming video has audio).

          for (const clip of track.clips) {
             const inputIdx = assetIdToInputIndex.get(clip.assetId);
             if (inputIdx === undefined) continue;

             const sourceStart = clip.sourceStart || 0;
             const clipDuration = clip.duration;
             const sourceEnd = sourceStart + clipDuration;
             const startTime = clip.startTime;

             const vLabel = `c${clipIdx}_v`;
             const aLabel = `c${clipIdx}_a`;
             const aDelayedLabel = `c${clipIdx}_ad`;

             // Video Processing
             if (track.type !== 'audio') {
                // Trim and set PTS
                // We use setpts=PTS-START/TB to reset timestamp to 0 relative to trimmed clip
                // But overlay expects timestamp to match timeline position?
                // Actually:
                // If we overlay [v1] on [bg], [v1] timestamps determine when it appears if we DON'T use 'enable'.
                // If we use 'enable', the underlying timestamps matter for frame matching.
                // Standard overlay: main_w, main_h etc.
                // Simplest: Shift PTS to startTime.
                // setpts=PTS-START/TB + START_TIME/TB

                filters.push(`[${inputIdx}:v]trim=${sourceStart}:${sourceEnd},setpts=PTS-START/TB+${startTime}/TB[${vLabel}]`);

                // Overlay
                const nextV = `v_mix_${clipIdx}`;
                // We overlay on top of previous
                // eof_action=pass passes the main input (background) length
                filters.push(`[${lastV}][${vLabel}]overlay=enable='between(t,${startTime},${startTime + clipDuration})':eof_action=pass[${nextV}]`);
                lastV = nextV;
             }

             // Audio Processing
             if (!track.muted) { // Check if track is muted
                 // Trim audio
                 // atrim
                 filters.push(`[${inputIdx}:a]atrim=${sourceStart}:${sourceEnd},asetpts=PTS-START/TB[${aLabel}]`);

                 // Delay
                 // adelay adds delay. It preserves timestamps?
                 // adelay inserts silence.
                 const delayMs = Math.floor(startTime * 1000);
                 filters.push(`[${aLabel}]adelay=${delayMs}|${delayMs}[${aDelayedLabel}]`);

                 audioLabels.push(aDelayedLabel);
             }

             clipIdx++;
          }
        }

        // Mix Audio
        const mixedAudio = 'a_out';
        if (audioLabels.length > 1) {
          filters.push(`[${audioLabels.join('][')}]amix=inputs=${audioLabels.length}:dropout_transition=0:normalize=0[${mixedAudio}]`);
        } else {
          // Just rename bg to out
          filters.push(`[${audioLabels[0]}]anull[${mixedAudio}]`);
        }

        await new Promise<void>((resolve, reject) => {
          command
            .complexFilter(filters, [lastV, mixedAudio]) // Map final outputs
            .outputOptions(['-c:v libx264', '-c:a aac']) // Encode
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        return {
          content: [{ type: 'text', text: `Successfully exported project to ${outputPath}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to export project: ${err.message}` }],
          isError: true
        };
      }
    }
  );
}
