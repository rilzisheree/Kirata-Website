import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntryGateProps {
  onEnter: () => void;
}

export function EntryGate({ onEnter }: EntryGateProps) {
  const [exiting, setExiting] = useState(false);

  const handleClick = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onEnter, 700);
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="gate"
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer select-none"
          style={{ background: 'hsl(192 40% 3%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          onClick={handleClick}
        >
          {/* Subtle cyan glow behind text */}
          <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

          <div className="relative flex flex-col items-center gap-3">
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

            {/* Blinking cursor line */}
            <motion.div
              className="w-6 h-[2px] bg-cyan-400/60 rounded-full mt-2"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          className="fixed inset-0 z-[100]"
          style={{ background: 'hsl(192 40% 3%)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
}
