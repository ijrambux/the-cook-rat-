import { useState, useRef, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { 
  Upload, Play, Download, Scissors, Volume2, Type, 
  Film, Settings, Loader2, CheckCircle, AlertCircle,
  Clock, Wand2, Languages, Sparkles, Zap, Flame,
  ChevronDown, ChevronUp, Trash2, RotateCcw, Mouse,
  Video, AudioLines, Subtitles, Crop, Gauge
} from 'lucide-react';

const APP = {
  name: 'The Cook Rat',
  version: '1.0.0',
  author: 'https://x.com/mouse0000000',
  x: '@mouse0000000'
};

const T = {
  ar: {
    uploadTitle: 'ارفع فيديوك هنا',
    uploadDesc: 'MP4, MOV, WEBM - اسحب الملف أو انقر',
    newBtn: 'جديد',
    analyzeBtn: 'معالجة بالذكاء الاصطناعي',
    processing: 'جاري المعالجة...',
    transcript: 'النص المستخرج',
    cuts: 'القصوات المقترحة',
    keep: 'احتفظ',
    remove: 'احذف',
    filler: 'كلمة حشو',
    willRemove: 'سيتم حذفها',
    finalVideo: 'الفيديو النهائي',
    download: 'تحميل الفيديو',
    subtitles: 'الترجمة',
    language: 'اللغة',
    aspect: 'نسبة العرض',
    smartCut: 'قص ذكي',
    smartCutDesc: 'اكتشاف وحذف الكلمات الحشوية',
    audioProcess: 'معالجة صوتية',
    audioDesc: 'Fades سلسة عند كل قص',
    autoSub: 'ترجمة تلقائية',
    autoSubDesc: 'حرق الترجمة على الفيديو',
    step1: 'تحميل FFmpeg...',
    step2: 'تحليل الفيديو...',
    step3: 'استخراج النص...',
    step4: 'معالجة القصوات...',
    step5: 'تركيب الفيديو...',
    done: 'تم!',
    error: 'خطأ',
    enterTopic: 'أدخل موضوع الفيديو',
    customScript: 'السيناريو المخصص',
    generate: 'إنشاء فيديو',
    footer: 'صُنع بـ ❤️ بواسطة',
    contact: 'للتواصل',
    trim: 'قص الفيديو',
    trimStart: 'بداية القص (ثواني)',
    trimEnd: 'نهاية القص (ثواني)',
    applyTrim: 'تطبيق القص',
    removeAudio: 'إزالة الصوت',
    extractAudio: 'استخراج الصوت',
    addText: 'إضافة نص',
    textOverlay: 'النص المراد إضافته',
    textSize: 'حجم الخط',
    textY: 'موقع النص من الأسفل',
    applyText: 'تطبيق النص',
    resolution: 'الدقة',
    fps: 'معدل الإطارات',
    quality: 'جودة التصدير',
    processingReal: 'جاري المعالجة الحقيقية عبر FFmpeg.wasm',
    loadingFFmpeg: 'تحميل FFmpeg.wasm (أول مرة قد تستغرق 30 ثانية)...',
  },
  en: {
    uploadTitle: 'Upload Your Video',
    uploadDesc: 'MP4, MOV, WEBM - Drag file or click',
    newBtn: 'New',
    analyzeBtn: 'AI Process',
    processing: 'Processing...',
    transcript: 'Extracted Transcript',
    cuts: 'Suggested Cuts',
    keep: 'Keep',
    remove: 'Remove',
    filler: 'Filler word',
    willRemove: 'Will be removed',
    finalVideo: 'Final Video',
    download: 'Download Video',
    subtitles: 'Subtitles',
    language: 'Language',
    aspect: 'Aspect Ratio',
    smartCut: 'Smart Cut',
    smartCutDesc: 'Detect and remove filler words',
    audioProcess: 'Audio Processing',
    audioDesc: 'Smooth fades at every cut',
    autoSub: 'Auto Subtitles',
    autoSubDesc: 'Burn subtitles on video',
    step1: 'Loading FFmpeg...',
    step2: 'Analyzing video...',
    step3: 'Extracting transcript...',
    step4: 'Processing cuts...',
    step5: 'Composing video...',
    done: 'Done!',
    error: 'Error',
    enterTopic: 'Enter video topic',
    customScript: 'Custom Script',
    generate: 'Generate Video',
    footer: 'Made with ❤️ by',
    contact: 'Contact',
    trim: 'Trim Video',
    trimStart: 'Trim Start (seconds)',
    trimEnd: 'Trim End (seconds)',
    applyTrim: 'Apply Trim',
    removeAudio: 'Remove Audio',
    extractAudio: 'Extract Audio',
    addText: 'Add Text Overlay',
    textOverlay: 'Text to overlay',
    textSize: 'Font Size',
    textY: 'Text position from bottom',
    applyText: 'Apply Text',
    resolution: 'Resolution',
    fps: 'Frame Rate',
    quality: 'Export Quality',
    processingReal: 'Processing with real FFmpeg.wasm',
    loadingFFmpeg: 'Loading FFmpeg.wasm (first time may take 30s)...',
  }
};

export default function Home() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [language, setLanguage] = useState('ar');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [overlayText, setOverlayText] = useState('');
  const [textSize, setTextSize] = useState(24);
  const [textY, setTextY] = useState(100);
  const [resolution, setResolution] = useState('1080');
  const [fps, setFps] = useState(30);
  const [activeTab, setActiveTab] = useState('upload');

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);

  const t = T[language] || T.en;

  // Load FFmpeg.wasm
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    setStatus(t.loadingFFmpeg);
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    await ffmpeg.load();
    ffmpegRef.current = ffmpeg;
    setFfmpegLoaded(true);
    return ffmpeg;
  }, [t.loadingFFmpeg]);

  // Particle animation
  useEffect(() => {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert(language === 'ar' ? 'الرجاء اختيار ملف فيديو' : 'Please select a video file');
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setOutputUrl(null);
    setActiveTab('editor');

    // Get video duration
    const vid = document.createElement('video');
    vid.src = url;
    vid.onloadedmetadata = () => {
      setVideoDuration(vid.duration);
      setTrimEnd(Math.floor(vid.duration));
    };
  }, [language]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); };

  // REAL FFmpeg Processing
  const processVideo = useCallback(async (operation) => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      setStatus(t.loadingFFmpeg);
      setProgress(10);
      const ffmpeg = await loadFFmpeg();
      const { fetchFile } = await import('@ffmpeg/util');

      setStatus(t.step2);
      setProgress(25);
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      setStatus(t.step4);
      setProgress(50);

      let args = ['-i', 'input.mp4'];
      let vf = [];
      let af = [];

      // Trim
      if (operation === 'trim' && trimStart >= 0 && trimEnd > trimStart) {
        args.push('-ss', String(trimStart));
        args.push('-t', String(trimEnd - trimStart));
      }

      // Remove audio
      if (operation === 'removeAudio') {
        args.push('-an');
      }

      // Scale/Resolution
      const resMap = { '720': '1280:720', '1080': '1920:1080', '480': '854:480' };
      if (resMap[resolution]) {
        vf.push(`scale=${resMap[resolution]}`);
      }

      // FPS
      if (fps && fps !== 30) {
        args.push('-r', String(fps));
      }

      // Text overlay
      if (operation === 'addText' && overlayText) {
        const safeText = overlayText.replace(/'/g, "\\'\\'").replace(/:/g, '\\:');
        vf.push(`drawtext=text='${safeText}':fontsize=${textSize}:fontcolor=white:box=1:boxcolor=black@0.6:x=(w-text_w)/2:y=h-${textY}:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`);
      }

      // Apply video filters
      if (vf.length > 0) {
        args.push('-vf', vf.join(','));
      }

      // Apply audio filters
      if (af.length > 0) {
        args.push('-af', af.join(','));
      }

      // Output settings
      args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
      if (operation !== 'removeAudio') {
        args.push('-c:a', 'aac', '-b:a', '128k');
      }
      args.push('-movflags', '+faststart', '-y', 'output.mp4');

      setStatus(t.step5);
      setProgress(75);
      await ffmpeg.exec(args);

      setProgress(90);
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setProgress(100);
      setStatus(t.done);
      setActiveTab('output');

    } catch (err) {
      console.error('FFmpeg error:', err);
      setStatus(t.error + ': ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [videoFile, loadFFmpeg, t, trimStart, trimEnd, resolution, fps, overlayText, textSize, textY]);

  // Extract audio
  const extractAudio = useCallback(async () => {
    if (!videoFile) return;
    setIsProcessing(true);

    try {
      const ffmpeg = await loadFFmpeg();
      const { fetchFile } = await import('@ffmpeg/util');

      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
      await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-q:a', '2', 'audio.mp3', '-y']);

      const data = await ffmpeg.readFile('audio.mp3');
      const blob = new Blob([data.buffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'the-cook-rat-audio.mp3';
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [videoFile, loadFFmpeg]);

  const downloadVideo = () => {
    if (outputUrl) {
      const a = document.createElement('a');
      a.href = outputUrl;
      a.download = 'the-cook-rat-edited.mp4';
      a.click();
    }
  };

  const reset = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setOutputUrl(null);
    setActiveTab('upload');
    setTrimStart(0);
    setTrimEnd(0);
    setOverlayText('');
  };

  return (
    <>
      <Head>
        <title>The Cook Rat - AI Video Editor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐭</text></svg>" />
      </Head>

      <canvas id="particleCanvas" className="fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen">

        {/* HEADER with Animated Blue Blazing Logo */}
        <header className="text-center py-10 px-4">
          <div className="logo-container mb-4">
            <div className="logo-glow" />
            <div className="logo-shine" />
            <h1 className="logo-text">
              The Cook Rat
              <span className="logo-icon">🐭</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg mb-2">
            {language === 'ar' ? 'محرر فيديو ذكي بالذكاء الاصطناعي' : 'AI-Powered Smart Video Editor'}
          </p>
          <div className="laser-line max-w-md mx-auto mb-3" />
          <a 
            href="https://x.com/mouse0000000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-glow transition-colors font-bold text-sm"
          >
            <Flame className="w-4 h-4 animate-pulse" />
            <Mouse className="w-4 h-4" />
            𝕏 @mouse0000000
            <Mouse className="w-4 h-4" />
            <Flame className="w-4 h-4 animate-pulse" />
          </a>
        </header>

        <div className="max-w-6xl mx-auto px-4 pb-20">

          {/* Settings Bar */}
          <div className="glass-card p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-primary" />
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none text-sm"
                  >
                    <option value="ar">🇸🇦 العربية</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="fr">🇫🇷 Français</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <span className="text-xs text-gray-500">
                    FFmpeg: {ffmpegLoaded ? '✅ Ready' : '⏳ Not loaded'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-colors"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-white/10 grid md:grid-cols-4 gap-4 animate-slide-in">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t.resolution}</label>
                  <select 
                    value={resolution} 
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="720">720p</option>
                    <option value="1080">1080p</option>
                    <option value="480">480p</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t.fps}</label>
                  <select 
                    value={fps} 
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value={24}>24</option>
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t.quality}</label>
                  <select className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Format</label>
                  <select className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none">
                    <option>MP4</option>
                    <option>WEBM</option>
                    <option>MOV</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* UPLOAD SECTION */}
          {!videoUrl ? (
            <>
              <div 
                className={`upload-zone rounded-2xl p-16 text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="relative inline-block mb-6">
                  <Upload className="w-20 h-20 text-primary mx-auto" />
                  <Sparkles className="w-6 h-6 text-primary-glow absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t.uploadTitle}</h3>
                <p className="text-gray-400 mb-6">{t.uploadDesc}</p>
                <button className="btn-primary">
                  <Upload className="w-5 h-5 inline mr-2" />
                  {language === 'ar' ? 'اختر ملف' : 'Choose File'}
                </button>
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                {[
                  { icon: <Scissors className="w-10 h-10" />, title: t.smartCut, desc: t.smartCutDesc },
                  { icon: <AudioLines className="w-10 h-10" />, title: t.audioProcess, desc: t.audioDesc },
                  { icon: <Subtitles className="w-10 h-10" />, title: t.autoSub, desc: t.autoSubDesc },
                ].map((feature, i) => (
                  <div key={i} className="glass-card p-8 text-center hover:border-primary/30 transition-all group">
                    <div className="text-primary mb-4 flex justify-center group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* LEFT: Video Player & Controls */}
              <div className="space-y-4">
                <div className="glass-card p-4">
                  <video ref={videoRef} src={outputUrl || videoUrl} controls className="w-full rounded-xl" style={{ maxHeight: '400px' }} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button onClick={reset} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> {t.newBtn}
                  </button>
                  <button onClick={extractAudio} disabled={isProcessing} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                    <AudioLines className="w-4 h-4" /> {t.extractAudio}
                  </button>
                </div>

                {/* Progress */}
                {isProcessing && (
                  <div className="glass-card p-5">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-primary font-medium">{status}</span>
                      <span className="text-primary font-bold">{progress}%</span>
                    </div>
                    <div className="progress-glow">
                      <div className="progress-glow-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t.processingReal}</p>
                  </div>
                )}

                {/* Output */}
                {outputUrl && (
                  <div className="glass-card p-5 border-primary/30 animate-slide-in">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-400">
                      <Sparkles className="w-5 h-5" /> {t.finalVideo}
                    </h3>
                    <button onClick={downloadVideo} className="w-full btn-primary flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" /> {t.download}
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT: Editor Tools */}
              <div className="space-y-4">

                {/* Trim Tool */}
                <div className="glass-card p-5">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                    <Crop className="w-5 h-5" /> {t.trim}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t.trimStart}</label>
                      <input 
                        type="number" 
                        min={0} 
                        max={videoDuration} 
                        value={trimStart}
                        onChange={(e) => setTrimStart(Number(e.target.value))}
                        className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t.trimEnd}</label>
                      <input 
                        type="number" 
                        min={0} 
                        max={videoDuration} 
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(Number(e.target.value))}
                        className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={videoDuration} 
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    className="w-full mb-2 accent-primary"
                  />
                  <input 
                    type="range" 
                    min={0} 
                    max={videoDuration} 
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    className="w-full mb-4 accent-primary"
                  />
                  <button onClick={() => processVideo('trim')} disabled={isProcessing} className="w-full btn-primary">
                    <Scissors className="w-4 h-4 inline mr-2" /> {t.applyTrim}
                  </button>
                </div>

                {/* Text Overlay */}
                <div className="glass-card p-5">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                    <Type className="w-5 h-5" /> {t.addText}
                  </h3>
                  <input 
                    type="text" 
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder={t.textOverlay}
                    className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-white mb-3 focus:border-primary focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t.textSize}</label>
                      <input 
                        type="number" 
                        value={textSize}
                        onChange={(e) => setTextSize(Number(e.target.value))}
                        className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t.textY}</label>
                      <input 
                        type="number" 
                        value={textY}
                        onChange={(e) => setTextY(Number(e.target.value))}
                        className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <button onClick={() => processVideo('addText')} disabled={isProcessing} className="w-full btn-primary">
                    <Type className="w-4 h-4 inline mr-2" /> {t.applyText}
                  </button>
                </div>

                {/* Audio Tools */}
                <div className="glass-card p-5">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                    <Volume2 className="w-5 h-5" /> Audio
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => processVideo('removeAudio')} disabled={isProcessing} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50">
                      <Volume2 className="w-4 h-4 inline mr-2" /> {t.removeAudio}
                    </button>
                    <button onClick={extractAudio} disabled={isProcessing} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50">
                      <AudioLines className="w-4 h-4 inline mr-2" /> {t.extractAudio}
                    </button>
                  </div>
                </div>

                {/* AI Process */}
                <div className="glass-card p-5 border-primary/20">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                    <Wand2 className="w-5 h-5" /> {t.analyzeBtn}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {language === 'ar' 
                      ? 'معالجة ذكية: قص، ترجمة، معالجة صوتية' 
                      : 'Smart processing: cut, subtitle, audio'}
                  </p>
                  <button onClick={() => processVideo('ai')} disabled={isProcessing} className="w-full btn-primary">
                    <Zap className="w-5 h-5 inline mr-2" /> {t.analyzeBtn}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/5 mt-12">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-2">
            <Mouse className="w-4 h-4 text-primary" />
            <span>{t.footer}</span>
            <a href="https://x.com/mouse0000000" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-glow font-bold">
              The Cook Rat
            </a>
            <Mouse className="w-4 h-4 text-primary" />
          </div>
          <p className="text-gray-600 text-xs">
            {t.contact}: <a href="https://x.com/mouse0000000" className="text-primary/60 hover:text-primary">x.com/mouse0000000</a>
          </p>
        </footer>
      </div>
    </>
  );
}
