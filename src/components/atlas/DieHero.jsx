import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ACCENT_VAR, DOMAINS } from '../../data/domains.js';
import { conceptsByDomain } from '../../concepts/index.js';
import { useTheme } from '../../app/theme.jsx';

/**
 * DieHero — the focal chip illustration.
 *
 * Two modes share the same geometry, so the atlas's hero die and a
 * concept page's "you are here" inset stay visually coherent.
 *
 *   • Default (interactive):  hover any block to highlight + route electrons.
 *                             Used on the Atlas. `hovered` / `setHovered` drive it.
 *   • highlightDomain set:    one block is fully lit, the rest fade to ~25%.
 *                             Used as an inset on Concept pages.
 *
 * Silicon detail (M1 traces, M2 verticals, polysilicon gate ticks, vias,
 * electrons) is rendered on a layered canvas underneath the SVG floorplan.
 * The pad ring is on the die's own perimeter, not the viewport.
 */
export default function DieHero({
  hovered,
  setHovered,
  highlightDomain = null,
  compact = false,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tiltRef = useRef(null);
  const specRef = useRef(null);
  const foilRef = useRef(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const hoveredRef = useRef(hovered);
  const highlightRef = useRef(highlightDomain);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);
  useEffect(() => {
    highlightRef.current = highlightDomain;
  }, [highlightDomain]);

  const VB_W = 1200;
  const VB_H = 720;
  const cellW = VB_W / 12;
  const cellH = VB_H / 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const PAL = {
      dark: {
        m1: 'rgba(125, 249, 255, 0.20)',
        m2: 'rgba(125, 249, 255, 0.12)',
        gate: 'rgba(245, 180, 97, 0.45)',
        via: 'rgba(255, 255, 255, 0.55)',
        electron: '#7df9ff',
        electronCore: '#ffffff',
      },
      light: {
        m1: 'rgba(29, 58, 122, 0.30)',
        m2: 'rgba(29, 58, 122, 0.18)',
        gate: 'rgba(140, 65, 20, 0.55)',
        via: 'rgba(14, 26, 43, 0.70)',
        electron: '#b86a1f',
        electronCore: '#3a2511',
      },
    };

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let blocks = [];
    let staticLayer = null;
    let electrons = [];

    function buildLayout() {
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sx = width / VB_W;
      const sy = height / VB_H;
      blocks = DOMAINS.map((d) => ({
        id: d.id,
        x: (d.floor.col * cellW + 8) * sx,
        y: (d.floor.row * cellH + 8) * sy,
        w: (d.floor.w * cellW - 16) * sx,
        h: (d.floor.h * cellH - 16) * sy,
      }));

      const off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      const c = off.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const palette = themeRef.current === 'light' ? PAL.light : PAL.dark;
      const highlight = highlightRef.current;

      for (const b of blocks) {
        const isFocus = !highlight || b.id === highlight;
        const dim = isFocus ? 1 : 0.22;

        // M1 horizontal traces
        c.strokeStyle = withAlphaScale(palette.m1, dim);
        c.lineWidth = 0.7;
        c.beginPath();
        const m1Pitch = 14;
        for (let yy = b.y + 16; yy < b.y + b.h - 16; yy += m1Pitch) {
          let cx = b.x + 12 + Math.random() * 24;
          while (cx < b.x + b.w - 12) {
            const len = 22 + Math.random() * 60;
            const ex = Math.min(b.x + b.w - 12, cx + len);
            c.moveTo(cx, yy);
            c.lineTo(ex, yy);
            cx = ex + 14 + Math.random() * 22;
          }
        }
        c.stroke();

        // M2 vertical traces (sparse)
        c.strokeStyle = withAlphaScale(palette.m2, dim);
        c.lineWidth = 0.7;
        c.beginPath();
        const m2Count = Math.floor(b.w / 60);
        for (let i = 0; i < m2Count; i++) {
          const x = b.x + 18 + i * (b.w - 36) / Math.max(1, m2Count - 1);
          const y0 = b.y + 14 + Math.random() * 12;
          const y1 = b.y + b.h - 14 - Math.random() * 12;
          c.moveTo(x, y0);
          c.lineTo(x, y1);
        }
        c.stroke();

        // Polysilicon gates
        c.strokeStyle = withAlphaScale(palette.gate, dim);
        c.lineWidth = 1.1;
        c.beginPath();
        for (let yy = b.y + 16; yy < b.y + b.h - 16; yy += m1Pitch) {
          if (Math.random() > 0.6) continue;
          const gx = b.x + 20 + Math.random() * (b.w - 40);
          c.moveTo(gx, yy - 3);
          c.lineTo(gx, yy + 3);
        }
        c.stroke();

        // Vias
        c.fillStyle = withAlphaScale(palette.via, dim);
        const viaCount = Math.max(6, Math.floor((b.w * b.h) / 5500));
        for (let i = 0; i < viaCount; i++) {
          const x = b.x + 16 + Math.random() * (b.w - 32);
          const y = b.y + 16 + Math.random() * (b.h - 32);
          c.beginPath();
          c.arc(x, y, 0.9, 0, Math.PI * 2);
          c.fill();
        }
      }
      staticLayer = off;
    }

    function spawnElectron() {
      const palette = themeRef.current === 'light' ? PAL.light : PAL.dark;
      const highlight = highlightRef.current;
      const hover = hoveredRef.current;
      const target = highlight || hover;
      const block = (target && blocks.find((b) => b.id === target)) || blocks[(Math.random() * blocks.length) | 0];
      if (!block) return;
      const m1Pitch = 14;
      const rows = Math.floor((block.h - 32) / m1Pitch);
      const r = (Math.random() * Math.max(1, rows)) | 0;
      const y = block.y + 16 + r * m1Pitch;
      const dir = Math.random() < 0.5 ? 1 : -1;
      electrons.push({
        x0: block.x + 12,
        x1: block.x + block.w - 12,
        y,
        progress: dir > 0 ? 0 : 1,
        speed: 70 + Math.random() * 120,
        dir,
        color: palette.electron,
        coreColor: palette.electronCore,
        life: 1,
        block: block.id,
      });
    }

    function step(dt) {
      for (let i = electrons.length - 1; i >= 0; i--) {
        const e = electrons[i];
        const len = e.x1 - e.x0;
        e.progress += (e.speed * e.dir * dt) / 1000 / Math.max(1, len);
        if (e.progress > 1.05 || e.progress < -0.05) electrons.splice(i, 1);
      }
      const highlight = highlightRef.current;
      const hover = hoveredRef.current;
      const target = highlight ? 14 : hover ? 16 : 8;
      let safety = 6;
      while (electrons.length < target && safety-- > 0) spawnElectron();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      if (!staticLayer) return;
      ctx.drawImage(staticLayer, 0, 0, width, height);
      for (const e of electrons) {
        const t = Math.max(0, Math.min(1, e.progress));
        const x = e.x0 + (e.x1 - e.x0) * t;
        const y = e.y;
        const tailFrac = 0.18;
        const tt = Math.max(0, Math.min(1, t - e.dir * tailFrac));
        const tx = e.x0 + (e.x1 - e.x0) * tt;
        const grad = ctx.createLinearGradient(tx, y, x, y);
        grad.addColorStop(0, withAlpha(e.color, 0));
        grad.addColorStop(1, withAlpha(e.color, 0.95));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tx, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        const halo = ctx.createRadialGradient(x, y, 0, x, y, 12);
        halo.addColorStop(0, withAlpha(e.color, 0.55));
        halo.addColorStop(1, withAlpha(e.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = withAlpha(e.coreColor, 1);
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    buildLayout();

    let raf = 0;
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(64, now - last);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }
    if (reduceMotion) draw();
    else raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      buildLayout();
      electrons = [];
      if (reduceMotion) draw();
      else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    ro.observe(wrap);

    const themeWatcher = setInterval(() => {
      const cur = document.documentElement.dataset.theme;
      if (cur !== themeRef.current) {
        themeRef.current = cur;
        buildLayout();
      }
    }, 250);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearInterval(themeWatcher);
    };
  }, []);

  // Tilt parallax — interactive only on the full atlas hero, not the inset.
  useEffect(() => {
    if (compact) return;
    const wrap = wrapRef.current;
    const tilt = tiltRef.current;
    if (!wrap || !tilt) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // target/cur drive five linked things in one rAF loop:
    //   • tilt rotation + lift (the chip-shaped tilt surface)
    //   • specular highlight (moves opposite to tilt)
    //   • spotlight aperture (radial darken with a hole at cursor)
    //   • holographic foil (conic sheen anchored to cursor)
    //   • spot opacity + foil opacity (fade in/out on enter/leave)
    // Keeping all of it in one rAF avoids competing handlers and keeps
    // the chip surface, spotlight, and foil perfectly phase-locked.
    const target = { x: 0, y: 0, px: 50, py: 50, hover: 0 };
    const cur = { x: 0, y: 0, px: 50, py: 50, hover: 0 };

    function onMove(e) {
      const r = wrap.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width;
      const cy = (e.clientY - r.top) / r.height;
      target.x = (cx - 0.5) * 2;
      target.y = (cy - 0.5) * 2;
      target.px = cx * 100;
      target.py = cy * 100;
    }
    function onEnter() {
      target.hover = 1;
    }
    function onLeave() {
      target.x = 0;
      target.y = 0;
      target.px = 50;
      target.py = 50;
      target.hover = 0;
    }

    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseenter', onEnter);
    wrap.addEventListener('mouseleave', onLeave);

    let raf = 0;
    function tick() {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      // Spotlight tracks faster than tilt — flashlight feel, not glassy drift.
      cur.px += (target.px - cur.px) * 0.18;
      cur.py += (target.py - cur.py) * 0.18;
      cur.hover += (target.hover - cur.hover) * 0.1;
      const rotY = cur.x * 6;     // max ~6° around vertical
      const rotX = -cur.y * 5;    // max ~5° around horizontal
      const lift = cur.hover * 4; // subtle elevation
      tilt.style.transform = `perspective(1500px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(${lift.toFixed(2)}px)`;
      if (specRef.current) {
        const sx = 50 - cur.x * 22;
        const sy = 30 - cur.y * 22;
        specRef.current.style.background = `radial-gradient(ellipse 55% 45% at ${sx}% ${sy}%, rgba(255,255,255,0.10), transparent 70%)`;
      }
      if (foilRef.current) {
        // Conic sheen anchored to cursor — the chip surface "catches light"
        // like a Pokémon-card foil. Cyan + copper alternating so it stays
        // on-brand instead of a generic rainbow.
        const a = ((cur.x + cur.y) * 60).toFixed(1);
        foilRef.current.style.background =
          `conic-gradient(from ${a}deg at ${cur.px.toFixed(2)}% ${cur.py.toFixed(2)}%, ` +
          `transparent 0deg, ` +
          `rgba(125,249,255,0.10) 60deg, ` +
          `transparent 130deg, ` +
          `rgba(245,180,97,0.09) 200deg, ` +
          `transparent 270deg, ` +
          `rgba(125,249,255,0.06) 330deg, ` +
          `transparent 360deg)`;
        foilRef.current.style.opacity = (cur.hover * 0.85).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mouseenter', onEnter);
      wrap.removeEventListener('mouseleave', onLeave);
      tilt.style.transform = '';
    };
  }, [compact]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{
        aspectRatio: '5 / 3',
        perspective: compact ? undefined : '1500px',
      }}
    >
      {/* Static depth shadow — light liquid-glass slab. The busy die-shot
          background blurs softly through the panel so floorplan labels read
          cleanly without the die feeling detached from the page. */}
      <div
        className="absolute inset-0 rounded-2xl"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, var(--glass-bg), transparent 70%)',
          backdropFilter: 'blur(10px) saturate(140%)',
          WebkitBackdropFilter: 'blur(10px) saturate(140%)',
          boxShadow:
            '0 60px 120px -40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
          border: '1px solid var(--rule-strong)',
        }}
      />

      {/* Tilt surface — the silicon canvas + SVG floorplan + spec highlight all
          tilt together as one chip-shaped object. */}
      <div
        ref={tiltRef}
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          willChange: compact ? undefined : 'transform',
          transition: 'transform 120ms linear',
        }}
      >
        {/* Internal silicon-etching canvas removed — it competed with the
            page-level die-shot background. The die hero now reads as a
            clean glass slab over the BG, which provides the visible
            chip texture through the slab. */}

        {/* SVG floorplan layer — used for the compact concept-page inset
            where we still want the "you are here" highlight label. The
            atlas-mode pad ring (small rectangles framing the die) was
            removed; it read as a dotted boundary around the chip. */}
        {compact ? (
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
            preserveAspectRatio="none"
            style={{ transform: 'translateZ(8px)' }}
          >
            {DOMAINS.map((d) => (
              <DieBlock
                key={d.id}
                domain={d}
                cellW={cellW}
                cellH={cellH}
                isHighlight={highlightDomain === d.id}
                isDimmed={!!highlightDomain && highlightDomain !== d.id}
                compact={compact}
              />
            ))}
          </svg>
        ) : null}

        {/* Holographic foil — conic sheen anchored to the cursor that tilts
            with the chip, like light catching real metal layers under glass.
            Sits below the cards so it foils the silicon, not the labels. */}
        {!compact ? (
          <div
            ref={foilRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              transform: 'translateZ(2px)',
              opacity: 0,
              mixBlendMode: 'screen',
              willChange: 'background, opacity',
            }}
          />
        ) : null}

        {/* Interactive flip cards — one per block. Front shows the label;
            hover flips to the back which holds the description, concept
            chips, and an "enter" CTA. Detail in-place — no scroll. */}
        {!compact ? (
          <div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {DOMAINS.map((d) => (
              <FlipBlockCard
                key={d.id}
                domain={d}
                isFlipped={hovered === d.id}
                hoveredId={hovered}
                onHover={(v) => setHovered && setHovered(v ? d.id : null)}
              />
            ))}
          </div>
        ) : null}

        {/* Lithography sweep — a soft copper beam crosses the die left
            to right on first paint, tracking the per-block wipe so the
            ten labels read as one chip being lit, not ten independent
            reveals. Sits between the cards and the specular layer so
            it brightens labels but doesn't dominate the glass sheen. */}
        {!compact ? (
          <span className="atlas-die-beam" aria-hidden="true" />
        ) : null}

        {/* Specular highlight — moves opposite to tilt, like a fixed light
            source reflecting off glass. Hidden in compact mode. */}
        {!compact ? (
          <div
            ref={specRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              transform: 'translateZ(45px)',
              mixBlendMode: 'screen',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function FlipBlockCard({ domain, isFlipped, hoveredId, onHover }) {
  const { col, row, w, h } = domain.floor;
  const concepts = conceptsByDomain(domain.id);
  const accent = ACCENT_VAR[domain.accent] || 'var(--accent-1)';
  // self / other / idle drives the magnetic lift + dim. Other blocks fade
  // when one is hovered so the focus reads as a single lit functional unit.
  const blockState = isFlipped ? 'self' : hoveredId ? 'other' : 'idle';
  // Front display label scales with block width — bumped so titles feel
  // proportional to the tile, not lost in it. Same scale curve on every
  // breakpoint so the desktop and mobile tile share visual weight.
  const labelSize = w >= 5 ? '46px' : w >= 4 ? '38px' : w >= 3 ? '30px' : '26px';
  // Back description bumps in step with the front label.
  const descSize = w >= 5 ? '16px' : w >= 4 ? '15px' : '14px';
  // Wipe-in delay tracks the block's left edge, so as the die-wide
  // copper beam (CSS .atlas-die-beam) sweeps left → right, each block
  // reveals just as the beam crosses it. Beam spans 2600ms with a
  // 200ms initial delay; col is 0–11 in a 12-col grid.
  const wipeDelayMs = 200 + (col / 12) * 1900;
  // Persistent label pulse — staggered per block so the 10 labels
  // don't pulse in unison. 14s cycle with 1.4s offset between blocks
  // distributes the signal traffic evenly: at any moment ~1 block
  // is mid-sweep. Phase is offset to start *after* the wipe finishes
  // (~3s) so the load-in reveal reads cleanly first.
  const blockIndex = DOMAINS.indexOf(domain);
  const labelPulseDelayS = 4 + blockIndex * 1.4;

  return (
    <div
      className="atlas-block absolute"
      data-state={blockState}
      style={{
        left: `${(col / 12) * 100}%`,
        top: `${(row / 8) * 100}%`,
        width: `${(w / 12) * 100}%`,
        height: `${(h / 8) * 100}%`,
        padding: '8px',
        perspective: '900px',
        transformStyle: 'preserve-3d',
        // Per-block accent flows through CSS so the breath glow and lift
        // shadow share the domain color without re-passing it everywhere.
        '--block-accent': accent,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Clock breath — subtle inset glow that pulses at a slow chip
          rate, staggered per block so any moment ~one block is mid-
          breath. Speeds up + brightens when self-hovered. */}
      <span
        className="atlas-block-clock"
        aria-hidden="true"
        style={{ animationDelay: `${4 + blockIndex * 0.42}s` }}
      />
      <Link
        to={`/d/${domain.id}`}
        aria-label={`${domain.full} — view detail or enter`}
        className="block h-full w-full focus:outline-none"
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* FRONT — transparent so the silicon canvas shows through.
              .atlas-block-wipe: clip-path reveal staggered by column
              so the ten blocks light up in sequence with the beam.
              transform-style: preserve-3d so the inner stack
              (label / count / ticks) keeps its translateZ values
              instead of getting flattened. When the parent chip
              tilts on mouse, that stack reads as real internal
              parallax — the label projects forward of the count tag
              which projects forward of the substrate border. */}
          <div
            className="absolute inset-0 rounded-md atlas-block-wipe"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              border: '1px solid var(--rule)',
              padding: '14px',
              boxSizing: 'border-box',
              background: 'transparent',
              animationDelay: `${wipeDelayMs}ms`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Title centered in the full padded area — reads like
                a die-shot annotation labelling the functional region.
                Lifted +28px in Z so it sits highest in the block stack. */}
            <div
              className="flex h-full items-center justify-center"
              style={{ transform: 'translateZ(28px)' }}
            >
              <div
                className="display atlas-label-pulse leading-none text-center"
                style={{
                  fontSize: labelSize,
                  animationDelay: `${labelPulseDelayS}s`,
                }}
              >
                {domain.label}
              </div>
            </div>
            {/* Count tag — mid-depth, sits between the substrate border
                and the label so parallax is visible across all three. */}
            <div
              className="absolute bottom-3.5 left-0 right-0 text-center"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                transform: 'translateZ(14px)',
              }}
            >
              {concepts.length} live
            </div>
            {/* Corner ticks — slightly above the substrate so they
                read as etched annotation, not part of the silicon. */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ transform: 'translateZ(6px)' }}
              aria-hidden="true"
            >
              <CornerTicks color="var(--ink-faint)" />
            </div>
          </div>

          {/* BACK — glass card with detail. Inter sans-serif body, larger sizes
              so it stays readable at small block footprints. */}
          <div
            className="absolute inset-0 overflow-hidden rounded-md"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              border: `1px solid ${accent}`,
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              padding: '14px',
              boxShadow: `0 0 50px -10px ${accent}55`,
              boxSizing: 'border-box',
            }}
          >
            <div className="flex h-full flex-col">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: accent,
                }}
              >
                {domain.label}
              </div>
              <p
                className="mt-2.5"
                style={{
                  fontFamily:
                    "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
                  fontSize: descSize,
                  lineHeight: 1.5,
                  letterSpacing: '-0.005em',
                  color: 'var(--ink)',
                }}
              >
                {domain.blurb}
              </p>
              <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10.5px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                  }}
                >
                  {concepts.length} live
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: accent,
                    fontWeight: 500,
                  }}
                >
                  enter →
                </span>
              </div>
            </div>
            <CornerTicks color={accent} />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}

