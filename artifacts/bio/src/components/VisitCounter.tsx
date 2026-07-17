import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const COUNTER_BASE = 'https://api.counterapi.dev/v1/kirata-bio/visits/';
const VISITED_KEY = 'kirata_counted';

export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const alreadyCounted = localStorage.getItem(VISITED_KEY);
    // Only increment once per browser — repeat visits just read the count
    const url = alreadyCounted ? COUNTER_BASE : `${COUNTER_BASE}/up`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (typeof data?.count === 'number') {
          setCount(data.count);
          if (!alreadyCounted) localStorage.setItem(VISITED_KEY, '1');
        }
      })
      .catch(() => {
        // silently ignore — counter just won't show a number
      });
  }, []);

  return (
    <motion.div
      className="flex items-center gap-1.5 select-none" style={{ color: 'rgba(162,167,210,0.5)' }}
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
