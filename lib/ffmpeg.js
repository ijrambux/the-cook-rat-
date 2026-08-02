import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg = null;

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  await ffmpeg.load();
  return ffmpeg;
}

export async function processVideo(inputFile, operations) {
  const ff = await loadFFmpeg();
  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  await ff.writeFile(inputName, await fetchFile(inputFile));

  const args = ['-i', inputName];

  // Apply operations
  if (operations.trim) {
    args.push('-ss', String(operations.trim.start));
    args.push('-t', String(operations.trim.duration));
  }

  if (operations.cutFiller) {
    // Complex filter to remove silent/filler sections
    args.push('-af', 'silencedetect=noise=-50dB:d=0.5');
  }

  if (operations.scale) {
    args.push('-vf', `scale=${operations.scale.width}:${operations.scale.height}`);
  }

  if (operations.fps) {
    args.push('-r', String(operations.fps));
  }

  // Add text overlay (subtitles)
  if (operations.subtitles) {
    const textFilter = `drawtext=text='${operations.subtitles.text}':fontsize=${operations.subtitles.size || 24}:fontcolor=white:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=h-${operations.subtitles.y || 100}`;
    args.push('-vf', textFilter);
  }

  // Audio fade in/out
  if (operations.audioFade) {
    args.push('-af', `afade=t=in:ss=0:d=1,afade=t=out:st=${operations.duration - 1}:d=1`);
  }

  args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
  args.push('-c:a', 'aac', '-b:a', '128k');
  args.push('-movflags', '+faststart');
  args.push('-y', outputName);

  await ff.exec(args);

  const data = await ff.readFile(outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  return URL.createObjectURL(blob);
}

export async function extractAudio(videoFile) {
  const ff = await loadFFmpeg();
  await ff.writeFile('input.mp4', await fetchFile(videoFile));
  await ff.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-q:a', '2', 'audio.mp3', '-y']);
  const data = await ff.readFile('audio.mp3');
  return new Blob([data.buffer], { type: 'audio/mp3' });
}

export async function getVideoInfo(file) {
  const ff = await loadFFmpeg();
  await ff.writeFile('input.mp4', await fetchFile(file));

  // Get duration using ffprobe equivalent
  try {
    await ff.exec(['-i', 'input.mp4', '-f', 'null', '-']);
  } catch (e) {
    // ffprobe output is in stderr
    const output = e.message || '';
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseFloat(durationMatch[3]);
      return { duration: hours * 3600 + minutes * 60 + seconds };
    }
  }
  return { duration: 0 };
}
