import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { ThemeProvider } from './app/theme.jsx';
import { MotionProvider } from './app/motion.jsx';
import './styles/globals.css';

const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <MotionProvider>
        <BrowserRouter basename={base === '/' ? undefined : base}>
          <App />
        </BrowserRouter>
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>,
);
