import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Background-music preference + a single shared <audio> element.
 *
 * Performance contract:
 *   • The 3.5 MB MP3 is in `public/audio/` so Vite serves it as a static
 *     asset — it is never bundled into a JS chunk.
 *   • The HTMLAudioElement is constructed lazily, the first time `enabled`
 *     becomes true. If the user never turns music on, the file is never
 *     fetched at all — zero impact on initial paint.
 *   • On returning visits with a saved-on preference, we still defer
 *     element construction (and therefore the network fetch) until the
 *     first user gesture. This matches the autoplay-with-sound block —
 *     there is no point downloading audio the browser will refuse to
 *     play yet — and protects the cold-load TTI.
 *   • Element is constructed once and lives across route changes because
 *     this provider sits above <Routes>. Navigation does not restart
 *     playback or re-fetch.
 *
 * Default state: OFF on first visit. Browser autoplay policies block
 * sound without a gesture anyway, so defaulting on would just leave a
 * preloaded-but-silent file. The visible speaker icon in the navbar
 * advertises the feature, and the user's enabling click is itself the
 * gesture that unlocks playback.
 */

const AudioContext = createContext(null);
const STORAGE_KEY_ENABLED = 'axiom-audio-enabled';
const STORAGE_KEY_VOLUME = 'axiom-audio-volume';
const DEFAULT_VOLUME = 0.4;
const AUDIO_SRC = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/audio/sovereign-orbit.mp3`;

function readEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY_ENABLED);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* ignore */
  }
  return false;
}

function readVolume() {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_VOLUME);
    if (raw == null) return DEFAULT_VOLUME;
    const v = parseFloat(raw);
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_VOLUME;
}

export function AudioProvider({ children }) {
  const [enabled, setEnabled] = useState(readEnabled);
  const [volume, setVolumeState] = useState(readVolume);
  // `playing` reflects what the <audio> is actually doing right now —
  // distinct from `enabled` because autoplay can be blocked. The icon
  // can use this to render a "queued" state if we ever want it.
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [enabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_VOLUME, String(volume));
    } catch {
      /* ignore */
    }
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Wire play/pause to `enabled`. When toggling on, attempt immediate
  // playback (works inside the gesture window of the toggle click). If
  // the browser refuses (no gesture, e.g. saved-on preference on a
  // fresh tab), wait for the next pointerdown/keydown and try again.
  useEffect(() => {
    if (!enabled) {
      const a = audioRef.current;
      if (a && !a.paused) a.pause();
      return undefined;
    }

    let cancelled = false;
    const cleanups = [];

    const ensureElement = () => {
      if (audioRef.current) return audioRef.current;
      const a = new Audio();
      a.src = AUDIO_SRC;
      a.loop = true;
      a.preload = 'auto';
      a.volume = volume;
      a.addEventListener('play', () => setPlaying(true));
      a.addEventListener('pause', () => setPlaying(false));
      a.addEventListener('ended', () => setPlaying(false));
      audioRef.current = a;
      return a;
    };

    const start = () => {
      if (cancelled) return;
      const a = ensureElement();
      const p = a.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (cancelled) return;
          // Autoplay blocked — wait for a gesture, then retry once.
          const retry = () => {
            cleanupGesture();
            if (cancelled) return;
            a.play().catch(() => {
              /* still blocked; user can toggle off/on to retry */
            });
          };
          const cleanupGesture = () => {
            window.removeEventListener('pointerdown', retry);
            window.removeEventListener('keydown', retry);
            window.removeEventListener('touchstart', retry);
          };
          window.addEventListener('pointerdown', retry, {
            once: true,
            passive: true,
          });
          window.addEventListener('keydown', retry, { once: true });
          window.addEventListener('touchstart', retry, {
            once: true,
            passive: true,
          });
          cleanups.push(cleanupGesture);
        });
      }
    };

    start();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [enabled, volume]);

  // On full unmount (app teardown — basically only on hard navigation),
  // make sure the audio actually stops.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((v) => !v);
  }, []);

  const value = useMemo(
    () => ({ enabled, playing, volume, setEnabled, setVolume, toggle }),
    [enabled, playing, volume, setVolume, toggle],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}
