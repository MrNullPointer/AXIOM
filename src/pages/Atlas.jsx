import { useState } from 'react';
import { motion } from 'framer-motion';
import DieHero from '../components/atlas/DieHero.jsx';
import MobileBlocks from '../components/atlas/MobileBlocks.jsx';

const ease = [0.22, 1, 0.36, 1];

/**
 * Atlas — the home page.
 *
 * Composition:
 *   • Editorial heading + sub-lede (massive type, lots of breathing room)
 *   • The hero die — focal chip; hovering any block flips it in place to
 *     reveal blurb + count + enter CTA. No scrolling needed for detail.
 *   • A thin meta strip below.
 */
export default function Atlas() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="pt-6 pb-10 sm:pt-12 sm:pb-14"
      >
        <div className="marker">the atlas · v0.5</div>
        <h1 className="display mt-4 text-[clamp(48px,7vw,120px)]">
          From <em className="serif-italic">electrons</em>
          <br /> to <em className="serif-italic">execution</em>.
        </h1>
        <p className="lede mt-5 max-w-xl">
          A visual encyclopedia of computer architecture. Every concept lives
          on the die where it actually runs. Tap any block to read its
          summary, click to enter.
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.1 }}
        aria-label="Die floorplan"
      >
        {/* Desktop / tablet: the die. Below md the floorplan can't be made
            legible, so swap to a stacked card list with the same content. */}
        <div className="hidden md:block">
          <DieHero hovered={hovered} setHovered={setHovered} />
        </div>
        <div className="md:hidden">
          <MobileBlocks />
        </div>
      </motion.section>

      <section className="mt-10">
        <div className="marker mb-3">scope</div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          <Stat label="domains" value="10" />
          <Stat label="concepts" value="3" />
          <Stat label="visualizers" value="3" />
          <Stat label="lineages" value="ARM · x86 · RISC-V" />
        </ul>
      </section>

      <div className="h-24" />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <li
      className="flex items-baseline justify-between border-b pb-2"
      style={{ borderColor: 'var(--rule)' }}
    >
      <span className="marker">{label}</span>
      <span className="font-mono text-sm" style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </li>
  );
}
