/**
 * Optical color math for Kelvin temperature approximation (Tanner Helland algorithm)
 * and circadian daylight/night interpolation.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function kelvinToRgb(kelvin: number): RgbColor {
  const clamped = Math.max(1500, Math.min(6500, kelvin));
  const temp = clamped / 100;

  let r: number;
  let g: number;
  let b: number;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
  }

  // Green
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  }

  return {
    r: Math.round(Math.max(0, Math.min(255, r))),
    g: Math.round(Math.max(0, Math.min(255, g))),
    b: Math.round(Math.max(0, Math.min(255, b))),
  };
}

/**
 * Computes percentage of harmful HEV blue light (415nm-455nm) attenuated relative to 6500K neutral.
 */
export function computeBlueLightReduction(kelvin: number): number {
  const clamped = Math.max(1900, Math.min(6500, kelvin));
  const ratio = (6500 - clamped) / (6500 - 1900);
  // Smooth non-linear spectral curve: 6500K => 0%, 1900K => 78% reduction
  return Math.round(Math.pow(ratio, 0.92) * 78);
}

/**
 * Generates an unobtrusive CSS rgba multiply tint for the live screen filter overlay.
 * At 6500K returns fully transparent; at lower Kelvin returns warm amber optical tint.
 */
export function kelvinToOverlayColor(kelvin: number, intensity = 0.85): string {
  const clamped = Math.max(1900, Math.min(6500, kelvin));
  if (clamped >= 6450) return 'rgba(255, 255, 255, 0)';
  const { r, g, b } = kelvinToRgb(clamped);
  const strength = ((6500 - clamped) / (6500 - 1900)) * 0.42 * intensity;
  return `rgba(${r}, ${Math.round(g * 0.92)}, ${Math.round(b * 0.78)}, ${strength.toFixed(3)})`;
}

/**
 * Computes circadian auto-adjusted Kelvin and brightness for a given hour (0 - 23.99).
 */
export function computeCircadianValues(
  hour: number,
  dayStartHour: number,
  nightStartHour: number,
  dayKelvin: number,
  nightKelvin: number,
  dayBrightness: number,
  nightBrightness: number
): { kelvin: number; brightness: number; phase: 'Siang' | 'Transisi Senja' | 'Malam' | 'Transisi Fajar' } {
  const h = ((hour % 24) + 24) % 24;
  const transitionWindow = 1.5; // 90 minutes smooth ramp

  // Morning transition: [dayStartHour - 0.75, dayStartHour + 0.75]
  const dawnStart = dayStartHour - transitionWindow / 2;
  const dawnEnd = dayStartHour + transitionWindow / 2;

  // Evening transition: [nightStartHour - 0.75, nightStartHour + 0.75]
  const duskStart = nightStartHour - transitionWindow / 2;
  const duskEnd = nightStartHour + transitionWindow / 2;

  let nightFactor = 0;
  let phase: 'Siang' | 'Transisi Senja' | 'Malam' | 'Transisi Fajar' = 'Siang';

  if (h >= dawnEnd && h < duskStart) {
    nightFactor = 0;
    phase = 'Siang';
  } else if (h >= duskStart && h < duskEnd) {
    const t = (h - duskStart) / transitionWindow;
    // Smoothstep easing
    nightFactor = t * t * (3 - 2 * t);
    phase = 'Transisi Senja';
  } else if (h >= dawnStart && h < dawnEnd) {
    const t = (h - dawnStart) / transitionWindow;
    nightFactor = 1 - t * t * (3 - 2 * t);
    phase = 'Transisi Fajar';
  } else {
    nightFactor = 1;
    phase = 'Malam';
  }

  const kelvin = Math.round(dayKelvin + (nightKelvin - dayKelvin) * nightFactor);
  const brightness = Math.round(dayBrightness + (nightBrightness - dayBrightness) * nightFactor);

  return { kelvin, brightness, phase };
}

export function formatHour(hour: number): string {
  const whole = Math.floor(hour);
  const mins = Math.round((hour - whole) * 60);
  return `${String(whole % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} mnt`;
  return `${h}j ${m}m`;
}

/**
 * Plays a gentle, calming two-tone optical chime using Web Audio API
 * when a 20-20-20 break begins or finishes.
 */
export function playGentleChime(type: 'start' | 'end' = 'start'): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = type === 'start' ? [523.25, 659.25] : [659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.6);
    });
  } catch {
    // Ignore audio context restrictions gracefully
  }
}
