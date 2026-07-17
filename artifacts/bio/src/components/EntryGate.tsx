import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntryGateProps {
  /** Called immediately on click — preserves browser autoplay gesture window. */
  onAudioReady: () => void;
  /** Called after the loading sequence + exit animation finishes. */
  onDone: () => void;
}

const LOADING_LINES = [
  '> booting up...',
  '> loading assets...',
  '> fetching presence data...',
  '> compiling the vibes...',
  '> all good. welcome :)',
];

const CHAR_DELAY = 28;  // ms per character
const LINE_PAUSE  = 180; // ms between lines

export function EntryGate({ onAudioReady, onDone }: EntryGateProps) {
  const [phase, setPhase]               = useState<'idle' | 'loading' | 'exiting'>('idle');
  const [visible, setVisible]           = useState(true);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine]   = useState('');
  const cancelRef = useRef(false);

  // Typing sequence runs while phase === 'loading'
  useEffect(() => {
    if (phase !== 'loading') return;
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
      if (li >= LOADING_LINES.length) {
        // All lines done — brief pause then begin exit
        setTimeout(() => {
          if (cancelRef.current) return;
          setPhase('exiting');
          setVisible(false);   // triggers AnimatePresence exit animation
          onDone();            // notify parent — content can now stagger in
        }, 600);
        return;
      }

      const text = LOADING_LINES[li];
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
  }, [phase]);

  const handleClick = () => {
    if (phase !== 'idle') return;
    onAudioReady(); // immediate — preserves gesture window for media autoplay
    setPhase('loading');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gate"
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer select-none"
          style={{ background: 'hsl(192 40% 3%)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onClick={handleClick}
        >
          {/* Cyan glow */}
          <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

          <div className="relative flex flex-col items-center gap-3 w-full max-w-xs px-6">
            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.p
                    className="text-white/25 text-xs font-mono uppercase tracking-[0.3em]"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    kirata
                  </motion.p>

                  <motion.h1
                    className="text-white/80 text-xl sm:text-2xl font-mono tracking-wide"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  >
                    click to enter
                    <span className="text-white/30">.. or don't</span>
                  </motion.h1>

                  <motion.div
                    className="w-6 h-[2px] bg-cyan-400/60 rounded-full mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ delay: 1.1, repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}

              {phase === 'loading' && (
                <motion.div
                  key="terminal"
                  className="w-full font-mono text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {completedLines.map((line, i) => (
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

                  {currentLine && (
                    <p className="text-cyan-300 leading-relaxed">
                      {currentLine}
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
