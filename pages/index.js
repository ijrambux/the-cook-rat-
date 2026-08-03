import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import {
  Scissors, Type, Music, VolumeX, Download, Upload,
  Play, Pause, Flame, MousePointer2, Film, Clock,
  CheckCircle, AlertCircle, Loader2, Mic, MicOff,
  Volume2, Volume1, Replace, RotateCcw, X,
  Globe, Link2, Youtube, Twitter, Facebook, Video,
  ExternalLink, Smartphone, Monitor, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  // ===== STATES =====
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('trim');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Trim states
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);

  // Text overlay states
  const [textOverlay, setTextOverlay] = useState('The Cook Rat');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(48);
  const [textPosition, setTextPosition] = useState('center');

  // Audio states
  const [volumeLevel, setVolumeLevel] = useState(100);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);

  // Download states
  const [downloadUrl, setDownloadUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Refs
  const ffmpegRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // ===== LOAD FFmpeg =====
  useEffect(() => {
    let mounted = true;
    const loadFFmpeg = async () => {
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { toBlobURL } = await import('@ffmpeg/util');
        if (!mounted) return;
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress: p }) => {
          if (mounted) setProgress(Math.min(Math.round(p * 100), 99));
        });
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        if (mounted) { ffmpegRef.current = ffmpeg; setFfmpegLoaded(true); }
      } catch (err) {
        if (mounted) setMessage({ text: '⚠️ تعذر تحميل The Cook Rat. حاول تحديث الصفحة.', type: 'error' });
      }
    };
    loadFFmpeg();
    return () => { mounted = false; };
  }, []);

  // ===== VIDEO HANDLERS =====
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setMessage({ text: '❌ يرجى اختيار ملف فيديو صالح', type: 'error' });
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoFile(file); setVideoUrl(url); setOutputUrl(null); setOutputName('');
    setMessage({ text: `📁 تم اختيار: ${file.name}`, type: 'success' });
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      const duration = Math.floor(tempVideo.duration);
      setVideoDuration(duration); setEndTime(Math.min(duration, 10));
      URL.revokeObjectURL(tempVideo.src);
    };
    tempVideo.src = url;
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setMessage({ text: '❌ يرجى اختيار ملف صوتي صالح', type: 'error' });
      return;
    }
    setAudioFile(file); setAudioUrl(URL.createObjectURL(file));
    setMessage({ text: `🎵 تم اختيار الصوت: ${file.name}`, type: 'success' });
  };

  // ===== RECORDING =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
      };
      mediaRecorder.start();
      setIsRecording(true); setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
      setMessage({ text: '🔴 جاري التسجيل...', type: 'loading' });
    } catch (err) {
      setMessage({ text: '❌ لا يمكن الوصول للمايكروفون', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setMessage({ text: '✅ تم التسجيل!', type: 'success' });
  };

  const clearRecording = () => { setRecordedBlob(null); setRecordingTime(0); };

  // ===== DOWNLOAD HELPERS =====
  const detectPlatform = (url) => {
    const u = url.toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) return { name: 'YouTube', icon: Youtube, color: '#FF0000', service: 'yt' };
    if (u.includes('tiktok.com')) return { name: 'TikTok', icon: Smartphone, color: '#00f2ea', service: 'tt' };
    if (u.includes('twitter.com') || u.includes('x.com')) return { name: 'X / Twitter', icon: Twitter, color: '#1DA1F2', service: 'tw' };
    if (u.includes('facebook.com') || u.includes('fb.watch')) return { name: 'Facebook', icon: Facebook, color: '#1877F2', service: 'fb' };
    if (u.includes('instagram.com')) return { name: 'Instagram', icon: Smartphone, color: '#E4405F', service: 'ig' };
    return { name: 'موقع', icon: Globe, color: '#00d4ff', service: 'generic' };
  };

  const getDownloadLinks = (url) => {
    const platform = detectPlatform(url);
    const encoded = encodeURIComponent(url);
    const links = [];

    if (platform.service === 'yt') {
      links.push(
        { name: 'Y2mate', url: `https://www.y2mate.com/youtube/${encoded}`, type: 'video' },
        { name: 'SaveFrom', url: `https://en.savefrom.net/1-how-to-download-youtube-video/${encoded}`, type: 'video' },
        { name: 'Y2mate MP3', url: `https://www.y2mate.com/youtube-mp3/${encoded}`, type: 'audio' },
      );
    } else if (platform.service === 'tt') {
      links.push(
        { name: 'SSSTikTok', url: `https://ssstik.io/en`, type: 'video' },
        { name: 'SaveFrom TikTok', url: `https://en.savefrom.net/9-how-to-download-tiktok-video.html`, type: 'video' },
        { name: 'TikTokDownloader', url: `https://tiktokdownloader.io/`, type: 'video' },
      );
    } else if (platform.service === 'tw') {
      links.push(
        { name: 'SaveFrom X', url: `https://en.savefrom.net/9-how-to-download-twitter-video.html`, type: 'video' },
        { name: 'TwitterVideoDownloader', url: `https://twittervideodownloader.com/`, type: 'video' },
      );
    } else if (platform.service === 'fb') {
      links.push(
        { name: 'SaveFrom FB', url: `https://en.savefrom.net/1-how-to-download-facebook-video.html`, type: 'video' },
        { name: 'FDownloader', url: `https://fdownloader.net/`, type: 'video' },
      );
    } else if (platform.service === 'ig') {
      links.push(
        { name: 'SaveFrom IG', url: `https://en.savefrom.net/9-how-to-download-instagram-video.html`, type: 'video' },
        { name: 'SnapInsta', url: `https://snapinsta.app/`, type: 'video' },
      );
    }

    // Generic fallback
    links.push(
      { name: 'SaveFrom (عام)', url: `https://en.savefrom.net/`, type: 'video' },
      { name: '9XBuddy', url: `https://9xbuddy.in/`, type: 'video' },
    );

    return { platform, links };
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setMessage({ text: '❌ تعذر النسخ', type: 'error' });
    }
  };

  // ===== PROCESSING =====
  const getExtension = (filename) => filename.substring(filename.lastIndexOf('.')) || '.mp4';

  const processVideo = async (command) => {
    if (!ffmpegRef.current || !videoFile) {
      setMessage({ text: '⚠️ يرجى اختيار فيديو أولاً', type: 'error' });
      return;
    }
    setProcessing(true); setProgress(0); setOutputUrl(null);
    setMessage({ text: '⏳ جاري المعالجة...', type: 'loading' });
    try {
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = ffmpegRef.current;
      const ext = getExtension(videoFile.name);
      const inputName = `input${ext}`;
      let outputFile = `output${ext}`;
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      let args = ['-i', inputName];

      switch (command) {
        case 'trim':
          outputFile = `trimmed${ext}`;
          args.push('-ss', String(startTime), '-t', String(endTime - startTime), '-c', 'copy');
          break;

        case 'text': {
          outputFile = `text${ext}`;
          setMessage({ text: '⏳ جاري تحميل الخط...', type: 'loading' });
          try {
            const fontResponse = await fetch('https://cdn.jsdelivr.net/npm/dejavu-sans@1.0.0/DejaVuSans.ttf');
            const fontBuffer = await fontResponse.arrayBuffer();
            await ffmpeg.writeFile('font.ttf', new Uint8Array(fontBuffer));
          } catch (e) {
            const fontResponse2 = await fetch('https://github.com/AstroNvim/astronvim/raw/master/.github/assets/DejaVuSans.ttf');
            const fontBuffer2 = await fontResponse2.arrayBuffer();
            await ffmpeg.writeFile('font.ttf', new Uint8Array(fontBuffer2));
          }
          const safeText = textOverlay.replace(/'/g, "'\\''").replace(/:/g, '\:');
          let posX = '(w-text_w)/2', posY = '(h-text_h)/2';
          if (textPosition === 'top') posY = '20';
          if (textPosition === 'bottom') posY = 'h-text_h-20';
          if (textPosition === 'left') posX = '20';
          if (textPosition === 'right') posX = 'w-text_w-20';
          args.push('-vf', `drawtext=fontfile=font.ttf:text='${safeText}':fontsize=${textSize}:fontcolor=${textColor}:box=1:boxcolor=black@0.6:x=${posX}:y=${posY}`, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k');
          break;
        }

        case 'extract-audio':
          outputFile = 'audio.mp3';
          args.push('-vn', '-acodec', 'libmp3lame', '-q:a', '2');
          break;

        case 'remove-audio':
          outputFile = `no-audio${ext}`;
          args.push('-c', 'copy', '-an');
          break;

        case 'volume-boost': {
          outputFile = `volume-boost${ext}`;
          const vol = volumeLevel / 100;
          args.push('-af', `volume=${vol}`, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k');
          break;
        }

        case 'replace-audio': {
          if (!audioFile && !recordedBlob) {
            setMessage({ text: '⚠️ يرجى اختيار ملف صوتي أو تسجيل صوت أولاً', type: 'error' });
            setProcessing(false); return;
          }
          outputFile = `replaced-audio${ext}`;
          const audioSource = audioFile || recordedBlob;
          const audioExt = audioFile ? getExtension(audioFile.name) : '.webm';
          const audioInputName = `audio_input${audioExt}`;
          await ffmpeg.writeFile(audioInputName, await fetchFile(audioSource));
          args = ['-i', inputName, '-i', audioInputName, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-map', '0:v:0', '-map', '1:a:0', '-shortest'];
          break;
        }

        case 'add-voiceover': {
          if (!recordedBlob) {
            setMessage({ text: '⚠️ يرجى تسجيل صوت أولاً', type: 'error' });
            setProcessing(false); return;
          }
          outputFile = `voiceover${ext}`;
          const voiceInput = 'voiceover.webm';
          await ffmpeg.writeFile(voiceInput, await fetchFile(recordedBlob));
          args = ['-i', inputName, '-i', voiceInput, '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=3[aout]', '-map', '0:v:0', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k'];
          break;
        }

        default: throw new Error('أمر غير معروف');
      }

      args.push('-y', outputFile);
      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outputFile);
      const mimeType = outputFile.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4';
      const blob = new Blob([data.buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url); setOutputName(outputFile); setProgress(100);
      setMessage({ text: '✅ تمت المعالجة بنجاح!', type: 'success' });
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputFile);
        if (audioFile) await ffmpeg.deleteFile(`audio_input${getExtension(audioFile.name)}`);
        if (recordedBlob) await ffmpeg.deleteFile('voiceover.webm');
      } catch (_) {}
    } catch (err) {
      setMessage({ text: '❌ خطأ: ' + (err.message || 'فشلت المعالجة'), type: 'error' });
    } finally { setProcessing(false); }
  };

  // ===== VIDEO CONTROLS =====
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };
  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ===== TABS CONFIG =====
  const tabs = [
    { id: 'trim', label: 'قص الفيديو', icon: Scissors },
    { id: 'text', label: 'نص على الفيديو', icon: Type },
    { id: 'audio', label: 'استخراج الصوت', icon: Music },
    { id: 'mute', label: 'كتم الصوت', icon: VolumeX },
    { id: 'volume', label: 'رفع الصوت', icon: Volume2 },
    { id: 'replace', label: 'استبدال الصوت', icon: Replace },
    { id: 'voiceover', label: 'تسجيل صوتي', icon: Mic },
    { id: 'download', label: 'تحميل من المنصات', icon: Globe },
  ];

  const downloadInfo = downloadUrl ? getDownloadLinks(downloadUrl) : null;
  const platformInfo = downloadInfo?.platform;

  return (
    <>
      <Head>
        <title>The Cook Rat — AI Video Editor</title>
        <meta name="description" content="محرر فيديو احترافي ومحمل فيديوهات من جميع المنصات" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#050510] text-white font-tajawal">
        {/* ===== HEADER ===== */}
        <header className="border-b border-white/5 bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }} className="relative">
                <MousePointer2 className="w-9 h-9 text-[#00d4ff]" style={{ filter: 'drop-shadow(0 0 15px #00d4ff)' }} />
                <Flame className="w-4 h-4 text-[#00f0ff] absolute -top-1 -right-1 animate-pulse" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>The Cook Rat</h1>
                <p className="text-xs text-gray-400">AI Video Editor & Downloader</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${ffmpegLoaded ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
                {ffmpegLoaded ? '● جاهز للعمل' : '● جاري التحميل...'}
              </span>
              <a href="https://x.com/mouse0000000" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 hover:border-[#00d4ff]/30 transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Follow
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* ===== UPLOAD SECTION ===== */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-[#00d4ff]/10 bg-gradient-to-br from-[#0f1729] to-[#0a0a1a] p-10 mb-8 text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-50" />
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()} disabled={processing}
              className="relative z-10 inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
              <Upload className="w-6 h-6" />اختر فيديو للبدء
            </motion.button>
            <p className="mt-4 text-gray-400 text-sm">يدعم MP4, MOV, AVI, MKV — يعمل بالكامل في المتصفح</p>
            {videoFile && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                <Film className="w-5 h-5 text-[#00d4ff]" />
                <span className="text-[#00d4ff] font-medium">{videoFile.name}</span>
                <span className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded-lg">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
                <span className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded-lg">⏱️ {formatTime(videoDuration)}</span>
              </motion.div>
            )}
          </motion.div>

          {/* ===== VIDEO PREVIEW ===== */}
          <AnimatePresence>
            {videoUrl && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl border border-white/5 bg-[#0a0a1a] p-4 mb-8">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video group">
                  <video ref={videoRef} src={videoUrl} className="w-full h-full" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={handleTimeUpdate} controls={false} />
                  <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all">
                    {isPlaying ? <Pause className="w-16 h-16 text-white/90 drop-shadow-2xl" /> : <Play className="w-16 h-16 text-white/90 drop-shadow-2xl ml-2" />}
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-mono">{formatTime(currentTime)} / {formatTime(videoDuration)}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== TOOLS SECTION ===== */}
          <AnimatePresence>
            {videoUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/5 bg-[#0a0a1a] overflow-hidden mb-8">
                {/* Tabs */}
                <div className="border-b border-white/5 p-2 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {/* TRIM */}
                    {activeTab === 'trim' && (
                      <motion.div key="trim" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-2"><Scissors className="w-5 h-5 text-[#00d4ff]" /><h3 className="text-lg font-bold">قص الفيديو</h3></div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="flex items-center gap-2 text-sm text-gray-300 mb-3"><Clock className="w-4 h-4 text-[#00d4ff]" />وقت البدء<span className="text-[#00d4ff] font-mono font-bold">{formatTime(startTime)}</span></label>
                            <input type="range" min={0} max={Math.max(videoDuration - 1, 1)} value={startTime} onChange={(e) => { const val = Number(e.target.value); setStartTime(val); if (val >= endTime) setEndTime(val + 1); }} className="range-slider" />
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="flex items-center gap-2 text-sm text-gray-300 mb-3"><Clock className="w-4 h-4 text-[#00d4ff]" />وقت النهاية<span className="text-[#00d4ff] font-mono font-bold">{formatTime(endTime)}</span></label>
                            <input type="range" min={startTime + 1} max={videoDuration} value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} className="range-slider" />
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <button onClick={() => processVideo('trim')} disabled={processing || !ffmpegLoaded} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)', opacity: processing || !ffmpegLoaded ? 0.5 : 1, cursor: processing || !ffmpegLoaded ? 'not-allowed' : 'pointer' }}>
                            <Scissors className="w-5 h-5" />{processing ? 'جاري القص...' : 'قص الفيديو'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* TEXT */}
                    {activeTab === 'text' && (
                      <motion.div key="text" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-2"><Type className="w-5 h-5 text-[#00d4ff]" /><h3 className="text-lg font-bold">نص على الفيديو</h3></div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="text-sm text-gray-300 mb-2 block">النص</label>
                            <input type="text" value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#00d4ff] transition-colors" placeholder="اكتب النص هنا..." />
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="text-sm text-gray-300 mb-2 block">الموقع</label>
                            <div className="flex gap-2 flex-wrap">
                              {['center', 'top', 'bottom', 'left', 'right'].map((pos) => (
                                <button key={pos} onClick={() => setTextPosition(pos)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${textPosition === pos ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'}`}>
                                  {pos === 'center' && 'الوسط'}{pos === 'top' && 'أعلى'}{pos === 'bottom' && 'أسفل'}{pos === 'left' && 'يسار'}{pos === 'right' && 'يمين'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="text-sm text-gray-300 mb-2 block">الحجم: {textSize}px</label>
                            <input type="range" min={12} max={120} value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="range-slider" />
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="text-sm text-gray-300 mb-2 block">اللون</label>
                            <div className="flex items-center gap-3">
                              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border-0" />
                              <span className="text-sm font-mono text-gray-400">{textColor}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <button onClick={() => processVideo('text')} disabled={processing || !ffmpegLoaded || !textOverlay.trim()} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)', opacity: processing || !ffmpegLoaded || !textOverlay.trim() ? 0.5 : 1 }}>
                            <Type className="w-5 h-5" />{processing ? 'جاري الإضافة...' : 'أضف النص'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* EXTRACT AUDIO */}
                    {activeTab === 'audio' && (
                      <motion.div key="audio" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="text-center space-y-6">
                        <div className="flex items-center justify-center gap-2 mb-2"><Music className="w-5 h-5 text-[#00d4ff]" /><h3 className="text-lg font-bold">استخراج الصوت</h3></div>
                        <p className="text-gray-400">استخرج المسار الصوتي من الفيديو إلى ملف MP3 عالي الجودة</p>
                        <button onClick={() => processVideo('extract-audio')} disabled={processing || !ffmpegLoaded} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)', opacity: processing || !ffmpegLoaded ? 0.5 : 1 }}>
                          <Music className="w-5 h-5" />{processing ? 'جاري الاستخراج...' : 'استخرج الصوت'}
                        </button>
                      </motion.div>
                    )}

                    {/* MUTE */}
                    {activeTab === 'mute' && (
                      <motion.div key="mute" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="text-center space-y-6">
                        <div className="flex items-center justify-center gap-2 mb-2"><VolumeX className="w-5 h-5 text-[#00d4ff]" /><h3 className="text-lg font-bold">كتم الصوت</h3></div>
                        <p className="text-gray-400">أزل المسار الصوتي بالكامل من الفيديو</p>
                        <button onClick={() => processVideo('remove-audio')} disabled={processing || !ffmpegLoaded} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #ff4444, #cc0000)', boxShadow: '0 0 25px rgba(255,68,68,0.3)', opacity: processing || !ffmpegLoaded ? 0.5 : 1 }}>
                          <VolumeX className="w-5 h-5" />{processing ? 'جاري الكتم...' : 'أزل الصوت'}
                        </button>
                      </motion.div>
                    )}

                    {/* VOLUME BOOST */}
                    {activeTab === 'volume' && (
                      <motion.div key="volume" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-2"><Volume2 className="w-5 h-5 text-[#00d4ff]" /><h3 className="text-lg font-bold">رفع مستوى الصوت</h3></div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <button onClick={() => setVolumeLevel(Math.max(0, volumeLevel - 10))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><Volume1 className="w-5 h-5" /></button>
                            <span className="text-4xl font-bold text-[#00d4ff]" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>{volumeLevel}%</span>
                            <button onClick={() => setVolumeLevel(Math.min(300, volumeLevel + 10))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><Volume2 className="w-5 h-5" /></button>
                          </div>
                          <input type="range" min={0} max={300} value={volumeLevel} onChange={(e) => setVolumeLevel(Number(e.target.value))} className="range-slider max-w-md mx-auto" />
                          <p className="text-xs text-gray-500 mt-2">100% = الصوت الأصلي | 200% = ضعف الصوت</p>
                        </div>
                        <div className="flex justify-center">
                          <button onClick={() => processVideo('volume-boost')} disabled={processing || !ffmpegLoaded} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)', opacity: processing || !ffmpegLoaded ? 0.5 : 1 }}>
                            <Volume2 className="w-5 h-5" />{processing ? 'جاري الرفع...' : `ارفع الصوت إلى ${volumeLevel}%`}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* REPLACE AUDIO */}
                    {activeTab === 'replace' && (
                      <motion.div key="replace" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-2"><Replace className="w-5 h-5 text-[#00d4ff]" /><h3 className="text-lg font-bold">استبدال الصوت</h3></div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
                          <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioFileChange} className="hidden" />
                          {!audioFile ? (
                            <button onClick={() => audioInputRef.current?.click()} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00d4ff]/30 transition-all">
                              <Upload className="w-5 h-5 text-[#00d4ff]" />اختر ملف صوتي (MP3, WAV)
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-3">
                              <Music className="w-5 h-5 text-[#00d4ff]" />
                              <span className="text-[#00d4ff] font-medium">{audioFile.name}</span>
                              <button onClick={() => { setAudioFile(null); setAudioUrl(null); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          )}
                          {audioUrl && <audio controls className="w-full mt-4 max-w-md mx-auto" src={audioUrl} />}
                        </div>
                        <div className="flex justify-center">
                          <button onClick={() => processVideo('replace-audio')} disabled={processing || !ffmpegLoaded || (!audioFile && !recordedBlob)} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)', opacity: processing || !ffmpegLoaded || (!audioFile && !recordedBlob) ? 0.5 : 1 }}>
                            <Replace className="w-5 h-5" />{processing ? 'جاري الاستبدال...' : 'استبدل الصوت'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* VOICEOVER */}
                    {activeTab === 'voiceover' && (
                      <motion.div key="voiceover" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-2"><Mic className="w-5 h-5 text-[#00d4ff]" /><h3 className="text-lg font-bold">تسجيل صوتي (Voiceover)</h3></div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
                          {!recordedBlob ? (
                            <div className="space-y-4">
                              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-[#00d4ff]/10'}`}>
                                {isRecording ? <MicOff className="w-10 h-10 text-red-400" /> : <Mic className="w-10 h-10 text-[#00d4ff]" />}
                              </div>
                              {isRecording && <div className="text-2xl font-mono font-bold text-red-400">{formatTime(recordingTime)}</div>}
                              <button onClick={isRecording ? stopRecording : startRecording} className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`} style={!isRecording ? { background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)' } : {}}>
                                {isRecording ? <><MicOff className="w-5 h-5" /> إيقاف التسجيل</> : <><Mic className="w-5 h-5" /> ابدأ التسجيل</>}
                              </button>
                              <p className="text-xs text-gray-500">{isRecording ? 'اضغط لإيقاف التسجيل' : 'اضغط لبدء التسجيل من المايكروفون'}</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-2 text-green-400">
                                <CheckCircle className="w-5 h-5" /><span className="font-bold">تم التسجيل بنجاح!</span><span className="text-gray-400">({formatTime(recordingTime)})</span>
                              </div>
                              <audio controls className="w-full max-w-md mx-auto" src={URL.createObjectURL(recordedBlob)} />
                              <div className="flex justify-center gap-3">
                                <button onClick={clearRecording} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"><RotateCcw className="w-4 h-4" />تسجيل جديد</button>
                                <button onClick={() => processVideo('add-voiceover')} disabled={processing || !ffmpegLoaded} className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)', opacity: processing || !ffmpegLoaded ? 0.5 : 1 }}>
                                  <Wand2 className="w-4 h-4" />{processing ? 'جاري الإضافة...' : 'أضف للفيديو'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* DOWNLOAD FROM SOCIAL MEDIA */}
                    {activeTab === 'download' && (
                      <motion.div key="download" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-5 h-5 text-[#00d4ff]" />
                          <h3 className="text-lg font-bold">تحميل من المنصات</h3>
                          <span className="text-xs text-gray-500">YouTube, TikTok, X, Facebook, Instagram وغيرها</span>
                        </div>

                        {/* URL Input */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <label className="text-sm text-gray-300 mb-2 block">رابط الفيديو</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                              <input
                                type="url"
                                value={downloadUrl}
                                onChange={(e) => setDownloadUrl(e.target.value)}
                                className="w-full bg-[#050510] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4ff] transition-colors"
                                placeholder="https://youtube.com/watch?v=... أو https://tiktok.com/..."
                              />
                            </div>
                            <button
                              onClick={copyToClipboard}
                              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                              title="نسخ الرابط"
                            >
                              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                            </button>
                          </div>

                          {/* Platform Detection */}
                          {downloadUrl && platformInfo && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-gray-500">المنصة المكتشفة:</span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${platformInfo.color}20`, color: platformInfo.color, border: `1px solid ${platformInfo.color}40` }}>
                                <platformInfo.icon className="w-3.5 h-3.5" />
                                {platformInfo.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Download Links */}
                        {downloadUrl && downloadInfo && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Video Downloaders */}
                            <div>
                              <h5 className="text-sm font-bold text-[#00d4ff] mb-3 flex items-center gap-2">
                                <Video className="w-4 h-4" />خدمات تحميل الفيديو
                              </h5>
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {downloadInfo.links.filter(l => l.type === 'video').map((link, i) => (
                                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 transition-all group"
                                    onClick={() => { if (link.url.includes('ssstik') || link.url.includes('y2mate')) { window.open(link.url, '_blank'); } }}>
                                    <div className="flex items-center gap-2">
                                      <Download className="w-4 h-4 text-gray-400 group-hover:text-[#00d4ff]" />
                                      <span className="text-sm font-medium">{link.name}</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-gray-500" />
                                  </a>
                                ))}
                              </div>
                            </div>

                            {/* Audio Downloaders */}
                            {downloadInfo.links.filter(l => l.type === 'audio').length > 0 && (
                              <div>
                                <h5 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                                  <Music className="w-4 h-4" />خدمات تحميل الصوت فقط
                                </h5>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {downloadInfo.links.filter(l => l.type === 'audio').map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-green-400/30 hover:bg-green-400/5 transition-all group">
                                      <div className="flex items-center gap-2">
                                        <Music className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
                                        <span className="text-sm font-medium">{link.name}</span>
                                      </div>
                                      <ExternalLink className="w-3 h-3 text-gray-500" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Supported Platforms Grid */}
                        {!downloadUrl && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[
                              { name: 'YouTube', color: '#FF0000', icon: Youtube },
                              { name: 'TikTok', color: '#00f2ea', icon: Smartphone },
                              { name: 'X / Twitter', color: '#1DA1F2', icon: Twitter },
                              { name: 'Facebook', color: '#1877F2', icon: Facebook },
                              { name: 'Instagram', color: '#E4405F', icon: Smartphone },
                            ].map((p) => (
                              <div key={p.name} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                                <p.icon className="w-8 h-8" style={{ color: p.color }} />
                                <span className="text-xs font-bold text-gray-300">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== PROGRESS ===== */}
          <AnimatePresence>
            {processing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-[#00d4ff]/20 bg-[#0a0a1a] p-6 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300 flex items-center gap-2"><Loader2 className="w-4 h-4 text-[#00d4ff] animate-spin" />جاري المعالجة...</span>
                  <span className="text-sm font-bold text-[#00d4ff]">{progress}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #00d4ff, #0066ff)' }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== OUTPUT ===== */}
          <AnimatePresence>
            {outputUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-green-500/20 bg-[#0a0a1a] p-6 mb-8">
                <div className="flex items-center gap-2 mb-4"><CheckCircle className="w-6 h-6 text-green-400" /><h3 className="text-lg font-bold text-green-400">تمت المعالجة بنجاح!</h3></div>
                {outputName.endsWith('.mp3') ? <audio controls className="w-full mb-4 rounded-xl" src={outputUrl} /> : <video controls className="w-full rounded-xl mb-4" src={outputUrl} />}
                <div className="flex flex-wrap gap-3">
                  <a href={outputUrl} download={outputName} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 25px rgba(0,212,255,0.3)' }}>
                    <Download className="w-5 h-5" />تحميل {outputName}
                  </a>
                  <button onClick={() => { setOutputUrl(null); setOutputName(''); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"><X className="w-5 h-5" />إغلاق</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== MESSAGE ===== */}
          <AnimatePresence>
            {message.text && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`rounded-xl p-4 flex items-center gap-3 border ${message.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : message.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' : message.type === 'loading' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' : 'border-white/10 bg-white/5 text-gray-300'}`}>
                {message.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
                <span className="text-sm">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-white/5 py-8 text-center">
          <p className="text-gray-500 text-sm mb-3">
            The Cook Rat — Made by{' '}
            <a href="https://x.com/mouse0000000" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] hover:underline">@mouse0000000</a>
          </p>
          <a href="https://x.com/mouse0000000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 hover:border-[#00d4ff]/30 transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Follow on X
          </a>
        </footer>
      </div>
    </>
  );
}
