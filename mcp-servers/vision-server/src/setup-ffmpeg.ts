import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
} else {
  console.warn('ffmpeg-static did not provide a path, relying on system ffmpeg');
}

export { ffmpeg };
