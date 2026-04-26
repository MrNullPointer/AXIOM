import { useEffect, useRef } from 'react';
import { useTheme } from '../../app/theme.jsx';

/**
 * CircuitFlow — die-shot background.
 *
 * Two render modes, controlled by `density`:
 *   • density >= 1 (homepage): full die shot. Pitch substrate, dense gold
 *     etching, focal core with nested frames, light shafts, HBM bands,
 *     cache + logic regions, multi-color electron flow on bus lanes.
 *   • density < 1 (long-form pages): a quiet substrate only. Radial deep
 *     gradient, a faint photolithography dot grid, four corner marks, and
 *     a very slow drifting amber bloom. No blocks, no busy etching, no
 *     bright core. Lets prose stay readable on every page.
 *
 * Reduced motion: paints one frame.
 */
export default function CircuitFlow({
  density = 1,
  motion = 'full',
  narrativeStage = null,
}) {
  // Three intensity tiers, picked from the `density` prop:
  //   • rich     (Atlas, density ≥ 1)        — full chip activity
  //   • minimal  (Concept pages, density < 0.5) — very slow + sparse
  //   • else calm (Index / Domain, density 0.5–1) — visible but quiet
  // `rich` retains its old meaning so all the layout/static-paint paths
  // keep working unchanged. Long-form prose pages get `minimal`, where
  // the spawn cadence drops sharply, fewer transactions stay in flight,
  // and the electrons move at a fraction of their normal speed so the
  // chip "breathes" without ever pulling the eye off the text.
  const rich = density >= 1;
  const minimal = density < 0.5;
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  // narrativeStage is read every frame in the rAF loop. We keep it in a
  // ref so the Atlas page can update it from scroll without recreating
  // the entire effect (which would tear down the canvas + electrons).
  const narrativeStageRef = useRef(narrativeStage);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    narrativeStageRef.current = narrativeStage;
  }, [narrativeStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // The user's MotionToggle ('off') overrides everything; otherwise we
    // honour the OS-level prefers-reduced-motion preference. Either way,
    // 'paint once and stop' uses the same downstream code path.
    const reduceMotion =
      motion === 'off' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const PAL = {
      dark: {
        bgInner: '#04060c',
        bgOuter: '#01020a',
        // Almost imperceptible warm wash — keeps the silicon feeling without
        // tipping into "all gold".
        substrateGlow: 'rgba(245, 180, 97, 0.010)',
        grid: 'rgba(150, 170, 200, 0.04)',
        wafer: 'rgba(255, 255, 255, 0.03)',
        pad: 'rgba(180, 195, 220, 0.18)',
        cornerMark: 'rgba(180, 195, 220, 0.14)',

        blockFill: 'rgba(150, 170, 200, 0.012)',
        blockEdge: 'rgba(180, 195, 220, 0.13)',
        blockEdgeStrong: 'rgba(180, 195, 220, 0.22)',

        m1: 'rgba(170, 195, 220, 0.22)',
        m2: 'rgba(170, 195, 220, 0.12)',
        gate: 'rgba(255, 200, 120, 0.28)',
        via: 'rgba(220, 230, 240, 0.30)',
        sramCell: 'rgba(180, 200, 225, 0.18)',
        sramCellHot: 'rgba(255, 220, 160, 0.36)',
        sramOutline: 'rgba(180, 195, 220, 0.14)',
        cellYellow: 'rgba(255, 220, 130, 0.55)',
        cellBlue: 'rgba(125, 200, 255, 0.55)',
        cellGreen: 'rgba(140, 240, 180, 0.55)',

        bus: 'rgba(170, 195, 220, 0.13)',
        busAnchor: 'rgba(180, 200, 225, 0.30)',

        bandFill: 'rgba(245, 180, 97, 0.03)',
        bandRung: 'rgba(245, 200, 130, 0.28)',
        bandWave: '#ffd28a',

        shaftFill: 'rgba(245, 200, 138, 0.02)',
        shaftCore: 'rgba(255, 220, 160, 0.55)',
        shaftEdge: 'rgba(245, 200, 130, 0.20)',

        coreFrame: 'rgba(245, 200, 138, 0.32)',
        coreInner: 'rgba(255, 230, 180, 0.55)',
        coreGlow: '#ffcf85',

        // Four electron colours — yellow, blue, green, red. Each maps to a
        // distinct bus-channel intent: data payload, address/control,
        // ack / store completion, coherence / writeback. Red is the
        // rarest because writebacks and snoops are infrequent on a busy
        // chip but visually distinctive when they happen.
        electronYellow: '#ffd66a',
        electronBlue: '#7dc8ff',
        electronGreen: '#8aef9f',
        electronRed: '#ff8a8a',

        flash: '#ffe0a0',
        bloom: 'rgba(245, 180, 97, 0.045)',
      },
      light: {
        bgInner: '#f4eddd',
        bgOuter: '#eadfc4',
        substrateGlow: 'rgba(140, 65, 20, 0.025)',
        grid: 'rgba(29, 58, 122, 0.05)',
        wafer: 'rgba(14, 26, 43, 0.04)',
        pad: 'rgba(29, 58, 122, 0.30)',
        cornerMark: 'rgba(29, 58, 122, 0.22)',

        blockFill: 'rgba(29, 58, 122, 0.02)',
        blockEdge: 'rgba(29, 58, 122, 0.22)',
        blockEdgeStrong: 'rgba(29, 58, 122, 0.36)',

        m1: 'rgba(29, 58, 122, 0.30)',
        m2: 'rgba(29, 58, 122, 0.18)',
        gate: 'rgba(140, 65, 20, 0.40)',
        via: 'rgba(14, 26, 43, 0.45)',
        sramCell: 'rgba(29, 58, 122, 0.22)',
        sramCellHot: 'rgba(140, 65, 20, 0.40)',
        sramOutline: 'rgba(29, 58, 122, 0.16)',
        cellYellow: 'rgba(184, 130, 35, 0.55)',
        cellBlue: 'rgba(29, 58, 122, 0.55)',
        cellGreen: 'rgba(42, 111, 74, 0.55)',

        bus: 'rgba(29, 58, 122, 0.18)',
        busAnchor: 'rgba(29, 58, 122, 0.40)',

        bandFill: 'rgba(140, 65, 20, 0.08)',
        bandRung: 'rgba(140, 65, 20, 0.40)',
        bandWave: '#b86a1f',

        shaftFill: 'rgba(140, 65, 20, 0.05)',
        shaftCore: 'rgba(140, 65, 20, 0.65)',
        shaftEdge: 'rgba(140, 65, 20, 0.32)',

        coreFrame: 'rgba(140, 65, 20, 0.45)',
        coreInner: 'rgba(140, 65, 20, 0.65)',
        coreGlow: '#b86a1f',

        electronYellow: '#b8821f',
        electronBlue: '#1d3a7a',
        electronGreen: '#2a6f4a',
        electronRed: '#b3361f',

        flash: '#d18a3a',
        bloom: 'rgba(184, 106, 31, 0.07)',
      },
    };

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let regions = []; // Tier 1 macro regions.
    let bridges = [];
    let bands = [];
    let shafts = [];
    let coreCenter = { x: 0, y: 0, r: 0 };
    let staticLayer = null;
    // ---- Memory transactions ------------------------------------------ //
    //
    // Each transaction models a single memory access on the chip:
    //   1. A cell in a memory bank lights up (the "row × column" hit).
    //   2. An electron leaves that cell, riding the bus hierarchy through
    //      successive bridges toward the central focal/CPU spine.
    //   3. As the electron crosses each bus lane, that wire glows briefly
    //      (the "wire just carried data" effect).
    //   4. On arrival the focal core gets a small accept-glow.
    //   5. ~35% of transactions spawn a return trip the other way (the
    //      data response or a write ack).
    //
    // This replaces the prior random-pulse + speckle ambience. The motion
    // now reads as architecturally meaningful traffic, not decoration.
    let transactions = [];
    let litLanes = []; // { lane, color, t, ttl }
    let cellGlows = []; // { x, y, color, size, t, ttl }
    // Soft area blooms pushed when an electron *lands* (reaches its
    // destination). Reads as a brief warm-up of the area where data just
    // arrived — like a chip district waking up the moment a request hits
    // it. Larger radius + longer TTL than cellGlows; rendered behind them
    // so the cell square stays sharp on top.
    let landingFlashes = []; // { x, y, color, radius, t, ttl }
    let twinkles = []; // Cursor-reactive twinkles only.
    let lastTransactionSpawn = 0;
    let lastCursorTwinkle = 0;

    // Cursor state — feeds the soft light halo and the cursor-reactive
    // twinkle spawner. Position is in canvas-local coordinates (the canvas
    // covers the full viewport, so we can use clientX/Y directly).
    const mouse = { x: -9999, y: -9999, active: false, lastMove: 0 };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLayout();
      paintStatic();
    }

    function buildLayout() {
      const W = width;
      const H = height;
      const margin = 24;

      // HBM bands at the viewport edges.
      const bandW = clamp(W * 0.038, 32, 70);
      const bandY = margin + 14;
      const bandH = H - bandY * 2;
      bands = [
        { x: margin, y: bandY, w: bandW, h: bandH, side: 'L' },
        { x: W - margin - bandW, y: bandY, w: bandW, h: bandH, side: 'R' },
      ];

      const innerLeft = margin + bandW + 14;
      const innerRight = W - margin - bandW - 14;
      const innerW = innerRight - innerLeft;

      // Central focal — a large square stack of nested frames. Sized so it
      // reaches well beyond the hero die's footprint; its concentric frames
      // and core glow halo around the hero, never lost behind it.
      const focalSize = clamp(Math.min(W, H) * 0.66, 360, 880);
      const focalX = (W - focalSize) / 2;
      const focalY = (H - focalSize) / 2;
      coreCenter = {
        x: focalX + focalSize / 2,
        y: focalY + focalSize / 2,
        r: focalSize / 2,
      };

      // Light shafts flanking the focal — bright vertical stripes between
      // the focal stack and the surrounding macros.
      const shaftW = clamp(W * 0.018, 14, 26);
      const shaftGap = 18;
      const focalLeftEdge = focalX - shaftGap - shaftW;
      const focalRightEdge = focalX + focalSize + shaftGap;
      const shaftY = margin + 30;
      const shaftH = H - shaftY * 2;
      shafts = [
        { x: focalLeftEdge, y: shaftY, w: shaftW, h: shaftH, side: 'L' },
        { x: focalRightEdge, y: shaftY, w: shaftW, h: shaftH, side: 'R' },
      ];

      // Cache + mixed columns fill the gap between HBM bands and shafts.
      const halfStart = innerLeft;
      const halfEnd = focalLeftEdge - 14;
      const halfW = Math.max(0, halfEnd - halfStart);

      regions = [];

      if (halfW > 120) {
        // Two columns per side: outer wide cache slab, inner mixed column.
        const colGap = 10;
        const col1W = halfW * 0.55;
        const col2W = halfW - col1W - colGap;
        const top = margin + 16;
        const bot = H - margin - 16;
        const spanH = bot - top;

        const col1L = { x: halfStart, w: col1W };
        const col2L = { x: halfStart + col1W + colGap, w: col2W };
        const col2R = { x: focalRightEdge + shaftW + 14, w: col2W };
        const col1R = { x: col2R.x + col2W + colGap, w: col1W };

        regions.push(makeCacheColumn('cacheL', col1L.x, top, col1L.w, spanH));
        regions.push(makeCacheColumn('cacheR', col1R.x, top, col1R.w, spanH));
        regions.push(makeMixedColumn('mixedL', col2L.x, top, col2L.w, spanH));
        regions.push(makeMixedColumn('mixedR', col2R.x, top, col2R.w, spanH));
      }

      // Central focal stack — nested frame regions sit here. Painted as a
      // single region with sub-blocks, so the rest of the pipeline doesn't
      // need to know about it.
      regions.push({
        id: 'focal',
        x: focalX,
        y: focalY,
        w: focalSize,
        h: focalSize,
        subBlocks: [{ type: 'focal-stack', x: focalX, y: focalY, w: focalSize, h: focalSize }],
        role: 'focal',
      });

      // Auxiliary blocks above and below the focal — compact horizontal
      // controllers and IO strips that fill the gap between the focal and
      // the viewport edges.
      const auxTopH = clamp((focalY - margin - 30), 60, 200);
      const auxBotH = clamp((H - (focalY + focalSize) - margin - 30), 60, 200);
      if (auxTopH > 50) {
        regions.push(makeAuxStrip('auxTop', focalX, margin + 20, focalSize, auxTopH, 'top'));
      }
      if (auxBotH > 50) {
        regions.push(
          makeAuxStrip('auxBot', focalX, H - margin - 20 - auxBotH, focalSize, auxBotH, 'bot'),
        );
      }

      // Bridges between adjacent macros (when columns exist) and from each
      // shaft into the focal.
      bridges = [];
      const horizPairs = [
        ['cacheL', 'mixedL'],
        ['cacheR', 'mixedR'],
      ];
      for (const [a, b] of horizPairs) {
        const ra = regions.find((r) => r.id === a);
        const rb = regions.find((r) => r.id === b);
        if (!ra || !rb) continue;
        const lanes = 6;
        const yTop = Math.max(ra.y, rb.y) + Math.min(ra.h, rb.h) * 0.18;
        const yBot = Math.min(ra.y + ra.h, rb.y + rb.h) - Math.min(ra.h, rb.h) * 0.18;
        const ls = [];
        const aLeftOfB = ra.x < rb.x;
        for (let i = 0; i < lanes; i++) {
          const t = i / (lanes - 1);
          const y = yTop + (yBot - yTop) * t;
          ls.push({
            x0: aLeftOfB ? ra.x + ra.w : ra.x,
            x1: aLeftOfB ? rb.x : rb.x + rb.w,
            y,
          });
        }
        bridges.push({ from: a, to: b, kind: 'horizontal', lanes: ls });
      }
      // Bands ↔ outermost cache.
      for (const band of bands) {
        const targetId = band.side === 'L' ? 'cacheL' : 'cacheR';
        const tgt = regions.find((r) => r.id === targetId);
        if (!tgt) continue;
        const lanes = 5;
        const yTop = band.y + band.h * 0.20;
        const yBot = band.y + band.h * 0.80;
        const ls = [];
        const x0 = band.side === 'L' ? band.x + band.w : band.x;
        const x1 = band.side === 'L' ? tgt.x : tgt.x + tgt.w;
        for (let i = 0; i < lanes; i++) {
          const t = i / (lanes - 1);
          ls.push({ x0, x1, y: yTop + (yBot - yTop) * t });
        }
        bridges.push({
          from: band.side === 'L' ? 'bandL' : 'bandR',
          to: targetId,
          kind: 'horizontal',
          lanes: ls,
        });
      }
      // Mixed cols ↔ shafts (light bridges into the focal).
      const mixL = regions.find((r) => r.id === 'mixedL');
      const mixR = regions.find((r) => r.id === 'mixedR');
      if (mixL && shafts[0]) {
        const lanes = 5;
        const yTop = shafts[0].y + shafts[0].h * 0.22;
        const yBot = shafts[0].y + shafts[0].h * 0.78;
        const ls = [];
        for (let i = 0; i < lanes; i++) {
          const t = i / (lanes - 1);
          ls.push({
            x0: mixL.x + mixL.w,
            x1: shafts[0].x,
            y: yTop + (yBot - yTop) * t,
          });
        }
        bridges.push({ from: 'mixedL', to: 'shaftL', kind: 'horizontal', lanes: ls });
      }
      if (mixR && shafts[1]) {
        const lanes = 5;
        const yTop = shafts[1].y + shafts[1].h * 0.22;
        const yBot = shafts[1].y + shafts[1].h * 0.78;
        const ls = [];
        for (let i = 0; i < lanes; i++) {
          const t = i / (lanes - 1);
          ls.push({
            x0: shafts[1].x + shafts[1].w,
            x1: mixR.x,
            y: yTop + (yBot - yTop) * t,
          });
        }
        bridges.push({ from: 'shaftR', to: 'mixedR', kind: 'horizontal', lanes: ls });
      }
    }

    function makeCacheColumn(id, x, y, w, h) {
      const banksPerCluster = 6;
      const clusterGap = 14;
      const clusterH = (h - clusterGap) / 2;
      const clusters = [
        { x, y, w, h: clusterH },
        { x, y: y + clusterH + clusterGap, w, h: clusterH },
      ];
      const subBlocks = [];
      for (const cl of clusters) {
        const bandPad = 6;
        const bankH = (cl.h - bandPad * (banksPerCluster + 1)) / banksPerCluster;
        for (let i = 0; i < banksPerCluster; i++) {
          subBlocks.push({
            type: 'sram',
            x: cl.x + 6,
            y: cl.y + bandPad + i * (bankH + bandPad),
            w: cl.w - 12,
            h: bankH,
          });
        }
      }
      return { id, x, y, w, h, subBlocks, role: 'cache' };
    }

    function makeMixedColumn(id, x, y, w, h) {
      const subBlocks = [];
      const segments = [
        { type: 'sram-mini', frac: 0.34 },
        { type: 'logic', frac: 0.36 },
        { type: 'mctl', frac: 0.30 },
      ];
      let cy = y + 6;
      const inset = 6;
      const gap = 8;
      const usable = h - 12 - gap * (segments.length - 1);
      for (const seg of segments) {
        const sh = usable * seg.frac;
        subBlocks.push({
          type: seg.type,
          x: x + inset,
          y: cy,
          w: w - inset * 2,
          h: sh,
        });
        cy += sh + gap;
      }
      return { id, x, y, w, h, subBlocks, role: 'mixed' };
    }

    function makeAuxStrip(id, x, y, w, h, position) {
      const subBlocks = [];
      const inset = 6;
      // Top strip: row of 5 narrow controllers + a thin IO line.
      // Bottom strip: thin IO line + 5 controllers (mirror).
      const ioH = clamp(h * 0.22, 16, 32);
      const ctlH = h - ioH - 8;
      const ctlW = (w - inset * 2 - 16) / 5;
      const ioY = position === 'top' ? y + ctlH + 4 : y + 4;
      const ctlY = position === 'top' ? y + 4 : y + ioH + 8;
      for (let i = 0; i < 5; i++) {
        subBlocks.push({
          type: 'mctl-h',
          x: x + inset + i * (ctlW + 4),
          y: ctlY,
          w: ctlW,
          h: ctlH,
        });
      }
      subBlocks.push({
        type: 'io-h',
        x: x + inset,
        y: ioY,
        w: w - inset * 2,
        h: ioH,
      });
      return { id, x, y, w, h, subBlocks, role: 'aux' };
    }

    // ---- Static painting --------------------------------------------- //

    function paintStatic() {
      const palette = themeRef.current === 'light' ? PAL.light : PAL.dark;
      const off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      const c = off.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Substrate.
      const bg = c.createRadialGradient(
        coreCenter.x,
        coreCenter.y,
        0,
        coreCenter.x,
        coreCenter.y,
        Math.max(width, height) * 0.85,
      );
      bg.addColorStop(0, palette.bgInner);
      bg.addColorStop(1, palette.bgOuter);
      c.fillStyle = bg;
      c.fillRect(0, 0, width, height);

      // Warm radial wash centered on the focal.
      const warm = c.createRadialGradient(
        coreCenter.x,
        coreCenter.y,
        0,
        coreCenter.x,
        coreCenter.y,
        Math.max(width, height) * 0.55,
      );
      warm.addColorStop(0, palette.substrateGlow);
      warm.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = warm;
      c.fillRect(0, 0, width, height);

      // Photolithography dot grid.
      c.fillStyle = palette.grid;
      const step = 22;
      for (let yy = 0; yy < height; yy += step) {
        for (let xx = 0; xx < width; xx += step) {
          c.fillRect(xx, yy, 0.6, 0.6);
        }
      }

      // Wafer rings.
      c.strokeStyle = palette.wafer;
      c.lineWidth = 0.6;
      const wcx = -width * 0.18;
      const wcy = height * 1.12;
      for (let i = 0; i < 5; i++) {
        const r = Math.min(width, height) * 0.65 + i * 100;
        c.beginPath();
        c.arc(wcx, wcy, r, 0, Math.PI * 2);
        c.stroke();
      }

      // Bus bridges.
      for (const br of bridges) {
        for (const lane of br.lanes) {
          c.strokeStyle = palette.bus;
          c.lineWidth = 0.7;
          c.beginPath();
          c.moveTo(lane.x0, lane.y);
          c.lineTo(lane.x1, lane.y);
          c.stroke();
          c.fillStyle = palette.busAnchor;
          c.fillRect(lane.x0 - 2, lane.y - 1, 4, 2);
          c.fillRect(lane.x1 - 2, lane.y - 1, 4, 2);
        }
      }

      // HBM bands.
      for (const band of bands) {
        c.fillStyle = palette.bandFill;
        roundRect(c, band.x, band.y, band.w, band.h, 4);
        c.fill();
        c.strokeStyle = palette.blockEdgeStrong;
        c.lineWidth = 0.9;
        roundRect(c, band.x + 0.5, band.y + 0.5, band.w - 1, band.h - 1, 4);
        c.stroke();
        const pitch = 9;
        c.strokeStyle = palette.bandRung;
        c.lineWidth = 0.9;
        c.beginPath();
        for (let yy = band.y + 8; yy < band.y + band.h - 8; yy += pitch) {
          c.moveTo(band.x + 4, yy);
          c.lineTo(band.x + band.w - 4, yy);
        }
        c.stroke();
        c.fillStyle = palette.via;
        const spineX = band.x + band.w / 2;
        for (let yy = band.y + 12; yy < band.y + band.h - 12; yy += 8) {
          c.fillRect(spineX - 0.5, yy, 1, 3);
        }
      }

      // Light shafts — bright vertical bars flanking the focal. Painted as a
      // dark frame plus a strong central bright line.
      for (const s of shafts) {
        c.fillStyle = palette.shaftFill;
        roundRect(c, s.x, s.y, s.w, s.h, 3);
        c.fill();
        c.strokeStyle = palette.shaftEdge;
        c.lineWidth = 0.7;
        roundRect(c, s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1, 3);
        c.stroke();
        // Bright core of the shaft.
        c.fillStyle = palette.shaftCore;
        c.fillRect(s.x + s.w / 2 - 0.6, s.y + 4, 1.2, s.h - 8);
        // Tick marks across — like the bright cross-stripes in the reference.
        c.fillStyle = palette.shaftEdge;
        for (let yy = s.y + 18; yy < s.y + s.h - 18; yy += 22) {
          c.fillRect(s.x + 1, yy, s.w - 2, 1);
        }
      }

      // Macro regions — fills + sub-blocks.
      for (const r of regions) {
        if (r.role !== 'focal') {
          c.fillStyle = palette.blockFill;
          roundRect(c, r.x, r.y, r.w, r.h, 5);
          c.fill();
          c.strokeStyle = palette.blockEdge;
          c.lineWidth = 0.6;
          roundRect(c, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 5);
          c.stroke();
        }
        for (const b of r.subBlocks) {
          paintSubBlock(c, b, palette);
        }
      }

      // (Pad ring + corner alignment marks intentionally removed — they
      // looked like a dotted/dashed border framing the page.)

      // Calm mode — wash the whole die shot with a dark scrim so the etching
      // reads as a quiet backdrop, never competes with prose. We still keep
      // all the structure underneath for visual interest.
      if (!rich) {
        c.fillStyle = 'rgba(2, 4, 8, 0.78)';
        c.fillRect(0, 0, width, height);
      }

      staticLayer = off;
    }

    // ---- Sub-block painters ------------------------------------------ //

    function paintSubBlock(c, b, p) {
      switch (b.type) {
        case 'sram':
          paintSramBank(c, b, p, true);
          break;
        case 'sram-mini':
          paintSramBank(c, b, p, false);
          break;
        case 'logic':
          paintLogic(c, b, p);
          break;
        case 'mctl':
          paintMctlV(c, b, p);
          break;
        case 'mctl-h':
          paintMctlH(c, b, p);
          break;
        case 'io-h':
          paintIoH(c, b, p);
          break;
        case 'focal-stack':
          paintFocalStack(c, b, p);
          break;
        default:
          break;
      }
    }

    function paintSramBank(c, b, p, dense) {
      c.strokeStyle = p.sramOutline;
      c.lineWidth = 0.7;
      c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

      const cell = dense ? 3 : 4;
      const cellGap = 1;
      const stride = cell + cellGap;
      const stripePitch = stride * 10;

      c.fillStyle = p.m1;
      for (let yy = b.y + 4; yy < b.y + b.h - 4; yy += stripePitch) {
        c.fillRect(b.x + 2, yy, b.w - 4, 1);
      }

      // Cells are uniform and dim at rest — they only light up when a
      // memory transaction targets them. (Old code sprinkled random colored
      // dots; that read as noise rather than activity, so we removed it.)
      c.fillStyle = p.sramCell;
      for (let yy = b.y + 3; yy < b.y + b.h - 3; yy += stride) {
        for (let xx = b.x + 3; xx < b.x + b.w - 3; xx += stride) {
          c.fillRect(xx, yy, cell, cell);
        }
      }

      // Address-decode column (left edge brighter strip).
      c.fillStyle = p.gate;
      c.fillRect(b.x + 2, b.y + 4, 1.4, b.h - 8);
    }

    function paintLogic(c, b, p) {
      const lanes = Math.max(4, Math.floor(b.h / 16));
      c.strokeStyle = p.m1;
      c.lineWidth = 0.7;
      c.beginPath();
      for (let i = 0; i < lanes; i++) {
        const ly = b.y + 8 + (i * (b.h - 16)) / Math.max(1, lanes - 1);
        c.moveTo(b.x + 6, ly);
        c.lineTo(b.x + b.w - 6, ly);
      }
      c.stroke();

      c.strokeStyle = p.m2;
      c.lineWidth = 0.5;
      c.beginPath();
      const vCount = Math.floor(b.w / 16);
      for (let i = 0; i < vCount; i++) {
        const x = b.x + 8 + (i * (b.w - 16)) / Math.max(1, vCount - 1);
        c.moveTo(x, b.y + 8);
        c.lineTo(x, b.y + b.h - 8);
      }
      c.stroke();

      c.strokeStyle = p.gate;
      c.lineWidth = 0.8;
      c.beginPath();
      for (let i = 0; i < lanes; i++) {
        const ly = b.y + 8 + (i * (b.h - 16)) / Math.max(1, lanes - 1);
        for (let g = 0; g < 8; g++) {
          if (Math.random() > 0.55) continue;
          const gx = b.x + 10 + Math.random() * (b.w - 20);
          c.moveTo(gx, ly - 2);
          c.lineTo(gx, ly + 2);
        }
      }
      c.stroke();

      c.fillStyle = p.via;
      const viaCount = Math.floor((b.w * b.h) / 320);
      for (let i = 0; i < viaCount; i++) {
        const x = b.x + 6 + Math.random() * (b.w - 12);
        const y = b.y + 8 + Math.random() * (b.h - 16);
        c.beginPath();
        c.arc(x, y, 0.7, 0, Math.PI * 2);
        c.fill();
      }

      c.strokeStyle = p.blockEdge;
      c.lineWidth = 0.5;
      c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }

    function paintMctlV(c, b, p) {
      const channels = Math.max(3, Math.floor(b.h / 14));
      const chH = (b.h - 6) / channels;
      for (let i = 0; i < channels; i++) {
        const cy = b.y + 3 + i * chH;
        c.strokeStyle = p.m1;
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(b.x + 4, cy + chH / 2);
        c.lineTo(b.x + b.w - 4, cy + chH / 2);
        c.stroke();
        c.fillStyle = p.via;
        for (let x = b.x + 8; x < b.x + b.w - 8; x += 6) {
          c.beginPath();
          c.arc(x, cy + chH / 2, 0.6, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.strokeStyle = p.blockEdge;
      c.lineWidth = 0.5;
      c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }

    function paintMctlH(c, b, p) {
      const channels = Math.max(3, Math.floor(b.w / 14));
      const chW = (b.w - 6) / channels;
      for (let i = 0; i < channels; i++) {
        const cx = b.x + 3 + i * chW;
        c.strokeStyle = p.m1;
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(cx + chW / 2, b.y + 4);
        c.lineTo(cx + chW / 2, b.y + b.h - 4);
        c.stroke();
        c.fillStyle = p.via;
        for (let y = b.y + 8; y < b.y + b.h - 8; y += 6) {
          c.beginPath();
          c.arc(cx + chW / 2, y, 0.6, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.strokeStyle = p.blockEdge;
      c.lineWidth = 0.5;
      c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }

    function paintIoH(c, b, p) {
      c.fillStyle = p.pad;
      const cols = Math.max(8, Math.floor(b.w / 12));
      const cellW = (b.w - 8) / cols;
      for (let i = 0; i < cols; i++) {
        const x = b.x + 4 + i * cellW + cellW / 2 - 2;
        c.fillRect(x, b.y + 4, 3, b.h - 8);
      }
      c.strokeStyle = p.blockEdge;
      c.lineWidth = 0.5;
      c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }

    /**
     * Focal stack — concentric nested frames around a bright core.
     *
     * Outermost frame: SRAM mosaic.
     * Middle frame: pipeline lanes + register-file grid.
     * Innermost frame: bright register file with crosshair gate marks.
     * Core: the bright golden centre square.
     *
     * The hero die overlays this, but the bright glow halos around it.
     */
    function paintFocalStack(c, b, p) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      // Five concentric frames, each roughly two-thirds of the previous. The
      // outermost can extend past the viewport's centre column — that's what
      // gives the BG its "nested frames around a focal" silhouette even when
      // the hero die sits in the middle.
      const sizes = [b.w, b.w * 0.78, b.w * 0.56, b.w * 0.36, b.w * 0.18, b.w * 0.07];
      const frames = sizes.map((sz) => ({
        x: cx - sz / 2,
        y: cy - sz / 2,
        w: sz,
        h: sz,
      }));

      // Frame 0 — outermost: SRAM mosaic ring (largest gap, dense detail).
      paintFrameRing(c, frames[0], frames[1], 'sram', p);
      // Frame 1 — outer ring: logic lanes.
      paintFrameRing(c, frames[1], frames[2], 'lanes', p);
      // Frame 2 — middle ring: register-file SRAM grid.
      paintFrameRing(c, frames[2], frames[3], 'regfile', p);
      // Frame 3 — inner ring: bright crosshair etching.
      paintFrameRing(c, frames[3], frames[4], 'crosshair', p);
      // Frame 4 — innermost ring: dense bright cells around the core.
      paintFrameRing(c, frames[4], frames[5], 'regfile', p);
      // Frame 5 — the core itself, the brightest square.
      const core = frames[5];
      c.fillStyle = withAlpha(p.coreInner, 0.18);
      roundRect(c, core.x, core.y, core.w, core.h, 4);
      c.fill();
      c.strokeStyle = withAlpha(p.coreInner, 0.85);
      c.lineWidth = 1.2;
      roundRect(c, core.x + 0.5, core.y + 0.5, core.w - 1, core.h - 1, 4);
      c.stroke();
      // Cross + dot.
      c.strokeStyle = p.coreInner;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(core.x + 4, cy);
      c.lineTo(core.x + core.w - 4, cy);
      c.moveTo(cx, core.y + 4);
      c.lineTo(cx, core.y + core.h - 4);
      c.stroke();
      c.fillStyle = p.coreInner;
      c.beginPath();
      c.arc(cx, cy, 1.6, 0, Math.PI * 2);
      c.fill();

      // Frame outlines — bright amber, stepping in opacity as we move inward.
      for (let i = 0; i < frames.length - 1; i++) {
        const inwardness = i / (frames.length - 2);
        const alpha = 0.45 + inwardness * 0.35;
        c.strokeStyle = withAlpha(p.coreFrame, alpha);
        c.lineWidth = i === 0 ? 1.4 : 1.0 + inwardness * 0.4;
        roundRect(
          c,
          frames[i].x + 0.5,
          frames[i].y + 0.5,
          frames[i].w - 1,
          frames[i].h - 1,
          i === 0 ? 8 : 5,
        );
        c.stroke();
      }

      // Symmetric "pier" lines extending outward from the focal cardinal
      // directions to the frame edges — adds the radiating-frame feel.
      c.fillStyle = withAlpha(p.coreFrame, 0.7);
      const arms = 12;
      for (let i = 0; i < arms; i++) {
        const ang = (i / arms) * Math.PI * 2;
        const x1 = cx + Math.cos(ang) * (frames[1].w / 2 - 4);
        const y1 = cy + Math.sin(ang) * (frames[1].h / 2 - 4);
        const x2 = cx + Math.cos(ang) * (frames[0].w / 2 - 4);
        const y2 = cy + Math.sin(ang) * (frames[0].h / 2 - 4);
        c.fillRect((x1 + x2) / 2 - 0.5, (y1 + y2) / 2 - 0.5, 1, 1);
      }
    }

    function paintFrameRing(c, outer, inner, style, p) {
      // Paints `style` inside the ring between outer and inner frames.
      // Implemented by clipping to outer minus inner.
      c.save();
      c.beginPath();
      c.rect(outer.x, outer.y, outer.w, outer.h);
      c.rect(inner.x + inner.w, inner.y, -inner.w, inner.h);
      c.clip('evenodd');

      switch (style) {
        case 'sram': {
          // Thin SRAM cells filling the ring — uniform dim. Cells light up
          // only via transactions, not via static speckles.
          const cell = 3;
          const stride = cell + 1;
          c.fillStyle = p.sramCell;
          for (let yy = outer.y + 3; yy < outer.y + outer.h - 3; yy += stride) {
            for (let xx = outer.x + 3; xx < outer.x + outer.w - 3; xx += stride) {
              c.fillRect(xx, yy, cell, cell);
            }
          }
          // Stripe dividers.
          c.fillStyle = p.m1;
          for (let yy = outer.y + 4; yy < outer.y + outer.h - 4; yy += stride * 10) {
            c.fillRect(outer.x + 2, yy, outer.w - 4, 1);
          }
          break;
        }
        case 'lanes': {
          // Ringed pipeline-lane look — horizontal lanes dominate.
          const lanePitch = 8;
          c.strokeStyle = p.m1;
          c.lineWidth = 0.7;
          c.beginPath();
          for (let yy = outer.y + 6; yy < outer.y + outer.h - 6; yy += lanePitch) {
            c.moveTo(outer.x + 4, yy);
            c.lineTo(outer.x + outer.w - 4, yy);
          }
          c.stroke();
          // Sparse vias.
          c.fillStyle = p.via;
          for (let i = 0; i < 80; i++) {
            const x = outer.x + 4 + Math.random() * (outer.w - 8);
            const y = outer.y + 6 + Math.random() * (outer.h - 12);
            c.beginPath();
            c.arc(x, y, 0.7, 0, Math.PI * 2);
            c.fill();
          }
          break;
        }
        case 'regfile': {
          // Register-file SRAM with brighter cells.
          const cell = 4;
          const stride = cell + 1;
          c.fillStyle = p.sramCellHot;
          for (let yy = outer.y + 3; yy < outer.y + outer.h - 3; yy += stride) {
            for (let xx = outer.x + 3; xx < outer.x + outer.w - 3; xx += stride) {
              c.fillRect(xx, yy, cell, cell);
            }
          }
          break;
        }
        case 'crosshair': {
          // A thin grid + diagonal pier marks. Reads as a bright control ring.
          c.strokeStyle = p.gate;
          c.lineWidth = 0.7;
          c.beginPath();
          const pitch = 6;
          for (let yy = outer.y + 4; yy < outer.y + outer.h - 4; yy += pitch) {
            c.moveTo(outer.x + 3, yy);
            c.lineTo(outer.x + outer.w - 3, yy);
          }
          for (let xx = outer.x + 4; xx < outer.x + outer.w - 4; xx += pitch) {
            c.moveTo(xx, outer.y + 3);
            c.lineTo(xx, outer.y + outer.h - 3);
          }
          c.stroke();
          break;
        }
        default:
          break;
      }
      c.restore();
    }

    // ---- Animation: pulses + flashes + bands + core ------------------- //

    /**
     * Build the bridge chain that takes a region's traffic toward the focal
     * core. Returns an ordered list of bridges to traverse and a final hop
     * directly into the focal centre. Mirrors the actual bus topology:
     *
     *   bandL → cacheL → mixedL → shaftL → focal core
     *   bandR → cacheR → mixedR → shaftR → focal core   (and back)
     */
    function chainToFocal(srcId) {
      const findBridge = (a, b) =>
        bridges.find(
          (br) => (br.from === a && br.to === b) || (br.from === b && br.to === a),
        );
      const left = ['bandL', 'cacheL', 'mixedL', 'shaftL'];
      const right = ['bandR', 'cacheR', 'mixedR', 'shaftR'];
      const ladder = left.includes(srcId) ? left : right.includes(srcId) ? right : null;
      if (!ladder) return null;
      const startIdx = ladder.indexOf(srcId);
      const chain = [];
      for (let i = startIdx; i < ladder.length - 1; i++) {
        const br = findBridge(ladder[i], ladder[i + 1]);
        if (!br) return null;
        chain.push(br);
      }
      return chain;
    }

    /**
     * Pick a random source region for a memory transaction. Cache and band
     * regions dominate (they're where the data lives); mixed regions weigh
     * in less often (they're more controller / decode than storage).
     */
    function pickSourceRegionId() {
      const r = Math.random();
      // 60% cache, 25% HBM bands, 15% mixed (memory controllers).
      if (r < 0.30) return Math.random() < 0.5 ? 'cacheL' : 'cacheR';
      if (r < 0.55) return Math.random() < 0.5 ? 'cacheR' : 'cacheL';
      if (r < 0.80) return Math.random() < 0.5 ? 'bandL' : 'bandR';
      return Math.random() < 0.5 ? 'mixedL' : 'mixedR';
    }

    /**
     * scriptedSpawn — picks a region + direction matching the active
     * scroll-narrative stage. Each stage corresponds to a moment in the
     * cache-miss story (see scenarioStages.js); the BG canvas plays
     * matching electron traffic so the background tells the story too.
     *
     *   0 issue        → outbound from focal toward a cache (request leaves core)
     *   1 L1/L2 miss   → outbound to cacheL/R (probes walking out)
     *   2 ring bus     → inbound from cache (reply riding the ring)
     *   3 L3/DRAM      → outbound to HBM band (the cliff: off-chip)
     *   4 coherence    → outbound to mixed regions (snoops to other slices)
     *   5 fill cascade → inbound from band → cache (data riding back)
     *   6 retire       → inbound from cache to focal (data lands in register)
     */
    function scriptedSpawn(stage) {
      switch (stage) {
        case 0:
          return { regionId: Math.random() < 0.5 ? 'cacheL' : 'cacheR', outbound: true };
        case 1:
          return { regionId: Math.random() < 0.5 ? 'cacheL' : 'cacheR', outbound: true };
        case 2:
          return { regionId: Math.random() < 0.5 ? 'cacheL' : 'cacheR', outbound: false };
        case 3:
          return { regionId: Math.random() < 0.5 ? 'bandL' : 'bandR', outbound: true };
        case 4:
          return { regionId: Math.random() < 0.5 ? 'mixedL' : 'mixedR', outbound: false };
        case 5:
          return { regionId: Math.random() < 0.5 ? 'bandL' : 'bandR', outbound: false };
        case 6:
          return { regionId: Math.random() < 0.5 ? 'cacheL' : 'cacheR', outbound: false };
        default:
          return null;
      }
    }

    /**
     * Pick a random cell position inside the source region. For SRAM banks
     * we snap to the cell grid so the glow aligns with a real cell. For
     * HBM bands we pick a row × column on the stacked layers.
     */
    function pickCellInRegion(regionId) {
      const region = regions.find((r) => r.id === regionId);
      if (region) {
        // Prefer SRAM-type sub-blocks; fall back to logic for mixed cols.
        const candidates = region.subBlocks.filter(
          (b) => b.type === 'sram' || b.type === 'sram-mini' || b.type === 'logic',
        );
        if (!candidates.length) return null;
        const blk = candidates[(Math.random() * candidates.length) | 0];
        // Snap to cell grid for visual alignment.
        const cellSize = blk.type === 'sram' ? 3 : blk.type === 'sram-mini' ? 4 : 6;
        const stride = cellSize + 1;
        const cx = blk.x + 4 + Math.floor(Math.random() * ((blk.w - 8) / stride)) * stride + cellSize / 2;
        const cy = blk.y + 4 + Math.floor(Math.random() * ((blk.h - 8) / stride)) * stride + cellSize / 2;
        return { x: cx, y: cy };
      }
      // Region might be an HBM band (bandL/bandR), which lives in `bands`,
      // not `regions`. Pick a row × column on the band's layered grid.
      const band = bands.find((b) => (b.side === 'L' ? 'bandL' : 'bandR') === regionId);
      if (band) {
        const layerCount = 8;
        const layer = (Math.random() * layerCount) | 0;
        const ly = band.y + 8 + layer * ((band.h - 16) / layerCount);
        const tsv = (Math.random() * 5) | 0;
        const lx = band.x + 8 + tsv * ((band.w - 16) / 4);
        return { x: lx, y: ly };
      }
      return null;
    }

    /**
     * Pick an electron colour weighted by direction. Reads dominate yellow
     * (data) + blue (control). Writes lean green/red (ack + writeback).
     */
    function pickColor(palette, outbound) {
      const r = Math.random();
      if (outbound) {
        // Stores / evictions / coherence: more green and red.
        return r < 0.40
          ? palette.electronGreen
          : r < 0.62
            ? palette.electronYellow
            : r < 0.85
              ? palette.electronBlue
              : palette.electronRed;
      }
      // Loads — yellow data dominates; rare red for writebacks/snoops.
      return r < 0.50
        ? palette.electronYellow
        : r < 0.78
          ? palette.electronBlue
          : r < 0.93
            ? palette.electronGreen
            : palette.electronRed;
    }

    /**
     * Spawn a memory transaction.
     *
     * Inbound (default) — the read path: a memory cell lights up, an
     * electron leaves it, walks the bus hierarchy, lands at the focal
     * (CPU) where it ripples through the cache rings (L3 → L2 → L1 →
     * TLB → register).
     *
     * Outbound (`outbound: true`) — the write path: focal core glows, an
     * electron leaves it heading away from the CPU, traverses the bus
     * hierarchy in reverse, and writes a destination cell at a memory
     * bank (the "store completes" event).
     *
     * Each leg's bridge lane is added to `litLanes` the moment the
     * electron enters it, so the wire glows under the electron as it
     * passes — the comet-trail "wire just carried this signal" effect.
     */
    function spawnTransaction({ outbound = false, regionId = null } = {}) {
      const palette = themeRef.current === 'light' ? PAL.light : PAL.dark;

      const srcId = regionId || pickSourceRegionId();
      const chain = chainToFocal(srcId);
      if (!chain) return;

      const cell = pickCellInRegion(srcId);
      if (!cell) return;

      const color = pickColor(palette, outbound);

      // Build waypoint list. For a read, the path goes cell → bridges →
      // focal. For a write, focal → bridges (reversed) → cell. Each
      // waypoint may carry a `laneRef`; that bridge is what gets lit
      // when the electron enters this leg.
      const waypoints = [];
      const orderedChain = outbound ? [...chain].reverse() : chain;
      let lastX, lastY;
      if (outbound) {
        waypoints.push({ x: coreCenter.x, y: coreCenter.y });
        lastX = coreCenter.x;
        lastY = coreCenter.y;
      } else {
        waypoints.push({ x: cell.x, y: cell.y });
        lastX = cell.x;
        lastY = cell.y;
      }
      for (const br of orderedChain) {
        const lane = br.lanes[(Math.random() * br.lanes.length) | 0];
        const d0 = Math.hypot(lane.x0 - lastX, lane.y - lastY);
        const d1 = Math.hypot(lane.x1 - lastX, lane.y - lastY);
        if (d0 < d1) {
          waypoints.push({ x: lane.x0, y: lane.y });
          waypoints.push({ x: lane.x1, y: lane.y, laneRef: { lane, color } });
          lastX = lane.x1;
          lastY = lane.y;
        } else {
          waypoints.push({ x: lane.x1, y: lane.y });
          waypoints.push({ x: lane.x0, y: lane.y, laneRef: { lane, color } });
          lastX = lane.x0;
          lastY = lane.y;
        }
      }
      // Closing hop.
      if (outbound) {
        waypoints.push({ x: cell.x, y: cell.y });
      } else {
        waypoints.push({ x: coreCenter.x, y: coreCenter.y });
      }

      // Origin glow — cell for reads, focal for writes.
      if (outbound) {
        cellGlows.push({
          x: coreCenter.x,
          y: coreCenter.y,
          size: 5,
          color,
          ttl: 0.55,
          t: 0,
        });
      } else {
        cellGlows.push({
          x: cell.x,
          y: cell.y,
          size: 4.5,
          color,
          ttl: 0.55,
          t: 0,
        });
      }

      // Loads sometimes spawn a store on completion (write-allocate, dirty
      // eviction). Stores rarely follow with a read.
      const triggerOpposite = outbound
        ? Math.random() < 0.10
        : Math.random() < 0.30;

      // Electrons travel at full speed in rich/calm modes; on long-form
      // pages they drift much slower so a single transaction takes its
      // time to traverse the chip — the eye registers it without the
      // movement ever pulling focus from prose.
      const baseSpeed = minimal ? 90 : 260;
      const speedJitter = minimal ? 40 : 120;

      transactions.push({
        waypoints,
        legIdx: 0,
        legProgress: 0,
        speed: baseSpeed + Math.random() * speedJitter,
        color,
        srcId,
        srcCell: cell,
        outbound,
        stage: 'cellGlow', // 'cellGlow' | 'travel' | 'arrived'
        stageT: 0,
        cellGlowDuration: minimal ? 0.6 : 0.32,
        arrivedDuration: minimal ? 0.7 : 0.45,
        triggerOpposite,
      });
    }

    function step(dt, now) {
      const dts = dt / 1000;

      // Helper: when a transaction enters a new leg, light the bridge
      // wire that leg traverses. Long TTL so by the time the electron
      // reaches the destination the entire path is glowing simultaneously.
      function igniteCurrentLeg(tx) {
        const b = tx.waypoints[tx.legIdx + 1];
        if (b && b.laneRef) {
          litLanes.push({
            lane: b.laneRef.lane,
            color: b.laneRef.color,
            // legDuration ≈ legLength / speed. Lane TTL is much longer so
            // the whole path lingers as one lit chain after the electron
            // has moved on. Phase 1 of the env rises while the electron
            // is on the lane; phase 2 holds; phase 3 fades.
            t: 0,
            ttl: 2.4,
          });
        }
      }

      function rippleFocalArrival(tx) {
        // Inbound arrival cascades through the cache hierarchy rings:
        // L3 (outermost) → L2 → L1 → TLB → register file (innermost).
        // Each ring gets a brief cell glow at a random angle, with a small
        // delay between them. Negative `t` values stage the start times.
        if (tx.outbound) return;
        const radii = [0.85, 0.62, 0.42, 0.24, 0.10];
        for (let i = 0; i < radii.length; i++) {
          const ang = Math.random() * Math.PI * 2;
          const r = coreCenter.r * radii[i];
          cellGlows.push({
            x: coreCenter.x + Math.cos(ang) * r,
            y: coreCenter.y + Math.sin(ang) * r,
            size: 5 - i * 0.5,
            color: tx.color,
            ttl: 0.55,
            t: -i * 0.07, // staggered ignition
          });
        }
      }

      // Advance each transaction.
      for (let i = transactions.length - 1; i >= 0; i--) {
        const tx = transactions[i];
        tx.stageT += dts;

        if (tx.stage === 'cellGlow') {
          if (tx.stageT >= tx.cellGlowDuration) {
            tx.stage = 'travel';
            tx.stageT = 0;
            // Light the very first leg's lane the moment travel begins.
            igniteCurrentLeg(tx);
          }
        } else if (tx.stage === 'travel') {
          while (tx.stage === 'travel' && tx.legIdx < tx.waypoints.length - 1) {
            const a = tx.waypoints[tx.legIdx];
            const b = tx.waypoints[tx.legIdx + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            if (len < 0.5) {
              tx.legIdx++;
              tx.legProgress = 0;
              igniteCurrentLeg(tx);
              continue;
            }
            const dProgress = (tx.speed * dts) / len;
            tx.legProgress += dProgress;
            if (tx.legProgress >= 1) {
              tx.legIdx++;
              tx.legProgress = 0;
              if (tx.legIdx >= tx.waypoints.length - 1) {
                tx.stage = 'arrived';
                tx.stageT = 0;
                const last = tx.waypoints[tx.waypoints.length - 1];
                cellGlows.push({
                  x: last.x,
                  y: last.y,
                  size: 4,
                  color: tx.color,
                  ttl: 0.55,
                  t: 0,
                });
                // Area bloom — warms a wide patch of substrate where the
                // electron just landed, then fades. Larger + longer than
                // the cell glow so the eye registers "something arrived
                // here" even from across the page.
                landingFlashes.push({
                  x: last.x,
                  y: last.y,
                  radius: minimal ? 70 : 95,
                  color: tx.color,
                  ttl: minimal ? 1.4 : 1.05,
                  t: 0,
                });
                rippleFocalArrival(tx);
              } else {
                igniteCurrentLeg(tx);
              }
            } else {
              break;
            }
          }
        } else if (tx.stage === 'arrived') {
          if (tx.stageT >= tx.arrivedDuration) {
            if (tx.triggerOpposite) {
              spawnTransaction({
                outbound: !tx.outbound,
                regionId: tx.srcId,
              });
            }
            transactions.splice(i, 1);
          }
        }
      }

      // Decay lit lanes, cell glows, twinkles.
      for (let i = litLanes.length - 1; i >= 0; i--) {
        litLanes[i].t += dts;
        if (litLanes[i].t > litLanes[i].ttl) litLanes.splice(i, 1);
      }
      for (let i = landingFlashes.length - 1; i >= 0; i--) {
        landingFlashes[i].t += dts;
        if (landingFlashes[i].t > landingFlashes[i].ttl) landingFlashes.splice(i, 1);
      }
      for (let i = cellGlows.length - 1; i >= 0; i--) {
        cellGlows[i].t += dts;
        if (cellGlows[i].t > cellGlows[i].ttl) cellGlows.splice(i, 1);
      }
      for (let i = twinkles.length - 1; i >= 0; i--) {
        twinkles[i].t += dts;
        if (twinkles[i].t > twinkles[i].ttl) twinkles.splice(i, 1);
      }

      // Spawn cadence — multiple parallel transactions in flight, like a
      // real CPU's MSHRs (10+ outstanding misses) on Atlas/Index. On
      // long-form concept pages we drop to a trickle. In scripted
      // narrative mode we run faster (more activity = clearer story)
      // and pick the source/direction matching the active stage so the
      // BG traffic visibly tracks the cache-miss journey.
      const stage = narrativeStageRef.current;
      const isScripted = stage !== null && stage !== undefined && rich;
      const spawnInterval = minimal ? 2200 : isScripted ? 180 : 320;
      const maxConcurrent = minimal ? 2 : isScripted ? 12 : 9;
      if (now - lastTransactionSpawn > spawnInterval && transactions.length < maxConcurrent) {
        if (isScripted) {
          const spec = scriptedSpawn(stage);
          if (spec) spawnTransaction(spec);
        } else {
          spawnTransaction({ outbound: Math.random() < 0.30 });
        }
        lastTransactionSpawn = now;
      }

      // Cursor-reactive twinkles — local pixel-level activity wherever
      // the user moves the pointer. Works on both rich and calm pages.
      const cursorActive = mouse.active && now - mouse.lastMove < 800;
      if (cursorActive && now - lastCursorTwinkle > (rich ? 55 : 110) && twinkles.length < 24) {
        spawnCursorTwinkle();
        lastCursorTwinkle = now;
      }
    }

    function spawnCursorTwinkle() {
      const palette = themeRef.current === 'light' ? PAL.light : PAL.dark;
      // Spawn within ~70px of the cursor, biased slightly toward the
      // outside so the light feels like it's spreading from the pointer.
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 64;
      const x = mouse.x + Math.cos(angle) * dist;
      const y = mouse.y + Math.sin(angle) * dist;
      // Same yellow / blue / green palette as the bus electrons. Makes the
      // cursor effect feel native to the chip rather than a foreign overlay.
      const r = Math.random();
      const color =
        r < 0.45
          ? palette.electronYellow
          : r < 0.78
            ? palette.electronBlue
            : palette.electronGreen;
      twinkles.push({
        x,
        y,
        size: 1.4 + Math.random() * 1.4,
        color,
        ttl: 0.45 + Math.random() * 0.35,
        t: 0,
      });
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);
      if (staticLayer) ctx.drawImage(staticLayer, 0, 0, width, height);

      const palette = themeRef.current === 'light' ? PAL.light : PAL.dark;

      // Drifting bloom — soft amber glaze that orbits behind everything.
      const bx = width * (0.5 + 0.30 * Math.cos(now * 0.000085));
      const by = height * (0.5 + 0.18 * Math.sin(now * 0.000065));
      const radius = Math.max(width, height) * 0.55;
      const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
      bloom.addColorStop(0, palette.bloom);
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, width, height);

      // Cursor halo — works in both modes. A soft warm light follows the
      // pointer; the radius "breathes" gently so it feels alive. Drawn
      // before twinkles so the twinkles read on top of the glow.
      const cursorActive = mouse.active && now - mouse.lastMove < 1200;
      if (cursorActive) {
        const breath = 0.5 + 0.5 * Math.sin(now * 0.003);
        const radius = 110 + 18 * breath;
        const alpha = (rich ? 0.20 : 0.13) + 0.05 * breath;
        const halo = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          radius,
        );
        halo.addColorStop(0, withAlpha(palette.coreGlow, alpha));
        halo.addColorStop(0.55, withAlpha(palette.coreGlow, alpha * 0.32));
        halo.addColorStop(1, withAlpha(palette.coreGlow, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(
          mouse.x - radius,
          mouse.y - radius,
          radius * 2,
          radius * 2,
        );
      }

      // ---- Cursor pop-up cell field ------------------------------ //
      // A field of silicon cells in front of the cursor lifts toward
      // the viewer — closer to cursor = higher lift, like a wave of
      // tiny buildings popping up. As the cursor moves on, the lift
      // values fall back to zero (cells flush with substrate).
      //
      // The grid is fixed in screen space (4px stride matching the
      // SRAM cell pitch), iterated via grid-aligned anchors so the
      // cells never jitter as the cursor moves sub-pixel. Each "popped"
      // cell renders three layers: a substrate shadow at the original
      // position (the building's footprint), a 1px side-wall hint
      // (visible side face), and the warm copper roof at the lifted Y.
      //
      // Skipped on calm/long-form pages — this is an Atlas hero effect.
      if (cursorActive && rich) {
        const POP_RADIUS = 110;
        const STRIDE = 5;
        const CELL = 4;
        const MAX_LIFT = 9;
        const startX = Math.floor((mouse.x - POP_RADIUS) / STRIDE) * STRIDE;
        const startY = Math.floor((mouse.y - POP_RADIUS) / STRIDE) * STRIDE;
        const endX = mouse.x + POP_RADIUS;
        const endY = mouse.y + POP_RADIUS;
        for (let yy = startY; yy <= endY; yy += STRIDE) {
          for (let xx = startX; xx <= endX; xx += STRIDE) {
            const cxg = xx + CELL / 2;
            const cyg = yy + CELL / 2;
            const dx = cxg - mouse.x;
            const dy = cyg - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist > POP_RADIUS) continue;
            const t = 1 - dist / POP_RADIUS;
            const ease = t * t;          // ease-out: sharp peak, soft taper
            const lift = ease * MAX_LIFT;
            // Substrate shadow — the cell's "footprint" before it lifted.
            ctx.fillStyle = `rgba(0, 0, 0, ${0.32 * ease})`;
            ctx.fillRect(xx, yy, CELL, CELL);
            // Side-wall hint — 1px column on the right edge from
            // substrate up to the lifted top. Reads as a visible
            // building face catching the spotlight from above.
            if (lift > 1.5) {
              ctx.fillStyle = `rgba(0, 0, 0, ${0.42 * ease})`;
              ctx.fillRect(xx + CELL - 1, yy - lift, 1, lift);
            }
            // Top of the popped cell — warm copper at lifted Y, plus
            // a 1px brighter top edge (the "roof line") so the cell
            // reads as a cube, not a flat square.
            ctx.fillStyle = `rgba(245, 200, 130, ${0.72 * ease})`;
            ctx.fillRect(xx, yy - lift, CELL, CELL);
            if (ease > 0.5) {
              ctx.fillStyle = `rgba(255, 230, 180, ${0.55 * ease})`;
              ctx.fillRect(xx, yy - lift, CELL, 1);
            }
          }
        }
      }

      // Cell twinkles render in both modes so the cursor effect can produce
      // visible specks even on calm pages. Drawn here so they sit above the
      // cursor halo.
      for (const tw of twinkles) {
        const t = tw.t / tw.ttl;
        const env = Math.sin(t * Math.PI);
        const a = env * (rich ? 0.85 : 0.62);
        ctx.fillStyle = withAlpha(tw.color, a);
        ctx.fillRect(tw.x - tw.size / 2, tw.y - tw.size / 2, tw.size, tw.size);
        const halo2 = ctx.createRadialGradient(tw.x, tw.y, 0, tw.x, tw.y, 6);
        halo2.addColorStop(0, withAlpha(tw.color, 0.55 * env));
        halo2.addColorStop(1, withAlpha(tw.color, 0));
        ctx.fillStyle = halo2;
        ctx.beginPath();
        ctx.arc(tw.x, tw.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Every page renders the same architectural traffic — transactions,
      // electrons, lit wires, focal core glow, HBM bands, shafts. Long-form
      // pages drop the intensity sharply (~30%) so the chip stays present
      // without fighting prose; the Atlas runs at full brightness.
      const intensity = rich ? 1 : 0.32;

      // Central core glow — slow, gentle brightness pulse. Lower amplitude
      // so the BG never competes with foreground content; the halo bleeds
      // softly around the hero die's frosted glass.
      const coreBeat = 0.5 + 0.5 * Math.sin(now * 0.0006);
      const coreA = (0.16 + 0.08 * coreBeat) * intensity;
      const outer = ctx.createRadialGradient(
        coreCenter.x,
        coreCenter.y,
        0,
        coreCenter.x,
        coreCenter.y,
        coreCenter.r * 1.35,
      );
      outer.addColorStop(0, withAlpha(palette.coreGlow, coreA));
      outer.addColorStop(0.35, withAlpha(palette.coreGlow, coreA * 0.55));
      outer.addColorStop(1, withAlpha(palette.coreGlow, 0));
      ctx.fillStyle = outer;
      ctx.fillRect(
        coreCenter.x - coreCenter.r * 1.35,
        coreCenter.y - coreCenter.r * 1.35,
        coreCenter.r * 2.7,
        coreCenter.r * 2.7,
      );

      // Tighter inner core — softer than before, just a warm hint at the
      // very centre that bleeds around the hero die.
      const innerR = coreCenter.r * 0.18;
      const inner = ctx.createRadialGradient(
        coreCenter.x,
        coreCenter.y,
        0,
        coreCenter.x,
        coreCenter.y,
        innerR,
      );
      inner.addColorStop(0, withAlpha(palette.coreGlow, 0.40 * (0.7 + 0.3 * coreBeat) * intensity));
      inner.addColorStop(0.6, withAlpha(palette.coreGlow, 0.14 * intensity));
      inner.addColorStop(1, withAlpha(palette.coreGlow, 0));
      ctx.fillStyle = inner;
      ctx.fillRect(
        coreCenter.x - innerR,
        coreCenter.y - innerR,
        innerR * 2,
        innerR * 2,
      );

      // HBM band wave — slower, dimmer. A faint hint of activity, not a
      // bright sweep.
      for (let i = 0; i < bands.length; i++) {
        const band = bands[i];
        const period = 16000 + i * 1800;
        const phase = ((now % period) / period);
        const yWave = band.y + band.h * (1 - phase);
        const grad = ctx.createLinearGradient(0, yWave - 60, 0, yWave + 60);
        grad.addColorStop(0, withAlpha(palette.bandWave, 0));
        grad.addColorStop(0.5, withAlpha(palette.bandWave, 0.22 * intensity));
        grad.addColorStop(1, withAlpha(palette.bandWave, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(band.x - 2, yWave - 60, band.w + 4, 120);
      }

      // Light shaft shimmer — slower, dimmer.
      for (let i = 0; i < shafts.length; i++) {
        const s = shafts[i];
        const period = 13000 + i * 1400;
        const phase = ((now % period) / period);
        const yWave = s.y + s.h * (1 - phase);
        const grad = ctx.createLinearGradient(0, yWave - 80, 0, yWave + 80);
        grad.addColorStop(0, withAlpha(palette.shaftCore, 0));
        grad.addColorStop(0.5, withAlpha(palette.shaftCore, 0.32 * intensity));
        grad.addColorStop(1, withAlpha(palette.shaftCore, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(s.x - 1, yWave - 80, s.w + 2, 160);
      }

      // Lit wire segments — each bus lane glows under the electron that
      // rides it, then lingers as part of the path's "afterimage". The
      // envelope: quick rise (signal arrives), brief hold at full
      // brightness, slow fade. With long TTL the entire transaction path
      // is visible simultaneously while data is in flight.
      for (const ll of litLanes) {
        const t = ll.t;
        const ttl = ll.ttl;
        const rise = 0.30;
        const hold = 0.70;
        let env;
        if (t < rise) env = t / rise;
        else if (t < hold) env = 1;
        else env = Math.max(0, 1 - (t - hold) / (ttl - hold));
        const a = env * 0.62 * intensity;
        const lane = ll.lane;
        const grad = ctx.createLinearGradient(lane.x0, lane.y, lane.x1, lane.y);
        grad.addColorStop(0, withAlpha(ll.color, a * 0.45));
        grad.addColorStop(0.5, withAlpha(ll.color, a));
        grad.addColorStop(1, withAlpha(ll.color, a * 0.45));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(lane.x0, lane.y);
        ctx.lineTo(lane.x1, lane.y);
        ctx.stroke();
      }

      // Landing flashes — wide soft area blooms wherever an electron has
      // just arrived. Painted BEFORE cellGlows so the tighter cell glow
      // (and any moving electron heads) reads sharp on top of the bloom.
      // The envelope is sin(πt) so it fades up + back down smoothly,
      // never a hard pop. Color is the transaction's electron color so
      // each domain warms in its semantic hue (yellow load, blue write,
      // green coherence, red eviction).
      for (const lf of landingFlashes) {
        const t = lf.t / lf.ttl;
        if (t < 0 || t > 1) continue;
        const env = Math.sin(t * Math.PI);
        const radius = lf.radius;
        const halo = ctx.createRadialGradient(lf.x, lf.y, 0, lf.x, lf.y, radius);
        halo.addColorStop(0, withAlpha(lf.color, 0.32 * env * intensity));
        halo.addColorStop(0.45, withAlpha(lf.color, 0.14 * env * intensity));
        halo.addColorStop(1, withAlpha(lf.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(lf.x, lf.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cell glows — at memory cells and focal hierarchy rings. Negative
      // `t` values mean the glow is staged for a slightly later start
      // (used for the L3→L2→L1→TLB→reg arrival ripple).
      for (const cg of cellGlows) {
        if (cg.t < 0) continue;
        const t = cg.t / cg.ttl;
        const env = Math.sin(t * Math.PI);
        ctx.fillStyle = withAlpha(cg.color, 0.95 * env * intensity);
        ctx.fillRect(cg.x - cg.size / 2, cg.y - cg.size / 2, cg.size, cg.size);
        const halo = ctx.createRadialGradient(cg.x, cg.y, 0, cg.x, cg.y, 18);
        halo.addColorStop(0, withAlpha(cg.color, 0.7 * env * intensity));
        halo.addColorStop(1, withAlpha(cg.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cg.x, cg.y, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Active electrons — the moving heads of in-flight transactions.
      // Each draws a thin trail back along its current leg + a small halo.
      for (const tx of transactions) {
        if (tx.stage !== 'travel') continue;
        const a = tx.waypoints[tx.legIdx];
        const b = tx.waypoints[tx.legIdx + 1];
        if (!a || !b) continue;
        const ex = a.x + (b.x - a.x) * tx.legProgress;
        const ey = a.y + (b.y - a.y) * tx.legProgress;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        // Trail length scales with leg length so short legs don't get
        // an oversized streak.
        const tailLen = Math.min(28, len * tx.legProgress);
        const tailX = ex - (dx / len) * tailLen;
        const tailY = ey - (dy / len) * tailLen;
        const grad = ctx.createLinearGradient(tailX, tailY, ex, ey);
        grad.addColorStop(0, withAlpha(tx.color, 0));
        grad.addColorStop(1, withAlpha(tx.color, 0.85 * intensity));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        const halo = ctx.createRadialGradient(ex, ey, 0, ex, ey, 10);
        halo.addColorStop(0, withAlpha(tx.color, 0.55 * intensity));
        halo.addColorStop(1, withAlpha(tx.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(ex, ey, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = withAlpha(tx.color, 0.95 * intensity);
        ctx.beginPath();
        ctx.arc(ex, ey, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // (Cursor twinkles are drawn earlier, above the cursor halo, so they
      // appear in both rich and calm modes.)
    }

    resize();

    let raf = 0;
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(64, now - last);
      last = now;
      step(dt, now);
      draw(now);
      raf = requestAnimationFrame(frame);
    }
    if (reduceMotion) {
      step(16, performance.now());
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    // Track the pointer globally — the canvas covers the full viewport so
    // clientX/Y map directly to canvas-local coords.
    function onMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      mouse.lastMove = performance.now();
    }
    function onMouseLeaveDoc() {
      mouse.active = false;
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeaveDoc);

    const onResize = () => {
      cancelAnimationFrame(raf);
      resize();
      transactions = [];
      litLanes = [];
      cellGlows = [];
      landingFlashes = [];
      twinkles = [];
      if (reduceMotion) {
        step(16, performance.now());
        draw(performance.now());
      } else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener('resize', onResize);

    const themeWatcher = setInterval(() => {
      const cur = document.documentElement.dataset.theme;
      if (cur !== themeRef.current) {
        themeRef.current = cur;
        paintStatic();
      }
    }, 250);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeaveDoc);
      clearInterval(themeWatcher);
    };
  }, [rich, minimal, motion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100vw', height: '100dvh' }}
    />
  );
}

// ---- Helpers --------------------------------------------------------- //

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function withAlpha(color, a) {
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, a.toFixed(3) + ')');
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${a})`);
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return color;
}
