import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../../app/audio.jsx';

/**
 * AudioControl — single icon button in the navbar. Click behaviour:
 *   • Music off            → start music + drop the volume bar down
 *   • Music on, bar hidden → re-open the volume bar (music continues)
 *   • Music on, bar shown  → stop music + retract the volume bar
 *
 * Clicking anywhere outside the control (or pressing Escape) hides
 * the volume bar but keeps the music playing — the bar is a transient
 * affordance, not a persistent panel.
 *
 * Performance: this component owns no audio state or element. The
 * provider lazily creates the <audio> element only after the first
 * enable, so the 3.5 MB MP3 is not fetched until the user opts in.
 * `loop = true` is set on the element so music runs continuously
 * until the user toggles off.
 */
export default function AudioControl() {
  const { enabled, volume, setEnabled, setVolume } = useAudio();
  const Icon = enabled ? Volume2 : VolumeX;
  const sliderPct = Math.round(volume * 100);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);

  // Outside-click + Escape dismiss the bar (but keep music playing).
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      const wrap = wrapperRef.current;
      if (wrap && !wrap.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // If music gets turned off elsewhere (or starts disabled), make sure
  // the bar isn't lingering open with no audio behind it.
  useEffect(() => {
    if (!enabled && open) setOpen(false);
  }, [enabled, open]);

  const onIconClick = () => {
    if (!enabled) {
      setEnabled(true);
      setOpen(true);
    } else if (!open) {
      setOpen(true);
    } else {
      setEnabled(false);
      setOpen(false);
    }
  };

  const setFromClientY = (clientY) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top;
    const pct = 1 - Math.max(0, Math.min(1, y / rect.height));
    setVolume(pct);
  };

  const onTrackPointerDown = (e) => {
    if (!enabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromClientY(e.clientY);
  };
  const onTrackPointerMove = (e) => {
    if (!enabled) return;
    if (e.buttons === 0) return;
    setFromClientY(e.clientY);
  };

  const onTrackKey = (e) => {
    if (!enabled) return;
    let next = volume;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = volume + 0.1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = volume - 0.1;
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = 0;
    else if (e.key === 'PageUp') next = volume + 0.25;
    else if (e.key === 'PageDown') next = volume - 0.25;
    else return;
    e.preventDefault();
    setVolume(Math.max(0, Math.min(1, next)));
  };

  const iconLabel = !enabled
    ? 'Play background music'
    : open
      ? 'Stop background music'
      : 'Show volume';

  return (
    <div
      ref={wrapperRef}
      className="audio-control relative inline-flex h-9 items-center"
      style={{ pointerEvents: 'auto' }}
    >
      <button
        type="button"
        onClick={onIconClick}
        aria-label={iconLabel}
        title={iconLabel}
        aria-pressed={enabled}
        aria-expanded={open}
        aria-controls="audio-volume-popover"
        className="pad inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
        style={{
          borderColor: 'var(--rule-strong)',
          color: enabled ? 'var(--ink)' : 'var(--ink-faint)',
          background: 'var(--glass-bg)',
        }}
      >
        <Icon size={15} aria-hidden="true" />
      </button>
      <div
        id="audio-volume-popover"
        className="audio-popover"
        data-open={open || undefined}
        aria-hidden={!open}
      >
        <div
          ref={trackRef}
          role="slider"
          aria-orientation="vertical"
          aria-label="Background music volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sliderPct}
          aria-valuetext={`${sliderPct}%`}
          tabIndex={open && enabled ? 0 : -1}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onKeyDown={onTrackKey}
          className="audio-vtrack"
          title={`Volume ${sliderPct}%`}
        >
          <div className="audio-vtrack-rail" aria-hidden="true" />
          <div
            className="audio-vtrack-fill"
            aria-hidden="true"
            style={{ height: `${sliderPct}%` }}
          />
          <div
            className="audio-vtrack-thumb"
            aria-hidden="true"
            style={{ bottom: `calc(${sliderPct}% - 6px)` }}
          />
        </div>
        <div className="audio-popover-pct" aria-hidden="true">
          {sliderPct}
        </div>
      </div>
    </div>
  );
}
