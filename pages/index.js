import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { 
  Scissors, Type, Music, VolumeX, Download, Upload, 
  Play, Pause, Flame, MousePointer2, Film, Clock, 
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ text: '👋 مرحباً! اختر فيديو للبدء', type: 'info' });
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [textOverlay, setTextOverlay] = useState('🐭 The Cook Rat');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('trim');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const ffmpegRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // تحميل FFmpeg ديناميكياً (SSR-safe)
  useEffect(() => {
    let mounted = true;
    
    const loadFFmpeg = async () => {
      try {
        setMessage({ text: '⏳ جاري تحميل FFmpeg...', type: 'loading' });
        
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { toBlobURL } = await import('@ffmpeg/util');
        
        if (!mounted) return;
        
        const ffmpeg = new FFmpeg();
        
        ffmpeg.on('log', ({ message: msg }) => {
          if (msg?.includes('error') || msg?.includes('Error')) {
            console.warn('FFmpeg:', msg);
          }
        });
        
        ffmpeg.on('progress', ({ progress: p }) => {
          if (mounted) setProgress(Math.min(Math.round(p * 100), 99));
        });
        
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        if (mounted) {
          ffmpegRef.current = ffmpeg;
          setFfmpegLoaded(true);
          setMessage({ text: '✅ FFmpeg جاهز! اختر فيديو للبدء', type: 'success' });
        }
      } catch (err) {
        console.error('FFmpeg load error:', err);
        if (mounted) {
          setMessage({ text: '⚠️ تعذر تحميل FFmpeg. حاول تحديث الصفحة.', type: 'error' });
        }
      }
    };
    
    loadFFmpeg();
    return () => { mounted = false; };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      setMessage({ text: '❌ يرجى اختيار ملف فيديو صالح', type: 'error' });
      return;
    }
    
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setOutputUrl(null);
    setOutputName('');
    setMessage({ text: `📁 تم اختيار: ${file.name}`, type: 'success' });
    
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      const duration = Math.floor(tempVideo.duration);
      setVideoDuration(duration);
      setEndTime(Math.min(duration, 10));
      URL.revokeObjectURL(tempVideo.src);
    };
    tempVideo.src = url;
  };

  const getExtension = (filename) => {
    return filename.substring(filename.lastIndexOf('.')) || '.mp4';
  };

  const processVideo = async (command) => {
    if (!ffmpegRef.current || !videoFile) {
      setMessage({ text: '⚠️ يرجى اختيار فيديو أولاً', type: 'error' });
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    setOutputUrl(null);
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
          
        case 'extract-audio':
          outputFile = 'audio.mp3';
          args.push('-vn', '-acodec', 'libmp3lame', '-q:a', '2');
          break;
          
        case 'remove-audio':
          outputFile = `no-audio${ext}`;
          args.push('-c', 'copy', '-an');
          break;
          
        case 'text':
          outputFile = `text${ext}`;
          const safeText = textOverlay.replace(/'/g, "'\\\\''").replace(/:/g, '\\:');
          args.push(
            '-vf',
            `drawtext=text='${safeText}':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=(h-text_h)/2`,
            '-c:a', 'copy'
          );
          break;
          
        default:
          throw new Error('أمر غير معروف');
      }
      
      args.push('-y', outputFile);
      await ffmpeg.exec(args);
      
      const data = await ffmpeg.readFile(outputFile);
      const mimeType = outputFile.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4';
      const blob = new Blob([data.buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setOutputUrl(url);
      setOutputName(outputFile);
      setProgress(100);
      setMessage({ text: '✅ تمت المعالجة بنجاح!', type: 'success' });
      
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputFile);
      } catch (_) {}
      
    } catch (err) {
      console.error('Processing error:', err);
      setMessage({ text: '❌ خطأ: ' + (err.message || 'فشلت المعالجة'), type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const tabs = [
    { id: 'trim', label: '✂️ قص', icon: Scissors },
    { id: 'text', label: '📝 نص', icon: Type },
    { id: 'audio', label: '🎙️ صوت', icon: Music },
    { id: 'mute', label: '🔇 كتم', icon: VolumeX },
  ];

  return (
    <>
      <Head>
        <title>🐭 The Cook Rat - AI Video Editor</title>
        <meta name="description" content="محرر فيديو ذكي بالذكاء الاصطناعي" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-darker text-white font-tajawal">
        {/* Header */}
        <header className="border-b border-white/5 bg-dark/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative"
              >
                <MousePointer2 className="w-8 h-8 text-primary animate-logo-fire" />
                <Flame className="w-4 h-4 text-primary-glow absolute -top-1 -right-1 animate-pulse" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-glow">The Cook Rat</h1>
                <p className="text-xs text-gray-400">AI Video Editor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                ffmpegLoaded 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {ffmpegLoaded ? '🟢 جاهز' : '🟡 جاري التحميل...'}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-8 text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="btn-primary text-lg flex items-center gap-3 mx-auto"
            >
              <Upload className="w-5 h-5" />
              اختر فيديو
            </motion.button>
            
            <p className="mt-3 text-gray-400 text-sm">
              MP4, MOV, AVI, MKV — الحد الأقصى يعتمد على ذاكرة المتصفح
            </p>
            
            {videoFile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center justify-center gap-2 text-primary"
              >
                <Film className="w-4 h-4" />
                <span className="text-sm">{videoFile.name}</span>
                <span className="text-gray-500 text-xs">
                  ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Video Preview */}
          {videoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-4 mb-8"
            >
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls={false}
                />
                
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-16 h-16 text-white/80 drop-shadow-lg" />
                  ) : (
                    <Play className="w-16 h-16 text-white/80 drop-shadow-lg ml-2" />
                  )}
                </button>
                
                {videoDuration > 0 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-lg text-sm">
                    ⏱️ {formatTime(videoDuration)}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tools */}
          {videoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 mb-8"
            >
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'trim' && (
                  <motion.div
                    key="trim"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <Clock className="w-4 h-4 inline ml-1" />
                          وقت البدء: {formatTime(startTime)}
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(videoDuration - 1, 1)}
                          value={startTime}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setStartTime(val);
                            if (val >= endTime) setEndTime(val + 1);
                          }}
                          className="range-slider"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <Clock className="w-4 h-4 inline ml-1" />
                          وقت النهاية: {formatTime(endTime)}
                        </label>
                        <input
                          type="range"
                          min={startTime + 1}
                          max={videoDuration}
                          value={endTime}
                          onChange={(e) => setEndTime(Number(e.target.value))}
                          className="range-slider"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        onClick={() => processVideo('trim')}
                        disabled={processing || !ffmpegLoaded}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Scissors className="w-5 h-5" />
                        {processing ? 'جاري القص...' : 'قص الفيديو'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'text' && (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        <Type className="w-4 h-4 inline ml-1" />
                        النص المراد إضافته
                      </label>
                      <input
                        type="text"
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        className="input-field w-full text-right"
                        placeholder="اكتب النص هنا..."
                      />
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        onClick={() => processVideo('text')}
                        disabled={processing || !ffmpegLoaded || !textOverlay.trim()}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Type className="w-5 h-5" />
                        {processing ? 'جاري الإضافة...' : 'أضف النص'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'audio' && (
                  <motion.div
                    key="audio"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-center space-y-6"
                  >
                    <p className="text-gray-400">
                      استخراج المسار الصوتي من الفيديو إلى ملف MP3
                    </p>
                    
                    <button
                      onClick={() => processVideo('extract-audio')}
                      disabled={processing || !ffmpegLoaded}
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <Music className="w-5 h-5" />
                      {processing ? 'جاري الاستخراج...' : 'استخرج الصوت'}
                    </button>
                  </motion.div>
                )}

                {activeTab === 'mute' && (
                  <motion.div
                    key="mute"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-center space-y-6"
                  >
                    <p className="text-gray-400">
                      إزالة المسار الصوتي بالكامل من الفيديو
                    </p>
                    
                    <button
                      onClick={() => processVideo('remove-audio')}
                      disabled={processing || !ffmpegLoaded}
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <VolumeX className="w-5 h-5" />
                      {processing ? 'جاري الكتم...' : 'أزل الصوت'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Progress */}
          {processing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">جاري المعالجة...</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Output */}
          {outputUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 mb-8"
            >
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                النتيجة
              </h3>
              
              {outputName.endsWith('.mp3') ? (
                <audio controls className="w-full mb-4" src={outputUrl} />
              ) : (
                <video controls className="w-full rounded-xl mb-4" src={outputUrl} />
              )}
              
              <a
                href={outputUrl}
                download={outputName}
                className="btn-primary flex items-center gap-2 w-fit"
              >
                <Download className="w-5 h-5" />
                تحميل {outputName}
              </a>
            </motion.div>
          )}

          {/* Message */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`glass-card p-4 flex items-center gap-3 ${
                  message.type === 'error' ? 'border-red-500/30 bg-red-500/10' :
                  message.type === 'success' ? 'border-green-500/30 bg-green-500/10' :
                  message.type === 'loading' ? 'border-yellow-500/30 bg-yellow-500/10' :
                  'border-white/10'
                }`}
              >
                {message.type === 'loading' && <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />}
                {message.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                {message.type === 'info' && <MousePointer2 className="w-5 h-5 text-primary" />}
                <span className="text-sm">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 text-center text-gray-500 text-sm">
          <p>🐭 The Cook Rat — Made with ❤️ by <a href="https://x.com/0000000000388p" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@mouse0000000</a></p>
          <p className="mt-1 text-xs opacity-50">Powered by FFmpeg.wasm & Next.js</p>
        </footer>
      </div>
    </>
  );
}
