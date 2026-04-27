import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import CircuitFlow from '../components/background/CircuitFlow.jsx';
import EtchCursor from '../components/cursor/EtchCursor.jsx';
import Navbar from '../components/shell/Navbar.jsx';
import SearchPalette from '../components/shell/SearchPalette.jsx';
import Atlas from '../pages/Atlas.jsx';
import IndexPage from '../pages/IndexPage.jsx';
import {
  NarrativeProvider,
  useNarrativeStage,
} from '../components/atlas/narrativeContext.jsx';
import { useMotion, densityMultiplier } from './motion.jsx';

// Heavier sub-routes are split into their own chunks. The atlas/index pages
// stay eager because they are the most likely first paint. Concept and
// domain pages load on demand and prefetch on hover (see ConceptCard).
const DomainPage = lazy(() => import('../pages/DomainPage.jsx'));
const ConceptPage = lazy(() => import('../pages/ConceptPage.jsx'));

function Layout({ onOpenSearch, density, isHome }) {
  const { level: motionLevel } = useMotion();
  // The Atlas page publishes its current scroll-narrative stage here; we
  // forward it to CircuitFlow so the BG canvas plays scripted electron
  // traffic matching the cache-miss story. Off-homepage routes always
  // see null (atlas page only sets it).
  const narrativeStage = useNarrativeStage();
  // The narrative dim overlay is translucent, so the BG canvas is still
  // visible underneath. We previously capped density to 0.45 here as a
  // performance hedge, but that knocked CircuitFlow into the "minimal"
  // tier (2 electrons max, 2.2 s between spawns) and the homepage looked
  // dead while the user read. Full density during the narrative keeps
  // the scripted electron paths matching the active stage legible.
  const effectiveDensity = density * densityMultiplier(motionLevel);

  // Homepage-only cinema rig:
  //   • --bg-rot-x / --bg-rot-y : the BG silicon plane tilts in CSS
  //     perspective. Real depth, not a translate. Max ~3.6° so the wafer
  //     edges never recede out of frame.
  //   • --spot-x / --spot-y     : viewport-anchored cursor position used
  //     by the spotlight + vignette + depth-of-field stack.
  //
  // All four vars are smoothed in a single rAF loop so cursor drift is
  // cinematic — no jitter, no per-event style writes, perfectly phase-
  // locked across every overlay. Spotlight tracks faster (lerp 0.22)
  // than the tilt (lerp 0.07) so light feels weightless and the chip
  // surface feels heavy.
  useEffect(() => {
    if (!isHome) return;
    if (motionLevel === 'off') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.body;
    const target = { nx: 0, ny: 0, sx: 50, sy: 50 };
    const cur = { nx: 0, ny: 0, sx: 50, sy: 50 };
    let raf = 0;

    function onMove(e) {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      target.nx = (e.clientX / w - 0.5) * 2;
      target.ny = (e.clientY / h - 0.5) * 2;
      target.sx = (e.clientX / w) * 100;
      target.sy = (e.clientY / h) * 100;
    }
    function onLeave() {
      target.nx = 0;
      target.ny = 0;
      target.sx = 50;
      target.sy = 50;
    }
    function tick() {
      cur.nx += (target.nx - cur.nx) * 0.07;
      cur.ny += (target.ny - cur.ny) * 0.07;
      cur.sx += (target.sx - cur.sx) * 0.22;
      cur.sy += (target.sy - cur.sy) * 0.22;
      // Tilt: cursor on right tips the right side of the plane *away* (as if
      // you're leaning over to see under it from the left). Negative on rotY
      // gives that "the chip is a real wafer on a table" feel.
      const rotY = (-cur.nx * 3.6).toFixed(3);
      const rotX = (cur.ny * 2.6).toFixed(3);
      root.style.setProperty('--bg-rot-x', `${rotX}deg`);
      root.style.setProperty('--bg-rot-y', `${rotY}deg`);
      root.style.setProperty('--spot-x', `${cur.sx.toFixed(2)}%`);
      root.style.setProperty('--spot-y', `${cur.sy.toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      root.style.setProperty('--bg-rot-x', '0deg');
      root.style.setProperty('--bg-rot-y', '0deg');
      root.style.setProperty('--spot-x', '50%');
      root.style.setProperty('--spot-y', '50%');
    };
  }, [isHome, motionLevel]);

  return (
    <>
      {/* BG die-shot — wrapped in a perspective container on the homepage
          only. The inner .atlas-bg-tilt div carries the rotation driven by
          --bg-rot-x/y from the rAF loop above. The plane is sized 110% +
          centered with negative offsets so even at max tilt the wafer
          edges stay outside the viewport — no exposed black background.
          Off-homepage: bare canvas, no transform churn. */}
      {isHome ? (
        <div
          className="atlas-bg-perspective pointer-events-none fixed inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="atlas-bg-tilt">
            <CircuitFlow
              density={effectiveDensity}
              intensity={1}
              motion={motionLevel}
              narrativeStage={narrativeStage}
            />
          </div>
        </div>
      ) : (
        <CircuitFlow
          density={effectiveDensity}
          intensity={1}
          motion={motionLevel}
        />
      )}

      {/* Spotlight bloom — a small warm copper pool that follows the
          cursor. Driven by --spot-x/y from the rAF loop above. Z-stacked
          above the BG (z-0) and below the content (z-10) so the chip is
          subtly lit at the cursor but the navbar/cards stay sharp.
          The vignette + DOF layers were removed — they killed visibility
          of the chip's perimeter cache columns on the BG. */}
      {isHome ? (
        <div
          className="atlas-spotlight pointer-events-none fixed inset-0"
          aria-hidden="true"
        />
      ) : null}

      <EtchCursor />
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
  const isHome = pathname === '/';

  return (
    <NarrativeProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout onOpenSearch={() => setSearchOpen(true)} density={density} isHome={isHome} />}>
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
    </NarrativeProvider>
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
