import { useMotion } from '../../app/motion.jsx';

/**
 * EtchedHeadline — the homepage display headline, animated.
 *
 * Three stacked layers, composed in z-order:
 *
 *   1. .etch-base (bottom)  — dim "unetched" outline of the type.
 *      Always visible. Acts as a silhouette so the title feels
 *      lithographed-in rather than fading from nothing.
 *
 *   2. .etch-wipe (middle)  — the real type, full ink. Revealed via
 *      clip-path animation tracked by a copper "beam" sibling. After
 *      the one-shot reveal, this is the readable headline.
 *
 *   3. .etch-glow (top)     — italic pulse layer. Renders the same
 *      content but only the italic ems are visible (non-italic spans
 *      are visibility:hidden spacers, kept for layout alignment).
 *      Italic ems paint in solid copper and a moving CSS mask
 *      reveals only a thin band — the band sweeps along the letter
 *      strokes like a signal. A separate layer (rather than
 *      background-clip:text on .etch-wipe italics) keeps Fraunces'
 *      italic overhang on trailing letters fully painted; clipping
 *      the background to text was cropping the overhang and showing
 *      the dim base through it on the final glyph of each italic.
 *
 * When motion is 'off', renders the static headline only — no wipe,
 * no beam, no pulse. Reduced-motion users see the same.
 */
export default function EtchedHeadline() {
  const { level } = useMotion();
  const animate = level !== 'off';

  // Static fallback: just the headline, no layered effect.
  if (!animate) {
    return (
      <h1 className="display text-[clamp(48px,7vw,120px)]">
        From <em className="serif-italic">electrons</em>
        <br /> to <em className="serif-italic">execution</em>.
      </h1>
    );
  }

  return (
    <h1 className="display etch-headline text-[clamp(48px,7vw,120px)]">
      {/* Dim "unetched" base. Always visible behind the wipe layer so
          the silhouette of the type is suggested before the beam
          arrives. aria-hidden — the wipe layer carries the real text. */}
      <span className="etch-base" aria-hidden="true">
        From <em className="serif-italic">electrons</em>
        <br /> to <em className="serif-italic">execution</em>.
      </span>
      {/* Foreground — wipes in. Italics here are plain ink; the
          copper pulse lives on the .etch-glow layer below. The
          caret pulses at a steady chip-clock cadence after the
          period, signalling that the headline is "live". */}
      <span className="etch-wipe">
        From <em className="serif-italic">electrons</em>
        <br /> to <em className="serif-italic">execution</em>.
        <span className="etch-caret" aria-hidden="true" />
      </span>
      {/* The lithography beam: a thin copper bar that tracks the wipe
          edge from left to right, then fades. */}
      <span className="etch-beam" aria-hidden="true" />
      {/* Italic pulse layer. Non-italic spans inherit visibility:hidden
          from .etch-glow; italic ems override and paint in copper,
          then a moving mask reveals a thin band that sweeps along the
          glyphs. The two italics fire on different phases. */}
      <span className="etch-glow" aria-hidden="true">
        From <em className="serif-italic etch-glow-pulse-1">electrons</em>
        <br /> to <em className="serif-italic etch-glow-pulse-2">execution</em>.
      </span>
    </h1>
  );
}
