import { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * NarrativeContext — lets the Atlas page communicate its current
 * scroll-narrative state to siblings rendered above it in the tree
 * (notably <CircuitFlow> in the Layout).
 *
 *   • narrativeStage  — the current stage object (or null when idle)
 *   • narrativeActive — true while the user is inside the narrative
 *                       scroll section, regardless of stage. Layout
 *                       reads this to downgrade BG render cadence —
 *                       the dim overlay covers the BG anyway, so
 *                       there's no point spending CPU on it.
 *
 * Off-homepage routes never touch this — both values stay null/false.
 */
const NarrativeContext = createContext({
  narrativeStage: null,
  setNarrativeStage: () => {},
  narrativeActive: false,
  setNarrativeActive: () => {},
});

export function NarrativeProvider({ children }) {
  const [narrativeStage, setNarrativeStageRaw] = useState(null);
  const [narrativeActive, setNarrativeActiveRaw] = useState(false);
  const setNarrativeStage = useCallback((stage) => setNarrativeStageRaw(stage), []);
  const setNarrativeActive = useCallback((active) => setNarrativeActiveRaw(active), []);
  const value = useMemo(
    () => ({ narrativeStage, setNarrativeStage, narrativeActive, setNarrativeActive }),
    [narrativeStage, narrativeActive, setNarrativeStage, setNarrativeActive],
  );
  return (
    <NarrativeContext.Provider value={value}>
      {children}
    </NarrativeContext.Provider>
  );
}

export function useNarrativeStage() {
  return useContext(NarrativeContext).narrativeStage;
}

export function useSetNarrativeStage() {
  return useContext(NarrativeContext).setNarrativeStage;
}

export function useNarrativeActive() {
  return useContext(NarrativeContext).narrativeActive;
}

export function useSetNarrativeActive() {
  return useContext(NarrativeContext).setNarrativeActive;
}
