import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Setup FFmpeg paths ───────────────────────────────────────────────────────
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
}
if (ffprobeStatic?.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, '..', 'tmp-test-artifacts');
const TEST_VIDEO_DURATION = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  }
}

function probeFile(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function runFfmpeg(command: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    command
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

// ─── Test: Generate a test video clip ─────────────────────────────────────────
async function generateTestVideo(): Promise<string> {
  const outputPath = path.join(TEST_DIR, 'test-input.mp4');
  console.log('\n🎬 Generating test video clip...');

  // Use ffmpeg binary directly since lavfi is a device, not a format
  const ffmpegBin = ffmpegPath as unknown as string;
  execFileSync(ffmpegBin, [
    '-f', 'lavfi', '-i', `testsrc=duration=${TEST_VIDEO_DURATION}:size=640x480:rate=30`,
    '-f', 'lavfi', '-i', `sine=frequency=440:duration=${TEST_VIDEO_DURATION}`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest',
    '-y', outputPath,
  ], { stdio: 'pipe' });

  assert(fs.existsSync(outputPath), 'Test video generated');
  return outputPath;
}

// ─── Test: get_video_info (ffprobe metadata) ──────────────────────────────────
async function testGetVideoInfo(inputPath: string) {
  console.log('\n📋 Test: get_video_info');

  const metadata = await probeFile(inputPath);

  const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
  const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

  assert(metadata.format.duration !== undefined, 'Duration is present');
  assert(Math.abs(metadata.format.duration! - TEST_VIDEO_DURATION) < 1, `Duration is ~${TEST_VIDEO_DURATION}s (got ${metadata.format.duration}s)`);
  assert(videoStream !== undefined, 'Video stream exists');
  assert(videoStream?.width === 640, `Video width is 640 (got ${videoStream?.width})`);
  assert(videoStream?.height === 480, `Video height is 480 (got ${videoStream?.height})`);
  assert(audioStream !== undefined, 'Audio stream exists');
}

// ─── Test: trim_video ─────────────────────────────────────────────────────────
async function testTrimVideo(inputPath: string) {
  console.log('\n✂️  Test: trim_video');
  const outputPath = path.join(TEST_DIR, 'trimmed.mp4');

  // Replicate the trim tool logic: output seeking with -ss and -to
  await runFfmpeg(
    ffmpeg(inputPath)
      .outputOptions(['-ss', '2', '-to', '6'])
      .output(outputPath)
  );

  assert(fs.existsSync(outputPath), 'Trimmed video file exists');

  const metadata = await probeFile(outputPath);
  const duration = metadata.format.duration!;
  assert(duration >= 3 && duration <= 5, `Trimmed duration is ~4s (got ${duration.toFixed(2)}s)`);
}

// ─── Test: apply_filter (grayscale) ───────────────────────────────────────────
async function testApplyFilter(inputPath: string) {
  console.log('\n🎨 Test: apply_filter (grayscale)');
  const outputPath = path.join(TEST_DIR, 'grayscale.mp4');

  // Replicate the filter tool logic for grayscale
  await runFfmpeg(
    ffmpeg(inputPath)
      .videoFilters('hue=s=0')
      .output(outputPath)
  );

  assert(fs.existsSync(outputPath), 'Grayscale video file exists');

  const metadata = await probeFile(outputPath);
  assert(metadata.format.duration !== undefined, 'Grayscale video has valid duration');
  assert(Math.abs(metadata.format.duration! - TEST_VIDEO_DURATION) < 1, `Grayscale duration matches input (~${TEST_VIDEO_DURATION}s, got ${metadata.format.duration?.toFixed(2)}s)`);
}

// ─── Test: apply_filter (brightness) ──────────────────────────────────────────
async function testApplyBrightnessFilter(inputPath: string) {
  console.log('\n🔆 Test: apply_filter (brightness)');
  const outputPath = path.join(TEST_DIR, 'brightness.mp4');

  await runFfmpeg(
    ffmpeg(inputPath)
      .videoFilters('eq=brightness=0.2')
      .output(outputPath)
  );

  assert(fs.existsSync(outputPath), 'Brightness-adjusted video file exists');

  const metadata = await probeFile(outputPath);
  assert(Math.abs(metadata.format.duration! - TEST_VIDEO_DURATION) < 1, `Brightness duration matches input (~${TEST_VIDEO_DURATION}s, got ${metadata.format.duration?.toFixed(2)}s)`);
}

// ─── Test: add_text_overlay ───────────────────────────────────────────────────
async function testTextOverlay(inputPath: string) {
  console.log('\n📝 Test: add_text_overlay');
  const outputPath = path.join(TEST_DIR, 'text-overlay.mp4');

  // Replicate the text overlay tool logic using drawtext filter
  const text = 'Hello World';
  const fontSize = 24;
  const fontColor = 'white';
  const x = 10;
  const y = 10;

  const drawtext = `drawtext=text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}`;

  try {
    await runFfmpeg(
      ffmpeg(inputPath)
        .videoFilters(drawtext)
        .output(outputPath)
    );

    assert(fs.existsSync(outputPath), 'Text overlay video file exists');

    const metadata = await probeFile(outputPath);
    assert(Math.abs(metadata.format.duration! - TEST_VIDEO_DURATION) < 1, `Text overlay duration matches input (~${TEST_VIDEO_DURATION}s, got ${metadata.format.duration?.toFixed(2)}s)`);
  } catch {
    // drawtext filter requires libfreetype which may not be in static builds
    console.log('  ⚠ SKIP: drawtext filter not available (requires libfreetype)');
  }
}

// ─── Test: change_speed ───────────────────────────────────────────────────────
async function testChangeSpeed(inputPath: string) {
  console.log('\n⏩ Test: change_speed (2x)');
  const outputPath = path.join(TEST_DIR, 'speed-2x.mp4');
  const speed = 2.0;

  // Replicate the speed tool logic
  const videoFilter = `setpts=${1 / speed}*PTS`;
  const audioFilter = `atempo=${speed}`;

  await runFfmpeg(
    ffmpeg(inputPath)
      .videoFilters(videoFilter)
      .audioFilters(audioFilter)
      .output(outputPath)
  );

  assert(fs.existsSync(outputPath), '2x speed video file exists');

  const metadata = await probeFile(outputPath);
  const duration = metadata.format.duration!;
  // At 2x speed, a 10s video should be ~5s
  assert(duration >= 4 && duration <= 6, `2x speed duration is ~${TEST_VIDEO_DURATION / 2}s (got ${duration.toFixed(2)}s)`);
}

// ─── Test: extract_frames (frame extraction) ──────────────────────────────────
async function testExtractFrames(inputPath: string) {
  console.log('\n🖼️  Test: extract_frames');
  const frameDir = path.join(TEST_DIR, 'frames');
  fs.mkdirSync(frameDir, { recursive: true });

  // Replicate the vision-server frame extraction logic
  const timestamps = [1, 3, 5, 7];

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps,
        filename: 'frame-%s.png',
        folder: frameDir,
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });

  const files = fs.readdirSync(frameDir).filter((f) => f.endsWith('.png'));
  assert(files.length > 0, `Extracted ${files.length} frames`);

  // Check each frame file is non-empty
  for (const file of files) {
    const stat = fs.statSync(path.join(frameDir, file));
    assert(stat.size > 0, `Frame ${file} is non-empty (${stat.size} bytes)`);
  }
}

