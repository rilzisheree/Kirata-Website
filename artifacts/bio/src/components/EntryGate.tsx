import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntryGateProps {
  /** Called immediately on click — preserves browser autoplay gesture window. */
  onAudioReady: () => void;
  /** Called after the loading sequence + exit animation finishes. */
  onDone: () => void;
}

// ── Boot terminal lines (auto-plays before click prompt) ─────────────────────
const BOOT_LINES: { text: string; suffix?: string }[] = [
  { text: '> initializing...' },
  { text: '> loading assets...', suffix: ' ok' },
  { text: '> fetching presence data...', suffix: ' ok' },
  { text: '> establishing connection...', suffix: ' ok' },
  { text: '> all systems nominal.', suffix: ' ok' },
];

// ── Post-click loading lines ──────────────────────────────────────────────────
const LOADING_LINES = [
  '> booting up...',
  '> loading assets...',
  '> fetching presence data...',
  '> establishing connection...',
  '> ready.',
];

const CHAR_DELAY  = 18; // ms per character
const LINE_PAUSE  = 120; // ms between lines

// Typing hook — resolves a sequence of lines, calling onDone when finished
function useTypingSequence(
  lines: string[],
  active: boolean,
  onDone: () => void,
) {
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine]       = useState('');
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    cancelRef.current = false;

    let completedSoFar: string[] = [];
    let li = 0;

    function typeLine(lineText: string, onLineDone: () => void) {
      let charI = 0;
      setCurrentLine('');
      function nextChar() {
        if (cancelRef.current) return;
        charI++;
        setCurrentLine(lineText.slice(0, charI));
        if (charI < lineText.length) {
          setTimeout(nextChar, CHAR_DELAY);
        } else {
          onLineDone();
        }
      }
      setTimeout(nextChar, CHAR_DELAY);
    }

    function doLine() {
      if (cancelRef.current) return;
      if (li >= lines.length) {
        setTimeout(() => { if (!cancelRef.current) onDone(); }, 500);
        return;
      }
      const text = lines[li];
      typeLine(text, () => {
        if (cancelRef.current) return;
        completedSoFar = [...completedSoFar, text];
        setCompletedLines([...completedSoFar]);
        setCurrentLine('');
        li++;
        setTimeout(doLine, LINE_PAUSE);
      });
    }

    doLine();
    return () => { cancelRef.current = true; };
  }, [active]);

  return { completedLines, currentLine };
}

// ── Terminal card (boot phase) ────────────────────────────────────────────────
function TerminalCard({
  completedLines,
  currentLine,
}: {
  completedLines: string[];
  currentLine: string;
}) {
  const year = new Date().getFullYear();

  function renderLine(text: string, isCurrent?: boolean) {
    // Check if text matches a BOOT_LINE that has a suffix
    const match = BOOT_LINES.find(l => l.suffix && text.startsWith(l.text));
    const base   = match ? text.slice(0, match.text.length) : text;
    const suffix = match && text.length >= match.text.length ? match.suffix : '';

    return (
      <span>
        <span className="text-white/75">{base}</span>
        {suffix && <span className="text-cyan-400 font-semibold">{suffix}</span>}
        {isCurrent && (
          <span className="inline-block w-[7px] h-[13px] bg-cyan-400/80 ml-[2px] align-middle animate-pulse" />
        )}
      </span>
    );
  }

  return (
    <motion.div
      className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: 'hsl(192 30% 7%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 60px -10px rgba(6, 182, 212, 0.15)',
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="font-mono text-xs text-white/35 tracking-widest">// checkpoint</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
      </div>

      {/* Terminal body */}
      <div className="px-5 py-5 min-h-[140px] flex flex-col gap-1.5 font-mono text-sm">
        {completedLines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            {renderLine(line)}
          </motion.p>
        ))}
        {currentLine && (
          <p>{renderLine(currentLine, true)}</p>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2.5 flex items-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="font-mono text-[11px] text-white/20 tracking-wide">
          kirata's bio &nbsp;•&nbsp; {year}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type Phase = 'booting' | 'idle' | 'loading' | 'exiting';

export function EntryGate({ onAudioReady, onDone }: EntryGateProps) {
  const [phase, setPhase]   = useState<Phase>('booting');
  const [visible, setVisible] = useState(true);

  // Boot sequence — auto-plays on mount
  const bootLines = BOOT_LINES.map(l => l.text); // we render suffix separately
  const boot = useTypingSequence(
    bootLines,
    phase === 'booting',
    () => setPhase('idle'),
  );

  // Post-click loading sequence
  const load = useTypingSequence(
    LOADING_LINES,
    phase === 'loading',
    () => {
      setPhase('exiting');
      setVisible(false);
      onDone();
    },
  );

  const handleClick = () => {
    if (phase !== 'idle') return;
    onAudioReady();
    setPhase('loading');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gate"
          className="fixed inset-0 z-[100] flex items-center justify-center select-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onClick={phase === 'idle' ? handleClick : undefined}
          style={{
            background: 'hsl(192 40% 3%)',
            cursor: phase === 'idle' ? 'pointer' : 'default',
          }}
        >
          {/* Ambient glow */}
          <div className="absolute w-[350px] h-[350px] rounded-full bg-cyan-500/8 blur-[100px] pointer-events-none" />

          <div className="relative flex flex-col items-center gap-6 w-full max-w-sm px-6">
            <AnimatePresence mode="wait">

              {/* ── Phase 1: Boot terminal ── */}
              {(phase === 'booting') && (
                <motion.div
                  key="boot"
                  className="w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TerminalCard
                    completedLines={boot.completedLines}
                    currentLine={boot.currentLine}
                  />
                </motion.div>
              )}

              {/* ── Phase 2: Idle — click prompt ── */}
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  className="flex flex-col items-center gap-3 w-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Completed terminal stays visible, dimmed */}
                  <div className="w-full opacity-40 pointer-events-none mb-2">
                    <TerminalCard
                      completedLines={bootLines}
                      currentLine=""
                    />
                  </div>

                  <motion.p
                    className="text-white/25 text-xs font-mono uppercase tracking-[0.3em]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    kirata
                  </motion.p>

                  <motion.h1
                    className="text-white/80 text-xl sm:text-2xl font-mono tracking-wide whitespace-nowrap"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                  >
                    click to enter<span className="text-white/30">.. or don't</span>
                  </motion.h1>

                  <motion.div
                    className="w-6 h-[2px] bg-cyan-400/60 rounded-full mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ delay: 0.5, repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}

              {/* ── Phase 3: Loading (post-click) ── */}
              {phase === 'loading' && (
                <motion.div
                  key="loading"
                  className="w-full font-mono text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {load.completedLines.map((line, i) => (
                    <motion.p
                      key={i}
                      className="text-cyan-400/70 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1 }}
                    >
                      {line}
                    </motion.p>
                  ))}
                  {load.currentLine && (
                    <p className="text-cyan-300 leading-relaxed">
                      {load.currentLine}
                      <span className="inline-block w-[7px] h-[13px] bg-cyan-400 ml-[2px] align-middle animate-pulse" />
                    </p>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
