import { useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import CircuitFlow from '../components/background/CircuitFlow.jsx';
import Navbar from '../components/shell/Navbar.jsx';
import SearchPalette from '../components/shell/SearchPalette.jsx';
import Atlas from '../pages/Atlas.jsx';
import IndexPage from '../pages/IndexPage.jsx';
import DomainPage from '../pages/DomainPage.jsx';
import ConceptPage from '../pages/ConceptPage.jsx';

function Layout({ onOpenSearch, density }) {
  return (
    <>
      <CircuitFlow density={density} intensity={1} />
      <Navbar onOpenSearch={onOpenSearch} />
      <main className="relative z-10">
        <Outlet />
      </main>
      <footer
        className="relative z-10 border-t"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-8 text-xs sm:flex-row sm:items-center sm:px-8"
          style={{ color: 'var(--ink-faint)' }}
        >
          <span>Made with 🤖 in San Diego 🌴</span>
          <span>From electrons to execution.</span>
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
  // Atlas → denser background; long-form pages → calmer.
  const density = pathname === '/' ? 1.4 : 0.7;

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout onOpenSearch={() => setSearchOpen(true)} density={density} />}>
          <Route path="/" element={<Atlas />} />
          <Route path="/index" element={<IndexPage />} />
          <Route path="/d/:domain" element={<DomainPage />} />
          <Route path="/c/:slug" element={<ConceptPage />} />
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
