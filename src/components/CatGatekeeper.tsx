import React, { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface CatGatekeeperProps {
  secondsRemaining: number;
  totalSeconds: number;
  strictMode: boolean;
  soundEnabled: boolean;
  onComplete: () => void;
  onSkip: () => void;
  interactivePreview?: boolean;
}

export function playCatSound(type: 'meow' | 'purr') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'meow') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.46);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } else {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(42 + i * 6, now + i * 0.14);
        gain.gain.setValueAtTime(0.05, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.2);
      }
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
}

const CAT_THOUGHTS = [
  'Meow! Waktunya istirahat menatap jauh!',
  'Tatap pemandangan 6 meter di luar jendela ~',
  'Kedipkan matamu perlahan... rilekskan otot mata!',
  'Purrrr... Aku menjaga layarmu sampai istirahat selesai.',
];

export const CatGatekeeper: React.FC<CatGatekeeperProps> = ({
  secondsRemaining,
  totalSeconds,
  strictMode,
  soundEnabled,
  onComplete,
  onSkip,
  interactivePreview = false,
}) => {
  const [petCount, setPetCount] = useState(0);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [videoPhase, setVideoPhase] = useState<'entry' | 'sleep'>('entry');
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const elapsed = Math.max(0, totalSeconds - secondsRemaining);
  const canSkip = !strictMode || elapsed >= 5;
  const progressPct =
    totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 100;

  useEffect(() => {
    if (soundEnabled) {
      playCatSound('meow');
    }

    const blinkInterval = window.setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 240);
    }, 4000);

    const thoughtInterval = window.setInterval(() => {
      setThoughtIndex((idx) => (idx + 1) % CAT_THOUGHTS.length);
    }, 6000);

    return () => {
      window.clearInterval(blinkInterval);
      window.clearInterval(thoughtInterval);
    };
  }, [soundEnabled]);

  const handlePetCat = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPetCount((c) => c + 1);
    setHearts((prev) => [...prev, { id: Date.now() + Math.random(), x, y }].slice(-6));
    if (soundEnabled) {
      playCatSound('purr');
    }
  };

  const startLongPress = () => {
    if (!canSkip) return;
    setLongPressProgress(0);
    const start = Date.now();
    const duration = 1200;

    longPressTimerRef.current = window.setInterval(() => {
      const passed = Date.now() - start;
      const pct = Math.min(100, (passed / duration) * 100);
      setLongPressProgress(pct);
      if (pct >= 100) {
        if (longPressTimerRef.current) clearInterval(longPressTimerRef.current);
        onSkip();
      }
    }, 30);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearInterval(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setLongPressProgress(0);
  };

  // Video assets paths
  const entryVideoSrc = '/assets/cat/neko1.webm';
  const sleepVideoSrc = '/assets/cat/neko2.webm';

  return (
    <div
      className={`relative select-none pointer-events-auto ${interactivePreview
        ? 'w-full max-w-lg p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30'
        : 'fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-transparent'
        }`}
    >
      {/* 1. Official Cat Gatekeeper Transparent WebM Video Overlay */}
      {!useFallbackSvg ? (
        <div
          onClick={handlePetCat}
          className="relative flex items-center justify-center cursor-pointer max-w-full"
        >
          {videoPhase === 'entry' && (
            <video
              ref={videoRef}
              src={entryVideoSrc}
              autoPlay
              muted
              playsInline
              onError={() => setUseFallbackSvg(true)}
              onEnded={() => setVideoPhase('sleep')}
              className="max-h-[75vh] w-auto object-contain pointer-events-auto"
              style={{ background: 'transparent' }}
            />
          )}

          {videoPhase === 'sleep' && (
            <video
              src={sleepVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setUseFallbackSvg(true)}
              className="max-h-[75vh] w-auto object-contain pointer-events-auto"
              style={{ background: 'transparent' }}
            />
          )}

          {/* Floating Hearts upon Petting */}
          {hearts.map((h) => (
            <div
              key={h.id}
              style={{ left: `${h.x}px`, top: `${h.y}px` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-bounce text-pink-400 z-30"
            >
              <Heart className="w-8 h-8 fill-current drop-shadow-md" />
            </div>
          ))}
        </div>
      ) : (
        /* 2. Fallback Transparent Animated SVG Ginger Cat */
        <div
          onClick={handlePetCat}
          className="relative group cursor-pointer my-2 select-none"
        >
          <svg viewBox="0 0 240 220" className="w-56 h-56 transition-transform group-hover:scale-105">
            <defs>
              <linearGradient id="catBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="catBelly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>
            <path
              d="M 170 180 Q 215 170 215 130 Q 215 95 195 90 Q 185 90 190 105 Q 195 125 175 160 Z"
              fill="url(#catBody)"
              className="animate-pulse"
              style={{ animationDuration: '3s' }}
            />
            <ellipse cx="120" cy="155" rx="58" ry="48" fill="url(#catBody)" />
            <ellipse cx="120" cy="162" rx="36" ry="34" fill="url(#catBelly)" />
            <polygon points="76,82 60,34 100,56" fill="url(#catBody)" />
            <polygon points="77,75 68,46 95,60" fill="#fca5a5" />
            <polygon points="164,82 180,34 140,56" fill="url(#catBody)" />
            <polygon points="163,75 172,46 145,60" fill="#fca5a5" />
            <ellipse cx="120" cy="94" rx="46" ry="38" fill="url(#catBody)" />
            {isBlinking ? (
              <>
                <path d="M 94 95 Q 104 98 110 95" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M 130 95 Q 136 98 146 95" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="102" cy="94" rx="7" ry="8" fill="#1e293b" />
                <circle cx="104" cy="91" r="2.5" fill="#ffffff" />
                <ellipse cx="138" cy="94" rx="7" ry="8" fill="#1e293b" />
                <circle cx="140" cy="91" r="2.5" fill="#ffffff" />
              </>
            )}
            <polygon points="120,103 116,99 124,99" fill="#f43f5e" />
            <path d="M 120 103 Q 115 110 110 108" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 120 103 Q 125 110 130 108" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="98" cy="192" rx="14" ry="10" fill="url(#catBelly)" stroke="#d97706" strokeWidth="1.5" />
            <ellipse cx="142" cy="192" rx="14" ry="10" fill="url(#catBelly)" stroke="#d97706" strokeWidth="1.5" />
          </svg>
          {hearts.map((h) => (
            <div
              key={h.id}
              style={{ left: `${h.x}px`, top: `${h.y}px` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-bounce text-pink-400"
            >
              <Heart className="w-6 h-6 fill-current" />
            </div>
          ))}
        </div>
      )}

      {/* Floating Thought Bubble */}
      <div className="my-2 px-4 py-2 rounded-2xl bg-amber-400 text-slate-950 font-medium text-xs sm:text-sm text-center shadow-xl border border-amber-300 max-w-sm">
        {CAT_THOUGHTS[thoughtIndex]}
      </div>

      {/* Floating Gatekeeper Countdown Pill */}
      <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-slate-900/80 border border-amber-500/40 backdrop-blur-md text-white shadow-2xl my-2">
        <span className="font-mono text-3xl font-bold tabular-nums text-amber-400">
          {String(secondsRemaining).padStart(2, '0')}s
        </span>
        <div className="text-left text-xs">
          <div className="font-semibold text-white">Cat Gatekeeper</div>
          <div className="text-slate-300 text-[11px]">Istirahatkan Mata</div>
        </div>
      </div>

      {/* Floating Action Controls */}
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Selesai</span>
        </button>

        <div className="relative">
          <button
            type="button"
            disabled={!canSkip}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            className={`relative overflow-hidden inline-flex items-center justify-center rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition-colors select-none shadow-lg ${canSkip
              ? 'border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 cursor-pointer'
              : 'border-slate-800 bg-slate-950/60 text-slate-500 cursor-not-allowed'
              }`}
          >
            <div
              className="absolute left-0 top-0 bottom-0 bg-amber-500/40 transition-all duration-75"
              style={{ width: `${longPressProgress}%` }}
            />
            <span className="relative z-10">
              {canSkip
                ? longPressProgress > 0
                  ? `${Math.round(longPressProgress)}%`
                  : 'Tahan untuk Lewati'
                : `Ketat (${Math.max(0, 5 - elapsed)}s)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