function CornerTicks({ color }) {
  const tick = (extra) => ({
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: color,
    pointerEvents: 'none',
    ...extra,
  });
  return (
    <>
      <span style={tick({ top: 0, left: 0, borderTop: '1px solid', borderLeft: '1px solid' })} />
      <span style={tick({ top: 0, right: 0, borderTop: '1px solid', borderRight: '1px solid' })} />
      <span style={tick({ bottom: 0, left: 0, borderBottom: '1px solid', borderLeft: '1px solid' })} />
      <span style={tick({ bottom: 0, right: 0, borderBottom: '1px solid', borderRight: '1px solid' })} />
    </>
  );
}

function PadRing({ w, h, dim }) {
  const PAD_PITCH = 36;
  const pads = [];
  const fill = dim ? 'var(--rule)' : 'var(--rule-strong)';
  for (let x = 18; x < w - 18; x += PAD_PITCH) {
    pads.push(<rect key={`t${x}`} x={x - 5} y={4} width={10} height={3} fill={fill} />);
    pads.push(<rect key={`b${x}`} x={x - 5} y={h - 7} width={10} height={3} fill={fill} />);
  }
  for (let y = 18; y < h - 18; y += PAD_PITCH) {
    pads.push(<rect key={`l${y}`} x={4} y={y - 5} width={3} height={10} fill={fill} />);
    pads.push(<rect key={`r${y}`} x={w - 7} y={y - 5} width={3} height={10} fill={fill} />);
  }
  return <g>{pads}</g>;
}

