import React, { useEffect, useRef, useState } from 'react';
import { Music2, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

const VIDEO_ID = 'KvMY1uzSC1E'; // "I Really Want to Stay at Your House" — Rosa Walton & Hallie Kazmer

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface BackgroundMusicProps {
  canAutoplay?: boolean;
}

export function BackgroundMusic({ canAutoplay = false }: BackgroundMusicProps) {
  const playerRef = useRef<any>(null);
  const mountNodeRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(25);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!canAutoplay) return;

    const initPlayer = () => {
      if (!mountNodeRef.current) return;
      playerRef.current = new window.YT.Player(mountNodeRef.current, {
        height: '1',
        width: '1',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: VIDEO_ID,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(25);
            readyRef.current = true;
            setReady(true);
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'yt-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }

    return () => {
      try { playerRef.current?.destroy(); } catch {}
    };
  }, [canAutoplay]);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (readyRef.current && playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
    }
  };

  if (!canAutoplay) return null;

  return (
    <motion.div
      className="glass-card px-5 py-4 flex items-center gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      {/* invisible YouTube mount point */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
        <div ref={mountNodeRef} />
      </div>

      {/* waveform / icon */}
      <div className="flex items-end gap-[3px] h-4 shrink-0">
        {[0.4, 0.7, 1, 0.6, 0.8].map((d, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-cyan-500/70"
            style={{
              height: '100%',
              animation: ready ? `waveBar 1s ease-in-out ${d * 0.3}s infinite alternate` : 'none',
              transform: ready ? undefined : 'scaleY(0.3)',
            }}
          />
        ))}
      </div>

      {/* label */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-none mb-0.5">
          {ready ? 'now playing' : 'loading…'}
        </div>
        <div className="text-xs font-medium text-white/80 truncate">
          i really want to stay at your house
        </div>
      </div>

      {/* volume */}
      <div className="flex items-center gap-2 shrink-0">
        {volume === 0
          ? <VolumeX size={13} className="text-white/40" />
          : <Volume2 size={13} className="text-cyan-400" />
        }
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolume}
          className="w-20 cursor-pointer accent-cyan-400"
          title="Volume"
        />
      </div>
    </motion.div>
  );
}
