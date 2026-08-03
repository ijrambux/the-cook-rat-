import { spawn } from 'child_process';
import { join } from 'path';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  let validUrl;
  try {
    validUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    // Use yt-dlp via npx or direct path
    const ytdlpPath = join(process.cwd(), 'node_modules', '.bin', 'yt-dlp');

    const result = await new Promise((resolve, reject) => {
      const args = [
        '--dump-single-json',
        '--no-warnings',
        '--no-call-home',
        '--extractor-args', 'youtube:player_client=web',
        url
      ];

      const proc = spawn('npx', ['yt-dlp', ...args], {
        timeout: 55000,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data; });
      proc.stderr.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || 'yt-dlp failed'));
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            reject(new Error('Failed to parse yt-dlp output'));
          }
        }
      });

      proc.on('error', (err) => reject(err));
    });

    // Extract useful formats
    const formats = (result.formats || [])
      .filter(f => f.url && (f.vcodec !== 'none' || f.acodec !== 'none'))
      .map(f => ({
        formatId: f.format_id,
        quality: f.qualityLabel || f.resolution || f.format_note || 'Unknown',
        ext: f.ext,
        hasVideo: f.vcodec !== 'none',
        hasAudio: f.acodec !== 'none',
        url: f.url,
        filesize: f.filesize || f.filesize_approx || null,
      }))
      .sort((a, b) => {
        const qa = parseInt(a.quality) || 0;
        const qb = parseInt(b.quality) || 0;
        return qb - qa;
      });

    // Group by type
    const videoFormats = formats.filter(f => f.hasVideo && f.hasAudio).slice(0, 5);
    const audioFormats = formats.filter(f => !f.hasVideo && f.hasAudio).slice(0, 3);
    const videoOnlyFormats = formats.filter(f => f.hasVideo && !f.hasAudio).slice(0, 3);

    res.status(200).json({
      title: result.title,
      description: result.description?.substring(0, 200),
      thumbnail: result.thumbnail,
      duration: result.duration,
      uploader: result.uploader,
      platform: result.extractor?.replace('IE', '') || 'Unknown',
      formats: {
        video: videoFormats,
        audio: audioFormats,
        videoOnly: videoOnlyFormats,
      }
    });

  } catch (error) {
    console.error('Download API error:', error.message);

    // Fallback: try to provide at least some info
    res.status(500).json({ 
      error: 'Failed to fetch video info. The platform may block automated access.',
      details: error.message,
      url: url
    });
  }
}
