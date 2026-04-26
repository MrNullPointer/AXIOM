import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * Three-tier background-animation preference:
 *   'full' — current behaviour, no caps
 *   'calm' — same scene, halved density and slowed spawns
 *   'off'  — paint a single frame and freeze; no requestAnimationFrame loop
 *
 * The user's choice persists in localStorage. If they have OS-level
 * prefers-reduced-motion turned on and have never explicitly chosen, we
 * default to 'calm' rather than 'full' so the site respects their system
 * setting on the first visit.
 *
 * The `nextLevel` helper cycles full → calm → off → full, used by the
 * single-button toggle in the navbar.
 */

const MotionContext = createContext(null);
const STORAGE_KEY = 'axiom-motion';
const LEVELS = ['full', 'calm', 'off'];

function readInitial() {
  if (typeof window === 'undefined') return 'full';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LEVELS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'calm';
  }
  return 'full';
}

export function MotionProvider({ children }) {
  const [level, setLevel] = useState(readInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, level);
    } catch {
      /* ignore */
    }
  }, [level]);

  const cycle = useCallback(() => {
    setLevel((cur) => {
      const i = LEVELS.indexOf(cur);
      return LEVELS[(i + 1) % LEVELS.length];
    });
  }, []);

  const value = useMemo(
    () => ({ level, setLevel, cycle, levels: LEVELS }),
    [level, cycle],
  );
  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotion() {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error('useMotion must be used inside <MotionProvider>');
  }
  return ctx;
}

/**
 * Multiplier applied to the CircuitFlow density prop. We deliberately do
 * NOT zero out density for 'off' — the static scene still needs to paint —
 * the loop gating happens inside CircuitFlow via the `motion` prop.
 */
export function densityMultiplier(level) {
  if (level === 'off') return 0.45;
  if (level === 'calm') return 0.55;
  return 1;
}
