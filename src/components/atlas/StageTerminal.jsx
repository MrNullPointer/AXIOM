import { useReducedMotion } from 'framer-motion';

/**
 * StageTerminal — narrator panel inside the plucked card.
 *
 * Types out a per-substage `script` (array of lines) character-by-
 * character in proportion to `t` (within-substage scroll progress,
 * 0..1). Lines render with light syntactic styling so the user reads
 * the script as instrument output rather than prose:
 *
 *   $ ...   command prompt    — bright accent, lit prompt glyph
 *   → ...   result            — accent, bold
 *   ▾ ...   go deeper         — accent
 *   ▴ ...   come back up      — accent
 *   …       body              — ink-soft
 *
 * A blinking cursor sits at the type-cut so the user can see exactly
 * where the script is about to advance. Scrolling backwards un-types
 * — t decreases, characters disappear, the cursor jumps back. That's
 * the scrub feel applied to the narration.
 */
export default function StageTerminal({ script, t, accent }) {
  const reduce = useReducedMotion();
  if (!script || script.length === 0) return null;

  // Total character count across all lines (including a synthetic '\n'
  // between lines so the typing pace feels natural across line breaks
  // — pausing briefly at each newline). Newline weights as 1 char.
  const lineLengths = script.map((line) => line.length);
  const total = lineLengths.reduce((a, b) => a + b, 0) + Math.max(0, script.length - 1);

  // Word-boundary snap: typing must never freeze mid-word. We pre-walk
  // the script once to find every position right AFTER a word ends —
  // that's the set of "valid resting positions" for the cursor. The
  // raw cut (proportional to t) then snaps DOWN to the nearest such
  // position. Effect: as the user scrolls, words appear one at a time
  // and the cursor always sits at the end of a complete word, never
  // halfway through one. Symbols like →, ▾, $ count as single-glyph
  // words, so the prompt and result markers also pop in cleanly.
  const stops = [0];
  let walked = 0;
  script.forEach((line, lineIdx) => {
    let inWord = false;
    for (let i = 0; i < line.length; i++) {
      const isSpace = /\s/.test(line[i]);
      if (inWord && isSpace) stops.push(walked + i);
      inWord = !isSpace;
    }
    if (inWord) stops.push(walked + line.length);
    walked += line.length;
    if (lineIdx < script.length - 1) {
      walked += 1; // synthetic newline
      stops.push(walked);
    }
  });
  const idealCut = Math.max(0, Math.min(total, Math.floor(t * total)));
  let cut = 0;
  for (let i = stops.length - 1; i >= 0; i--) {
    if (stops[i] <= idealCut) {
      cut = stops[i];
      break;
    }
  }

  // Compute how many characters of each line are visible, and which
  // line the cursor sits on. Walking the array once keeps this O(n)
  // even on long scripts.
  let consumed = 0;
  const lines = script.map((line, i) => {
    const lineStart = consumed;
    const lineEnd = consumed + line.length;
    consumed = lineEnd + 1; // +1 for the synthetic newline
    const visibleChars = Math.max(0, Math.min(line.length, cut - lineStart));
    const isCursor = cut >= lineStart && cut <= lineEnd && cut < total;
    const fullyTyped = cut >= lineEnd;
    return { line, visibleChars, isCursor, fullyTyped };
  });

  return (
    <div className="atlas-terminal" style={{ '--term-accent': accent }} aria-hidden="true">
      <div className="atlas-terminal-frame">
        <div className="atlas-terminal-bar">
          <span className="atlas-terminal-dot" />
          <span className="atlas-terminal-dot" />
          <span className="atlas-terminal-dot" />
          <span className="atlas-terminal-title">narration</span>
        </div>
        <div className="atlas-terminal-body">
          {lines.map((entry, i) => {
            const tone = lineTone(entry.line);
            return (
              <div
                key={i}
                className={`atlas-terminal-line atlas-terminal-line-${tone}${entry.fullyTyped ? ' atlas-terminal-line-done' : ''}`}
              >
                <span className="atlas-terminal-line-text">
                  {entry.line.slice(0, entry.visibleChars)}
                </span>
                {entry.isCursor && (
                  <span
                    className={`atlas-terminal-cursor${reduce ? ' atlas-terminal-cursor-static' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Classify a line by its leading non-whitespace character so the CSS
// can colour-code it. Keeping this as a pure helper means a future
// scripted stage can opt into the same vocabulary without coordinating
// classes with the terminal component.
function lineTone(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('$')) return 'prompt';
  if (trimmed.startsWith('→')) return 'result';
  if (trimmed.startsWith('▾')) return 'down';
  if (trimmed.startsWith('▴')) return 'up';
  if (trimmed.startsWith('·') || trimmed.startsWith('—')) return 'bullet';
  return 'body';
}
