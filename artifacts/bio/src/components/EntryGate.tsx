import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntryGateProps {
  onAudioReady: () => void;
  onDone: () => void;
}

// ── Boot terminal lines ───────────────────────────────────────────────────────
const BOOT_LINES: { text: string; suffix?: string }[] = [
  { text: '> initializing...' },
  { text: '> loading assets...', suffix: ' done' },
  { text: '> fetching presence data...', suffix: ' done' },
  { text: '> establishing connection...', suffix: ' done' },
  { text: '> all systems nominal.', suffix: ' done' },
];


const CHAR_DELAY = 18;
const LINE_PAUSE = 120;

function useTypingSequence(lines: string[], active: boolean, onDone: () => void) {
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
        if (charI < lineText.length) setTimeout(nextChar, CHAR_DELAY);
        else onLineDone();
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

// ── Terminal card (boot phase only) ──────────────────────────────────────────
function TerminalCard({ completedLines, currentLine }: { completedLines: string[]; currentLine: string }) {
  const year = new Date().getFullYear();

  function renderLine(text: string, isCurrent?: boolean) {
    const match  = BOOT_LINES.find(l => l.suffix && text.startsWith(l.text));
    const base   = match ? text.slice(0, match.text.length) : text;
    const suffix = match && text.length >= match.text.length ? match.suffix : '';
    return (
      <span>
        <span className="text-white/75">{base}</span>
        {suffix && <span style={{ color: 'rgb(162, 167, 210)' }} className="font-semibold">{suffix}</span>}
        {isCurrent && (
          <span
            className="inline-block w-[7px] h-[13px] ml-[2px] align-middle animate-pulse"
            style={{ background: 'rgb(162, 167, 210)' }}
          />
        )}
      </span>
    );
  }

  return (
    <motion.div
      className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: 'hsl(234 15% 7%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 60px -10px rgba(162,167,210,0.12)',
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="font-mono text-xs text-white/30 tracking-widest">// checkpoint</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 min-h-[140px] flex flex-col gap-1.5 font-mono text-sm">
        {completedLines.map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>
            {renderLine(line)}
          </motion.p>
        ))}
        {currentLine && <p>{renderLine(currentLine, true)}</p>}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-mono text-[11px] text-white/18 tracking-wide">
          kirata's bio &nbsp;•&nbsp; {year}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type Phase = 'booting' | 'idle' | 'loading' | 'exiting';

export function EntryGate({ onAudioReady, onDone }: EntryGateProps) {
  const [phase, setPhase]     = useState<Phase>('booting');
  const [visible, setVisible] = useState(true);

  const boot = useTypingSequence(
    BOOT_LINES.map(l => l.text),
    phase === 'booting',
    () => setPhase('idle'),
  );

  const handleClick = () => {
    if (phase !== 'idle') return;
    onAudioReady();
    setPhase('exiting');
    setVisible(false);
    onDone();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gate"
          className="fixed inset-0 z-[100] flex items-center justify-center select-none"
          style={{
            background: '#000',
            cursor: phase === 'idle' ? 'pointer' : 'default',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onClick={phase === 'idle' ? handleClick : undefined}
        >
          <div className="relative flex flex-col items-center gap-6 w-full max-w-sm px-6">
            <AnimatePresence mode="wait">

              {/* Phase 1 — boot terminal */}
              {phase === 'booting' && (
                <motion.div
                  key="boot"
                  className="w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.5 } }}
                  transition={{ duration: 0.3 }}
                >
                  <TerminalCard completedLines={boot.completedLines} currentLine={boot.currentLine} />
                </motion.div>
              )}

              {/* Phase 2 — minimal click prompt (no terminal card) */}
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  className="flex flex-col items-center text-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.p
                    className="font-mono text-xs tracking-widest"
                    style={{ color: 'rgba(162,167,210,0.50)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                  >
                    kirataslife.space
                  </motion.p>

                  <motion.p
                    className="font-mono text-sm tracking-widest"
                    style={{ color: '#a2a7d2' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.6 }}
                  >
                    click anywhere to enter<span
                      className="inline-block w-[2px] h-[0.9em] ml-[6px] align-middle"
                      style={{
                        background: '#a2a7d2',
                        animation: 'barBlink 1.1s step-start infinite',
                      }}
                    />
                  </motion.p>
                </motion.div>
              )}


            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
