import { createContext, useContext, useState, useMemo } from 'react';

/**
 * NarrativeContext — lets the Atlas page communicate its current
 * scroll-narrative stage to siblings rendered above it in the tree
 * (notably <CircuitFlow> in the Layout).
 *
 * The provider lives in App.jsx Layout. Atlas calls
 * useSetNarrativeStage(stage) inside an effect to publish; CircuitFlow
 * reads useNarrativeStage() to drive its scripted electron journey.
 *
 * Setting `stage` to null disables scripted mode (CircuitFlow falls
 * back to ambient random transactions). Off-homepage routes never
 * touch this — narrativeStage stays null.
 */
const NarrativeContext = createContext({
  narrativeStage: null,
  setNarrativeStage: () => {},
});

export function NarrativeProvider({ children }) {
  const [narrativeStage, setNarrativeStage] = useState(null);
  const value = useMemo(
    () => ({ narrativeStage, setNarrativeStage }),
    [narrativeStage],
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
