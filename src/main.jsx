import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { ThemeProvider } from './app/theme.jsx';
import { MotionProvider } from './app/motion.jsx';
import { AudioProvider } from './app/audio.jsx';
import './styles/globals.css';

const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <MotionProvider>
        <AudioProvider>
          <BrowserRouter basename={base === '/' ? undefined : base}>
            <App />
          </BrowserRouter>
        </AudioProvider>
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>,
);

// Boot loader handoff. The loader (in index.html) shows from the moment
// the HTML parses; we keep it on screen for a minimum of ~1.5s so the
// chip-power-on animation completes, then fade it out and remove it.
// Doing this AFTER createRoot guarantees the React tree has rendered
// at least once before we start the fade.
{
  const loader = document.getElementById('axiom-loader');
  if (loader) {
    const MIN_VISIBLE_MS = 1500;
    const start = performance.now();
    const fade = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => {
        loader.classList.add('is-out');
        setTimeout(() => loader.remove(), 650);
      }, wait);
    };
    if (document.readyState === 'complete') fade();
    else window.addEventListener('load', fade, { once: true });
  }
}