function DieBlock({ domain, cellW, cellH, isHovered, isHighlight, isDimmed, compact, onHover }) {
  const { col, row, w, h } = domain.floor;
  const x = col * cellW + 8;
  const y = row * cellH + 8;
  const width = w * cellW - 16;
  const height = h * cellH - 16;
  const concepts = conceptsByDomain(domain.id);
  const accent = ACCENT_VAR[domain.accent] || 'var(--accent-1)';
  const lit = isHovered || isHighlight;
  const dimAlpha = isDimmed ? 0.25 : 1;
  const showCornerTicks = !isDimmed;
  const showLabels = !isDimmed && !compact;
  const showHighlightLabel = isHighlight;

  return (
    <Link
      to={`/d/${domain.id}`}
      onMouseEnter={() => onHover && onHover(true)}
      onMouseLeave={() => onHover && onHover(false)}
      onFocus={() => onHover && onHover(true)}
      onBlur={() => onHover && onHover(false)}
      aria-label={`Enter ${domain.full}`}
    >
      <g style={{ cursor: 'pointer', opacity: dimAlpha }}>
        <motion.rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx="4"
          fill={lit ? accent : 'transparent'}
          fillOpacity={lit ? 0.05 : 0}
          stroke={lit ? accent : 'var(--rule)'}
          strokeWidth={lit ? 1.4 : 0.8}
          animate={{ strokeWidth: lit ? 1.4 : 0.8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        {showCornerTicks
          ? [
              [x + 4, y + 12, x + 4, y + 4, x + 12, y + 4],
              [x + width - 12, y + 4, x + width - 4, y + 4, x + width - 4, y + 12],
              [x + 4, y + height - 12, x + 4, y + height - 4, x + 12, y + height - 4],
              [
                x + width - 12,
                y + height - 4,
                x + width - 4,
                y + height - 4,
                x + width - 4,
                y + height - 12,
              ],
            ].map((pts, i) => (
              <polyline
                key={i}
                fill="none"
                stroke={lit ? accent : 'var(--ink-faint)'}
                strokeWidth="0.8"
                points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`}
              />
            ))
          : null}
        {showLabels ? (
          <>
            <text
              x={x + 14}
              y={y + 28}
              style={{
                fill: lit ? accent : 'var(--ink-faint)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              {String(DOMAINS.indexOf(domain) + 1).padStart(2, '0')} · block
            </text>
            <text
              x={x + 14}
              y={y + 58}
              style={{
                fill: 'var(--ink)',
                fontFamily: 'Fraunces, serif',
                fontSize: width > 360 ? '34px' : width > 220 ? '24px' : '18px',
                letterSpacing: '-0.01em',
              }}
            >
              {domain.label}
            </text>
            <text
              x={x + 14}
              y={y + height - 14}
              style={{
                fill: 'var(--ink-faint)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              {concepts.length} live
            </text>
          </>
        ) : null}
        {showHighlightLabel ? (
          <>
            <text
              x={x + 14}
              y={y + 28}
              style={{
                fill: accent,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
              }}
            >
              you are here
            </text>
            <text
              x={x + 14}
              y={y + 64}
              style={{
                fill: 'var(--ink)',
                fontFamily: 'Fraunces, serif',
                fontSize: width > 360 ? '40px' : width > 220 ? '28px' : '20px',
                letterSpacing: '-0.01em',
              }}
            >
              {domain.label}
            </text>
          </>
        ) : null}
      </g>
    </Link>
  );
}

// Multiply the alpha of an `rgba(...)` color by `scale`. Helper for dimming.
function withAlphaScale(rgba, scale) {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/);
  if (!m) return rgba;
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${(a * scale).toFixed(3)})`;
}

function withAlpha(color, a) {
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, a.toFixed(3) + ')');
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return color;
}
