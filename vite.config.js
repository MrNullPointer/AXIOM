import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages, set base via env (e.g. VITE_BASE=/axiom/) at build time.
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