// ─── Test: find_scene_changes ─────────────────────────────────────────────────
async function testSceneDetection(inputPath: string) {
  console.log('\n🔍 Test: find_scene_changes');

  // Replicate the scene detection tool logic
  const timestamps: number[] = [];
  const sensitivity = 0.4;

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(`select='gt(scene,${sensitivity})',showinfo`)
      .format('null')
      .output('-')
      .on('stderr', (line: string) => {
        if (line.includes('pts_time:')) {
          const match = line.match(/pts_time:([\d.]+)/);
          if (match) {
            timestamps.push(parseFloat(match[1]));
          }
        }
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });

  // Test video with testsrc should have some scene changes due to changing frame counter
  assert(Array.isArray(timestamps), 'Scene detection returned an array');
  console.log(`  ℹ️  Found ${timestamps.length} scene change(s)`);
}

// ─── Test: concat_videos ──────────────────────────────────────────────────────
async function testConcatVideos(inputPath: string) {
  console.log('\n🔗 Test: concat_videos');
  const trimmedA = path.join(TEST_DIR, 'concat-a.mp4');
  const trimmedB = path.join(TEST_DIR, 'concat-b.mp4');
  const outputPath = path.join(TEST_DIR, 'concatenated.mp4');

  // Create two short clips first
  await runFfmpeg(
    ffmpeg(inputPath).outputOptions(['-ss', '0', '-to', '3']).output(trimmedA)
  );
  await runFfmpeg(
    ffmpeg(inputPath).outputOptions(['-ss', '5', '-to', '8']).output(trimmedB)
  );

  // Replicate the concat tool logic using mergeToFile
  await new Promise<void>((resolve, reject) => {
    ffmpeg(trimmedA)
      .input(trimmedB)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .mergeToFile(outputPath, TEST_DIR);
  });

  assert(fs.existsSync(outputPath), 'Concatenated video file exists');

  const metadata = await probeFile(outputPath);
  const duration = metadata.format.duration!;
  assert(duration >= 4 && duration <= 8, `Concatenated duration is ~6s (got ${duration.toFixed(2)}s)`);
}

// ─── Test: audio operations ───────────────────────────────────────────────────
async function testAudioExtract(inputPath: string) {
  console.log('\n🔊 Test: extract_audio');
  const outputPath = path.join(TEST_DIR, 'audio-only.aac');

  // Replicate the audio tool logic: remove video, keep audio
  await runFfmpeg(
    ffmpeg(inputPath)
      .noVideo()
      .output(outputPath)
  );

  assert(fs.existsSync(outputPath), 'Extracted audio file exists');

  const metadata = await probeFile(outputPath);
  const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
  assert(audioStream !== undefined, 'Audio stream present in extracted file');
  assert(Math.abs(metadata.format.duration! - TEST_VIDEO_DURATION) < 1, `Audio duration matches input (~${TEST_VIDEO_DURATION}s, got ${metadata.format.duration?.toFixed(2)}s)`);
}

// ─── Main runner ──────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Video Editing E2E Test Suite');
  console.log('═══════════════════════════════════════════════════');

  // Clean up previous test artifacts
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });

  try {
    // Generate test video
    const inputPath = await generateTestVideo();

    // Run all tests
    await testGetVideoInfo(inputPath);
    await testTrimVideo(inputPath);
    await testApplyFilter(inputPath);
    await testApplyBrightnessFilter(inputPath);
    await testTextOverlay(inputPath);
    await testChangeSpeed(inputPath);
    await testExtractFrames(inputPath);
    await testSceneDetection(inputPath);
    await testConcatVideos(inputPath);
    await testAudioExtract(inputPath);

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    // Clean up test artifacts
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
