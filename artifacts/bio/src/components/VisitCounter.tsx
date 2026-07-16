import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

// counterapi.dev — free, no auth, persists across sessions
const COUNTER_URL = 'https://api.counterapi.dev/v1/kirata-bio/visits/up';

export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(COUNTER_URL)
      .then(r => r.json())
      .then(data => {
        if (typeof data?.count === 'number') setCount(data.count);
      })
      .catch(() => {
        // silently ignore — counter just won't show a number
      });
  }, []);

  return (
    <motion.div
      className="flex items-center gap-1.5 text-white/35 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.6 }}
      title="Total visits"
    >
      <Eye size={13} />
      <span className="text-[11px] font-mono tracking-wide">
        {count === null ? '—' : count.toLocaleString()}
      </span>
    </motion.div>
  );
}
