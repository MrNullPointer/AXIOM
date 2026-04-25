import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * CacheVisualizer — animated address packets traveling down the hierarchy.
 *
 * Each access spawns a packet at L1; on a miss it cascades down to L2 → L3 → DRAM.
 * The packet "lights up" the level that serves it, and its total latency is
 * recorded on a running tape on the right.
 */
const LEVELS = [
  { name: 'L1',  cap: '32 KB',  latency: 4,   hit: 0.85, color: 'var(--accent-1)' },
  { name: 'L2',  cap: '512 KB', latency: 14,  hit: 0.55, color: 'var(--accent-2)' },
  { name: 'L3',  cap: '32 MB',  latency: 40,  hit: 0.45, color: 'var(--accent-3)' },
  { name: 'DRAM',cap: '∞',      latency: 220, hit: 1.0,  color: 'var(--accent-warn)' },
];

let nextId = 1;

export default function CacheVisualizer() {
  const [packets, setPackets] = useState([]);
  const [tape, setTape] = useState([]);
  const [counts, setCounts] = useState({ L1: 0, L2: 0, L3: 0, DRAM: 0 });
  const tickRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => {
      // resolve which level serves this access
      let served = LEVELS.length - 1;
      for (let i = 0; i < LEVELS.length; i++) {
        if (Math.random() < LEVELS[i].hit) {
          served = i;
          break;
        }
      }
      const totalLatency = LEVELS.slice(0, served).reduce((n, l) => n + l.latency, 0) + LEVELS[served].latency;
      const id = nextId++;
      setPackets((p) => [...p, { id, served, born: tickRef.current }]);
      setTape((t) => [{ id, latency: totalLatency, level: LEVELS[served].name, color: LEVELS[served].color }, ...t].slice(0, 8));
      setCounts((c) => ({ ...c, [LEVELS[served].name]: c[LEVELS[served].name] + 1 }));
      // packet lifecycle ~ 1.6s
      setTimeout(() => {
        setPackets((p) => p.filter((x) => x.id !== id));
      }, 1700);
      tickRef.current += 1;
    }, 900);
    return () => clearInterval(id);
  }, []);

  const total = counts.L1 + counts.L2 + counts.L3 + counts.DRAM;

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">memory hierarchy · address packets in flight</div>
        <div className="marker" style={{ color: 'var(--ink-faint)' }}>
          {total} accesses observed
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] lg:divide-x"
        style={{ borderColor: 'var(--rule)' }}
      >
        {/* Pyramid */}
        <div className="relative px-5 py-6">
          <div className="relative mx-auto flex flex-col items-stretch gap-2">
            {LEVELS.map((lvl, i) => {
              // each level is wider than the one above (pyramid)
              const widthPct = 32 + i * 18;
              return (
                <Tier
                  key={lvl.name}
                  level={lvl}
                  index={i}
                  widthPct={widthPct}
                  packets={packets}
                  count={counts[lvl.name]}
                  total={total}
                />
              );
            })}
          </div>
        </div>

        {/* Latency tape */}
        <div className="relative min-w-[14rem] px-5 py-6">
          <div className="marker mb-3">latency tape · cyc</div>
          <ul className="flex flex-col gap-2">
            {tape.length === 0 ? (
              <li className="marker" style={{ color: 'var(--ink-faint)' }}>
                waiting…
              </li>
            ) : null}
            {tape.map((row) => (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center justify-between border-b pb-1"
                style={{ borderColor: 'var(--rule)' }}
              >
                <span
                  className="marker"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  served · {row.level}
                </span>
                <span
                  className="font-mono text-sm tabular-nums"
                  style={{ color: row.color }}
                >
                  {row.latency}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Tier({ level, index, widthPct, packets, count, total }) {
  const lit = packets.some((p) => p.served === index);
  const passing = packets.some((p) => p.served > index);
  const ratio = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="relative h-16 rounded-md border"
        style={{
          width: `${widthPct}%`,
          borderColor: lit ? level.color : 'var(--rule-strong)',
          background: 'var(--bg-soft)',
          boxShadow: lit ? `0 0 36px -6px ${level.color}` : 'none',
          transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out',
        }}
      >
        <div className="flex h-full items-center justify-between px-3">
          <div>
            <div className="font-mono text-xs" style={{ color: lit ? level.color : 'var(--ink)' }}>
              {level.name}
            </div>
            <div className="marker text-[10px]" style={{ color: 'var(--ink-faint)' }}>
              {level.cap}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm tabular-nums" style={{ color: 'var(--ink)' }}>
              {level.latency}
              <span className="ml-1 marker" style={{ color: 'var(--ink-faint)' }}>cyc</span>
            </div>
            <div className="marker text-[10px]" style={{ color: 'var(--ink-faint)' }}>
              served {ratio}%
            </div>
          </div>
        </div>

        {/* falling packets — appear as small dots traveling down through the level */}
        {packets.map((p) => {
          if (p.served < index) return null;
          const stops = p.served - index;
          const isHere = p.served === index;
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-0 -ml-1 block h-2 w-2 rounded-full"
              initial={{ y: -22, opacity: 0 }}
              animate={
                isHere
                  ? { y: 28, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.2, 1.4] }
                  : { y: 80, opacity: [0, 0.7, 0] }
              }
              transition={{
                duration: isHere ? 0.9 : 0.7,
                ease: 'easeIn',
              }}
              style={{ background: level.color, boxShadow: `0 0 12px ${level.color}` }}
            />
          );
        })}
      </div>
    </div>
  );
}
