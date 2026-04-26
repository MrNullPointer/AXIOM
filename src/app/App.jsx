import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import CircuitFlow from '../components/background/CircuitFlow.jsx';
import Navbar from '../components/shell/Navbar.jsx';
import SearchPalette from '../components/shell/SearchPalette.jsx';
import Atlas from '../pages/Atlas.jsx';
import IndexPage from '../pages/IndexPage.jsx';
import { useMotion, densityMultiplier } from './motion.jsx';

// Heavier sub-routes are split into their own chunks. The atlas/index pages
// stay eager because they are the most likely first paint. Concept and
// domain pages load on demand and prefetch on hover (see ConceptCard).
const DomainPage = lazy(() => import('../pages/DomainPage.jsx'));
const ConceptPage = lazy(() => import('../pages/ConceptPage.jsx'));

function Layout({ onOpenSearch, density }) {
  const { level: motionLevel } = useMotion();
  const effectiveDensity = density * densityMultiplier(motionLevel);
  return (
    <>
      <CircuitFlow
        density={effectiveDensity}
        intensity={1}
        motion={motionLevel}
      />
      <Navbar onOpenSearch={onOpenSearch} />
      <main className="relative z-10">
        <Outlet />
      </main>
      <footer
        className="relative z-10 border-t"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div
          className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-8 text-xs sm:flex-row sm:items-center sm:px-8"
          style={{ color: 'var(--ink-faint)' }}
        >
          <span>Made with 🤖 in San Diego 🌴</span>
          <a
            href="mailto:overclocked@elevendots.ai"
            className="transition-colors hover:text-[var(--ink)]"
            style={{ color: 'var(--ink-faint)' }}
          >
            overclocked@elevendots.ai
          </a>
          <span>From ElevenDots</span>
        </div>
      </footer>
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();
  // Three intensity tiers for the BG die-shot:
  //   • Atlas (`/`)               → 1.4   full chip activity
  //   • Index / Domain pages       → 0.7   calm but visibly alive
  //   • Concept long-form pages    → 0.30  minimal, very slow traffic
  // Long-form prose needs the chip present but never distracting.
  const density = pathname === '/'
    ? 1.4
    : pathname.startsWith('/c/')
      ? 0.30
      : 0.7;

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout onOpenSearch={() => setSearchOpen(true)} density={density} />}>
          <Route path="/" element={<Atlas />} />
          <Route path="/index" element={<IndexPage />} />
          <Route
            path="/d/:domain"
            element={
              <Suspense fallback={<RouteFallback />}>
                <DomainPage />
              </Suspense>
            }
          />
          <Route
            path="/c/:slug"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ConceptPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="marker">404</div>
      <h1 className="display mt-3 text-5xl">Trace not routed.</h1>
      <p className="lede mt-3">That path doesn’t connect to a known node.</p>
    </div>
  );
}

/**
 * Lightweight placeholder shown while a route's chunk loads. No spinner —
 * just a thin progress hint that lets layout settle without flashing
 * skeleton text we don't have yet.
 */
function RouteFallback() {
  return (
    <div
      className="mx-auto h-[60vh] max-w-7xl px-5 py-12 sm:px-8"
      aria-hidden="true"
    >
      <div
        className="h-1 w-24 animate-pulse rounded-full"
        style={{ background: 'var(--rule-strong)' }}
      />
    </div>
  );
}
