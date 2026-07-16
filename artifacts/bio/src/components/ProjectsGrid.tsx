import React from 'react';
import { motion } from 'framer-motion';

export function ProjectsGrid() {
  return (
    <div className="mt-8">
      <motion.h3
        className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-cyan-400 text-xl">{'//'}</span> Featured Work
      </motion.h3>

      <motion.div
        className="glass-card p-6 text-white/40 text-sm font-mono"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        maybe soon idk
      </motion.div>
    </div>
  );
}
