
import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Coffee, Heart, Copy, Check, X } from 'lucide-react';
import { geminiService } from './services/geminiService';
import { TranscriptionResult, ProcessingOptions, VoiceName, TargetLanguage } from './types';
import { VOICE_PROFILES, MAX_FILE_SIZE, COOLDOWN_SECONDS, ESTIMATED_TOTAL_SECONDS, DONATION_INFO } from './constants';
import { fileToBase64, decode, pcmToWav } from './utils/audioUtils';

const GoldHeader: React.FC<{ 
  darkMode: boolean; 
  toggleTheme: () => void; 
  onShowHelp: () => void;
  onShowCoffee: () => void;
}> = ({ darkMode, toggleTheme, onShowHelp, onShowCoffee }) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="bg-white/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-emerald-500/10 py-3 px-8 sticky top-0 z-50 transition-all">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">ZEGO <span className="text-emerald-500">TECH</span></h1>
            <p className="text-[7px] font-black text-slate-400 dark:text-emerald-400/60 uppercase tracking-[0.3em] mt-1">Production • Premium Localizer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onShowCoffee}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20 border border-amber-400/20 group"
          >
            <Coffee className="w-4 h-4 group-hover:animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Buy me a coffee</span>
          </button>
          <button 
            onClick={onShowHelp} 
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent dark:border-white/5" 
            aria-label="Open Help Guide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-emerald-950/20 text-slate-600 dark:text-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent dark:border-emerald-500/10 hidden sm:flex" 
            title="Fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
          </button>
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-emerald-950/20 text-slate-600 dark:text-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent dark:border-emerald-500/10"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pro_voice_gold_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [result, setResult] = useState<TranscriptionResult & { metadata?: any }>({ text: '', status: 'idle' });
  const [options, setOptions] = useState<ProcessingOptions>({
    voice: VoiceName.CHARON,
    pitch: 'normal',
    targetLanguage: TargetLanguage.BURMESE,
    speed: 1.0 
  });
  
  const [processingStep, setProcessingStep] = useState<string>('');
  const [subProgress, setSubProgress] = useState<string>('');
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  const [initialEstimatedSeconds, setInitialEstimatedSeconds] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBundling, setIsBundling] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCoffee, setShowCoffee] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [manualKey, setManualKey] = useState(() => localStorage.getItem('zegotech_manual_api_key') || '');

  const size = 160;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const checkKey = async () => {
      try {
        // First check manual key
        if (manualKey) {
          setNeedsKey(false);
          return;
        }

        // Then check AI Studio platform key
        // @ts-ignore
        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
          setNeedsKey(true);
        } else if (!window.aistudio && !manualKey) {
          // On custom domain without manual key
          setNeedsKey(true);
        }
      } catch (e) {
        console.error("Key check failed", e);
        if (!manualKey) setNeedsKey(true);
      }
    };
    checkKey();
  }, [manualKey]);

  const saveManualKey = (key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      localStorage.setItem('zegotech_manual_api_key', trimmedKey);
      setManualKey(trimmedKey);
      setNeedsKey(false);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('pro_voice_gold_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: any;
    if (result.status === 'processing' && estimatedSeconds > 0) {
      interval = setInterval(() => {
        setEstimatedSeconds(prev => (prev > 1 ? prev - 1 : 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [result.status, estimatedSeconds]);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => setCooldown(prev => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const resetProject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if ((window as any).proAudioUrl) {
      URL.revokeObjectURL((window as any).proAudioUrl);
    }
    (window as any).proAudioUrl = null;
    (window as any).proAudioBlob = null;
    
    setResult({ text: '', status: 'idle' });
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setEstimatedSeconds(0);
    setInitialEstimatedSeconds(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (cooldown > 0) return;
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResult({ ...result, status: 'processing', text: '' });
    setEstimatedSeconds(ESTIMATED_TOTAL_SECONDS);
    setInitialEstimatedSeconds(ESTIMATED_TOTAL_SECONDS);
    setProcessingStep('1/3: ANALYZING MEDIA');
    setSubProgress('Initializing Precision Engine...');
    
    try {
      const vidDurationPromise = getVideoDuration(file);
      const base64Promise = fileToBase64(file);
      
      const vidDuration = await vidDurationPromise;
      const base64 = await base64Promise;

      const scaledEstimation = Math.max(ESTIMATED_TOTAL_SECONDS, Math.ceil(vidDuration * 1.5));
      setEstimatedSeconds(scaledEstimation);
      setInitialEstimatedSeconds(scaledEstimation);

      setProcessingStep('2/3: HIGH-ACCURACY TRANSLATION');
      const data = await geminiService.processVideoFull(base64, file.type, options.targetLanguage, vidDuration);
      
      if (!data || !data.text) throw new Error("AI Processing Failure: No text script generated.");

      // Small delay to avoid hitting API rate limits too quickly
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStep('3/3: LOSSLESS PRODUCTION');
      setSubProgress('Generating high-fidelity audio...');

      const [audioBase64, thumbnails] = await Promise.all([
        geminiService.generateSpeechChunked(data.text, options.voice, (curr, tot) => {
          setSubProgress(`Synthesis: Segment ${curr} of ${tot}...`);
        }),
        geminiService.generateThumbnailSequential(data.metadata.title)
      ]);

      if (!audioBase64) throw new Error("Synthesis Core Failure: Audio generation was empty.");

      const pcmData = decode(audioBase64);
      const audioBlob = pcmToWav(pcmData, 24000);
      
      (window as any).proAudioBlob = audioBlob;
      (window as any).proAudioUrl = URL.createObjectURL(audioBlob);

      setResult({
        status: 'success',
        text: data.text,
        metadata: data.metadata,
        thumbnailPortrait: thumbnails.portrait ? `data:image/png;base64,${thumbnails.portrait}` : "",
        targetLanguage: options.targetLanguage
      });
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      console.error("System Malfunction Details:", err);
      setResult({ ...result, status: 'error', error: err.message || "A production error occurred. Please try again." });
    } finally {
      e.target.value = "";
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const timeoutId = setTimeout(() => resolve(30), 8000);

      video.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration || 30);
      };
      video.onerror = () => {
        clearTimeout(timeoutId);
        resolve(30);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const downloadAllInOne = async () => {
    if (!result.metadata || isBundling) return;
    setIsBundling(true);
    try {
      const baseName = result.metadata.english_filename_base 
        ? result.metadata.english_filename_base.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : 'production-asset';
      const zip = new JSZip();
      
      const audioBlob = (window as any).proAudioBlob;
      if (audioBlob) {
        zip.file(`${baseName}-voiceover.wav`, audioBlob);
      }
      
      if (result.thumbnailPortrait) {
        const base64Data = result.thumbnailPortrait.includes('base64,') ? result.thumbnailPortrait.split(',')[1] : result.thumbnailPortrait;
        zip.file(`${baseName}-poster.png`, base64Data, { base64: true });
      }
      
      if (result.metadata.subtitles.ass) zip.file(`${baseName}-subtitles.ass`, result.metadata.subtitles.ass);
      
      const viralTags = result.metadata.tags 
        ? result.metadata.tags.slice(0, 5).map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') 
        : '#trending #viral #localization #studio #elite';

      const notes = `TITLE: ${result.metadata.title}\n\nVIRAL TAGS (TRENDING 5):\n${viralTags}\n\nDESCRIPTION: ${result.metadata.description}\n\nSCRIPT:\n${result.text}`;
      zip.file(`${baseName}-notes.txt`, notes);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${baseName}-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
    } catch (error) {
      console.error("Bundling error:", error);
      alert("Error creating production bundle.");
    } finally {
      setIsBundling(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else {
        audioRef.current.playbackRate = options.speed;
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-[#020617] font-sans selection:bg-emerald-500/20">
      <GoldHeader 
        darkMode={darkMode} 
        toggleTheme={() => setDarkMode(!darkMode)} 
        onShowHelp={() => setShowHelp(true)} 
        onShowCoffee={() => setShowCoffee(true)}
      />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6 overflow-x-hidden">
        {needsKey ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-slate-200/40 dark:border-emerald-500/10 shadow-2xl text-center space-y-8">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto ring-4 ring-emerald-500/5">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">API SETUP NEEDED</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  To ensure the best performance and security, please connect your own Gemini API Key. This app uses your key to process audio and visuals.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Enter Gemini API Key</label>
                  <input 
                    id="manual-api-key-input"
                    type="password"
                    placeholder="Paste your API Key here..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-emerald-500/10 font-mono text-xs focus:ring-2 focus:ring-emerald-500 transition-all outline-none dark:text-white"
                    defaultValue={manualKey}
                  />
                </div>

                <button 
                  onClick={() => {
                    const input = document.getElementById('manual-api-key-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      saveManualKey(input.value);
                    }
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Check className="w-5 h-5" />
                  Start Application
                </button>

                <div className="pt-2 text-center">
                  <button 
                    onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
                    className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline transition-all"
                  >
                    Get Free API Key from Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {result.status === 'idle' && (
              <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in">
            <div className="text-center space-y-4 px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 mb-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Ultra Stable Production Engine V5.7-ACCURACY
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                Neural <span className="text-emerald-500">Master.</span><br/>
                <span className="text-emerald-500/10 dark:text-emerald-500/5">ZEGOTECH Quality.</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm md:text-base font-medium opacity-80 leading-relaxed">
                100% accurate AI translation and studio-grade WAV narration for professional video localizers.
              </p>
            </div>

            <div className="w-full max-w-3xl bg-white dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-10 border border-slate-200/40 dark:border-emerald-500/10 shadow-2xl space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-left space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.4em] ml-1">Choose Language</label>
                  <select className="w-full p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-emerald-500/10 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none" value={options.targetLanguage} onChange={e => setOptions({...options, targetLanguage: e.target.value as TargetLanguage})}>
                    {Object.values(TargetLanguage).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="text-left space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.4em] ml-1">Voice Identity</label>
                  <select className="w-full p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-emerald-500/10 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none" value={options.voice} onChange={e => setOptions({...options, voice: e.target.value as VoiceName})}>
                    {VOICE_PROFILES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.4em]">Narrator Speed</label>
                  <span className="text-emerald-500 font-black text-xs tabular-nums">{options.speed.toFixed(1)}x</span>
                </div>
                <div className="px-1">
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.1" 
                    value={options.speed} 
                    onChange={e => setOptions({...options, speed: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all"
                  />
                  <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                    <span>Slower</span>
                    <span>Standard</span>
                    <span>Faster</span>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer z-30" onChange={handleFileUpload} disabled={cooldown > 0} title="Upload Video" />
                <div className={`h-48 border border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-700 ${cooldown > 0 ? 'bg-slate-100/30 dark:bg-slate-900/10 border-slate-200' : 'bg-slate-50/50 dark:bg-slate-950/20 border-emerald-500/20 group-hover:border-emerald-500 group-hover:bg-emerald-500/5 shadow-inner'}`}>
                  {cooldown > 0 ? (
                    <div className="text-center space-y-2">
                       <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{cooldown}</p>
                       <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">READY IN {cooldown}S</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-emerald-100/50 dark:bg-emerald-950/30 rounded-2xl mb-3 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      </div>
                      <p className="font-black text-[9px] text-slate-500 uppercase tracking-[0.3em]">Import Video for High-Fidelity Localization</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {result.status === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in px-4">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
              <svg className="absolute -rotate-90 transform" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-900" />
                <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={circumference * (estimatedSeconds / (initialEstimatedSeconds || 1))} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000 ease-linear shadow-xl" />
              </svg>
              <div className="relative flex flex-col items-center justify-center">
                <span className="text-6xl font-black text-slate-900 dark:text-white font-mono leading-none tracking-tighter tabular-nums">{estimatedSeconds}</span>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.4em] mt-3">SEC LEFT</span>
              </div>
            </div>
            <div className="w-full max-w-xl">
              <div className="bg-slate-900/95 dark:bg-black/40 backdrop-blur-xl text-emerald-400 font-mono p-8 rounded-3xl border border-white/5 shadow-2xl space-y-5">
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> ZEGOTECH ACTIVE
                    </div>
                    <span className="text-[9px] text-white/30">V5.7-PRECISION</span>
                 </div>
                 <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex gap-4"><span className="opacity-40 w-16 shrink-0 uppercase text-[10px] font-bold">STAGE:</span><span className="font-black text-white">{processingStep}</span></div>
                    <div className="flex gap-4"><span className="opacity-40 w-16 shrink-0 uppercase text-[10px] font-bold">LOG:</span><span className="opacity-80 italic text-emerald-100">{subProgress}</span></div>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4"><div className="h-full bg-emerald-500 animate-[progress_2s_infinite] shadow-[0_0_10px_#10b981]"></div></div>
              </div>
            </div>
          </div>
        )}

        {result.status === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 animate-in">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div className="text-center space-y-2 px-6">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Malfunction</h3>
               <div className="text-slate-500 max-w-md mx-auto text-sm font-medium leading-relaxed">
                 {result.error?.includes('API key not valid') ? (
                   <div className="space-y-4">
                     <p>Invalid or missing Gemini API Key.</p>
                     <button 
                       onClick={async () => {
                         try {
                           // @ts-ignore
                           await window.aistudio.openSelectKey();
                           resetProject();
                         } catch (e) {
                           console.error("Failed to open key selector", e);
                         }
                       }}
                       className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                     >
                       Select API Key
                     </button>
                   </div>
                 ) : (
                   <p>{result.error}</p>
                 )}
               </div>
            </div>
            {!result.error?.includes('API key not valid') && (
              <button onClick={resetProject} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20 transition-all">Discard & Restart</button>
            )}
          </div>
        )}

        {result.status === 'success' && result.metadata && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in pb-20">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-emerald-500/5 shadow-2xl space-y-10">
                <div className="bg-slate-50 dark:bg-slate-950/60 rounded-[2rem] p-8 md:p-12 border border-emerald-500/10 shadow-inner relative overflow-hidden group">
                  <audio ref={audioRef} src={(window as any).proAudioUrl} onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={() => setIsPlaying(false)} className="hidden" />
                  <div className="flex flex-col items-center gap-10 py-6">
                    <button onClick={togglePlay} className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-3xl hover:scale-110 active:scale-95 transition-all duration-300 relative group/btn">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 group-hover/btn:opacity-40"></div>
                      {isPlaying ? <svg className="w-10 h-10 relative" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg> : <svg className="w-10 h-10 ml-2 relative" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>}
                    </button>
                    <div className="w-full space-y-4">
                      <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const pct = x / rect.width;
                        if (audioRef.current) audioRef.current.currentTime = pct * duration;
                      }}>
                        <div className="absolute h-full bg-emerald-500 shadow-[0_0_8px_#10b981]" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-4xl font-black font-['Padauk'] text-slate-900 dark:text-white leading-tight tracking-tight">{result.metadata.title}</h2>
                  <div className="p-8 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-emerald-500/10">
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-['Padauk'] leading-relaxed font-medium">{result.metadata.description}</p>
                  </div>
                </div>
                
                <div className="space-y-6 pt-8 border-t dark:border-slate-800">
                  <div className="flex items-center gap-4">
                     <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.5em]">NEURAL SCRIPT</h4>
                     <div className="h-px flex-1 bg-emerald-500/10"></div>
                  </div>
                  <div className="font-['Padauk'] text-xl md:text-2xl leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap selection:bg-emerald-500/20">{result.text}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-emerald-500/5 shadow-2xl space-y-8 sticky top-28">
                <div className="space-y-5">
                   <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] text-center">CINEMATIC POSTER</h3>
                   <div className="aspect-[9/16] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-slate-100 dark:ring-slate-800/50 max-w-[220px] mx-auto transition-transform hover:scale-[1.02]">
                      {result.thumbnailPortrait ? (
                        <img src={result.thumbnailPortrait} className="w-full h-full object-cover" alt="Production Poster" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[9px] bg-slate-900 italic text-center px-4 uppercase tracking-tighter">Poster Unavailable</div>
                      )}
                   </div>
                </div>
                <div className="space-y-4 pt-8 border-t dark:border-slate-800">
                  <button 
                    onClick={downloadAllInOne} 
                    disabled={isBundling} 
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-emerald-500/20 shadow-xl hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isBundling ? <span className="animate-pulse">ASSEMBLING...</span> : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download Bundle ZIP
                      </>
                    )}
                  </button>
                  <button onClick={resetProject} className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-rose-500 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Discard & Restart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </main>

      {showHelp && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md animate-in"
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border dark:border-white/5 space-y-8 overflow-y-auto max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-6">
              <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white">ZEGOTECH Guide</h3>
              <button onClick={() => setShowHelp(false)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6 text-sm md:text-base text-slate-600 dark:text-slate-400 font-['Padauk'] leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-widest">အဆင့် (၁) - API Key ထည့်သွင်းခြင်း</h4>
                <p>ဤ App ကို အသုံးပြုရန် သင်၏ ကိုယ်ပိုင် Gemini API Key လိုအပ်ပါသည်။ App စတင်ချိန်တွင် ပေါ်လာသော Input Box တွင် သင်၏ Key ကို ရိုက်ထည့်ပြီး "Start Application" ခလုတ်ကို နှိပ်ပါ။ Key မရှိသေးပါက အောက်ခြေရှိ "Get Free API Key from Google" link မှတစ်ဆင့် အခမဲ့ ရယူနိုင်ပါသည်။</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-widest">အဆင့် (၂) - ဗီဒီယို တင်သွင်းခြင်း</h4>
                <p>"Import Video" နေရာတွင် သင် ဘာသာပြန်လိုသော ဗီဒီယိုဖိုင်ကို ရွေးချယ် တင်သွင်းပါ။ ဖိုင်ဆိုဒ် 70MB အထိ လက်ခံပေးပါသည်။</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-widest">အဆင့် (၃) - ဘာသာစကားနှင့် အသံရွေးချယ်ခြင်း</h4>
                <p>"Choose Language" တွင် မိမိအလိုရှိသော ဘာသာစကားကို ရွေးချယ်ပါ။ "Voice Identity" တွင် အသံအမျိုးအစားကို ရွေးချယ်နိုင်ပြီး "Narrator Speed" တွင် အသံထွက်နှုန်းကို စိတ်ကြိုက် ချိန်ညှိနိုင်ပါသည်။ (ယခုအခါ ပုံမှန်အမြန်နှုန်း 1x ဖြင့် အလိုအလျောက် သတ်မှတ်ပေးထားပါသည်။)</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-widest">အဆင့် (၄) - ရလဒ်များ ရယူခြင်း</h4>
                <p>Neural Engine မှ အလိုအလျောက် ဘာသာပြန်ပြီးပါက ဘာသာပြန်စာသား၊ အသံဖိုင် (Premium WAV) နှင့် Subtitle ဖိုင်များကို "Download Bundle ZIP" ခလုတ်ဖြင့် တစ်ခါတည်း ဒေါင်းလုဒ် ရယူနိုင်ပါသည်။</p>
              </div>

              <button 
                onClick={() => {
                  localStorage.removeItem('zegotech_manual_api_key');
                  setManualKey('');
                  setNeedsKey(true);
                  setShowHelp(false);
                }}
                className="w-full py-3 bg-rose-500/10 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all mt-4"
              >
                Reset API Key (Key ကို ပြန်လည်ပြင်ဆင်ရန်)
              </button>
            </div>
            
            <div className="pt-6 border-t dark:border-white/5 text-center">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Turbo Engine V5.7-ACCURACY</p>
            </div>
          </div>
        </div>
      )}

      {showCoffee && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md animate-in"
          onClick={() => setShowCoffee(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border dark:border-white/5 space-y-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto ring-4 ring-amber-500/5">
                <Coffee className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white">Buy me a coffee</h3>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Support the Production Engine</p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                If this tool helps your production workflow, consider supporting with a small donation. Happy Money! ☕✨
              </p>
            </div>

            <div className="space-y-4">
              {DONATION_INFO.map((method) => (
                <div key={method.name} className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-white/5 space-y-3 group transition-all hover:border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${method.color}`}>
                        <Heart className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{method.name}</p>
                        <p className="font-bold text-slate-900 dark:text-white">{method.accountName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(method.number, method.name)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 shadow-sm border border-slate-100 dark:border-white/5 transition-all active:scale-90"
                    >
                      {copiedField === method.name ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="px-1">
                    <p className="text-lg font-black font-mono tracking-wider text-slate-900 dark:text-white">{method.number}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 py-4 bg-rose-500/5 rounded-[2rem] border border-rose-500/10">
              <div className="flex items-center gap-3 text-rose-500">
                <Heart className="w-5 h-5 fill-current animate-pulse" />
                <span className="text-xl font-['Pacifico'] text-rose-500 tracking-wide">Thanks for your support!</span>
                <Heart className="w-5 h-5 fill-current animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400/60">Your kindness keeps us going</p>
            </div>

            <button 
              onClick={() => setShowCoffee(false)}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .animate-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progress { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(300%); } 
        }
        .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.4); }
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #10b981;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}
