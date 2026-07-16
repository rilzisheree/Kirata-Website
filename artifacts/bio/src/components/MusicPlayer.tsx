import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PLAYLIST_ID = '0hFVWQVs7uo6SYx82xT5OV';
// autoplay=1, shuffle disabled so it plays track 1 → last in order
const EMBED_URL = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0&autoplay=1&shuffle=false`;

interface MusicPlayerProps {
  canAutoplay?: boolean;
}

export function MusicPlayer({ canAutoplay = false }: MusicPlayerProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Label */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">now playing</span>
        {/* Waveform dots — animate while iframe loads */}
        <div className="flex items-end gap-[3px] h-3">
          {[0.4, 0.7, 1, 0.6, 0.8].map((delay, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-cyan-500/60"
              style={{
                height: '100%',
                animation: `waveBar 1s ease-in-out ${delay * 0.3}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Spotify embed — only mounted after user gesture so autoplay is permitted */}
      <div className="relative" style={{ height: 232 }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
            <span className="text-xs font-mono text-white/25 animate-pulse">loading playlist...</span>
          </div>
        )}
        {canAutoplay && (
          <iframe
            src={EMBED_URL}
            width="100%"
            height="232"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="eager"
            onLoad={() => setLoaded(true)}
            style={{
              border: 'none',
              display: 'block',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </motion.div>
  );
}
