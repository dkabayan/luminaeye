import React, { useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { Eye, SkipForward, CheckCircle2, X } from 'lucide-react';
import { FocusMagicXConfig } from '../types/eyeCare';
import { kelvinToOverlayColor } from '../utils/colorMath';
import { CatGatekeeper } from './CatGatekeeper';

interface ViewportOverlayProps {
  masterEnabled: boolean;
  applyLiveOverlay: boolean;
  effectiveKelvin: number;
  effectiveBrightness: number;
  focusConfig: FocusMagicXConfig;
  onDisableFullAppFocus: () => void;
  isBreakActive: boolean;
  breakSecondsLeft: number;
  breakTotalSeconds: number;
  strictMode: boolean;
  onCompleteBreak: () => void;
  onSkipBreak: () => void;
}

export const ViewportOverlay: React.FC<ViewportOverlayProps> = ({
  masterEnabled,
  applyLiveOverlay,
  effectiveKelvin,
  effectiveBrightness,
  focusConfig,
  onDisableFullAppFocus,
  isBreakActive,
  breakSecondsLeft,
  breakTotalSeconds,
  strictMode,
  onCompleteBreak,
  onSkipBreak,
}) => {
  const [pointerPos, setPointerPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    if (!focusConfig.enabledOnApp) return;

    const handleMove = (e: MouseEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDisableFullAppFocus();
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('keydown', handleKey);
    };
  }, [focusConfig.enabledOnApp, onDisableFullAppFocus]);

  // In Tauri desktop app, monitor gamma is applied at OS/hardware level.
  // Avoid double-filtering inside the viewport overlay when running on desktop.
  const isDesktop = typeof window !== 'undefined' && isTauri();

  // Safely clamp visual dimmer on the live UI to max 58% darkness so UI remains legible
  const dimAlpha =
    masterEnabled && applyLiveOverlay && !isDesktop
      ? Math.max(0, Math.min(0.58, ((100 - effectiveBrightness) / 100) * 0.65))
      : 0;

  const tintColor =
    masterEnabled && applyLiveOverlay && !isDesktop
      ? kelvinToOverlayColor(effectiveKelvin, 0.9)
      : 'rgba(255,255,255,0)';

  const breakElapsed = Math.max(0, breakTotalSeconds - breakSecondsLeft);
  const canSkip = !strictMode || breakElapsed >= 5;
  const breakProgress = breakTotalSeconds > 0 ? ((breakTotalSeconds - breakSecondsLeft) / breakTotalSeconds) * 100 : 100;

  const bandTop = Math.max(0, pointerPos.y - focusConfig.bandHeight / 2);
  const bandBottom = Math.min(window.innerHeight, pointerPos.y + focusConfig.bandHeight / 2);
  const dimOpacityDecimal = focusConfig.dimOpacity / 100;

  return (
    <>
      {/* 1. Real Blue Light Filter Optical Multiply Tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 transition-colors duration-200"
        style={{
          backgroundColor: tintColor,
          mixBlendMode: 'multiply',
        }}
      />

      {/* 2. Real Software Screen Dimmer Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          backgroundColor: `rgba(8, 12, 20, ${dimAlpha.toFixed(3)})`,
        }}
      />

      {/* 3. Live Full-App Focus & MagicX Overlay */}
      {focusConfig.enabledOnApp && !isBreakActive && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {focusConfig.mode === 'reading-line' && (
            <>
              {/* Top Dim Mask */}
              <div
                className="fixed left-0 right-0 top-0"
                style={{
                  height: `${bandTop}px`,
                  backgroundColor: `rgba(15, 23, 42, ${dimOpacityDecimal})`,
                  backdropFilter: focusConfig.blurAmount > 0 ? `blur(${focusConfig.blurAmount}px)` : undefined,
                }}
              />
              {/* Highlighted Reading Line Border */}
              {focusConfig.accentBorder && (
                <div
                  className="fixed left-0 right-0 border-y border-sky-400/80"
                  style={{
                    top: `${bandTop}px`,
                    height: `${Math.max(24, bandBottom - bandTop)}px`,
                  }}
                />
              )}
              {/* Bottom Dim Mask */}
              <div
                className="fixed left-0 right-0 bottom-0"
                style={{
                  top: `${bandBottom}px`,
                  backgroundColor: `rgba(15, 23, 42, ${dimOpacityDecimal})`,
                  backdropFilter: focusConfig.blurAmount > 0 ? `blur(${focusConfig.blurAmount}px)` : undefined,
                }}
              />
            </>
          )}

          {focusConfig.mode !== 'reading-line' && (
            <div
              className="fixed inset-0"
              style={{
                background: `radial-gradient(circle ${focusConfig.spotlightRadius}px at ${pointerPos.x}px ${pointerPos.y}px, transparent 0%, transparent 62%, rgba(15, 23, 42, ${dimOpacityDecimal}) 100%)`,
              }}
            />
          )}

          {/* Escape hatch control */}
          <div className="pointer-events-auto fixed bottom-6 right-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-lg">
            <span className="text-xs font-medium text-slate-700">
              Mode Focus aktif · Tekan <kbd className="font-mono text-slate-900">Esc</kbd> untuk keluar
            </span>
            <button
              type="button"
              onClick={onDisableFullAppFocus}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Nonaktifkan
            </button>
          </div>
        </div>
      )}

      {/* 4. Full-Screen 20-20-20 Break Reminder Overlay (Cat Gatekeeper Style) */}
      {isBreakActive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-gatekeeper-overlay"
          className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-transparent pointer-events-auto"
        >
          <CatGatekeeper
            secondsRemaining={breakSecondsLeft}
            totalSeconds={breakTotalSeconds}
            strictMode={strictMode}
            soundEnabled={true}
            onComplete={onCompleteBreak}
            onSkip={onSkipBreak}
          />
        </div>
      )}
    </>
  );
};
