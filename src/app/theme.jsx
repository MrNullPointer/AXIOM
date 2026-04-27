import { createContext, useContext, useEffect, useMemo } from 'react';

// Light mode is intentionally disabled — Axiom is a dark-first identity
// and a real second theme is a separate project. The provider stays so
// existing call sites (CircuitFlow, DieHero, etc.) keep working, but it
// always reports 'dark' and the toggle is a no-op.
const ThemeContext = createContext({ theme: 'dark', setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = 'dark';
    try {
      localStorage.removeItem('axiom-theme');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ theme: 'dark', setTheme: () => {}, toggle: () => {} }),
    [],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
