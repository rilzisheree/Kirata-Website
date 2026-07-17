import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.getElementById('yt-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'yt-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!canAutoplay) return;

    const initPlayer = () => {
      if (!mountNodeRef.current || playerRef.current) return;
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
            // Fade in from 0 → 25 over ~3 seconds
            e.target.setVolume(0);
            readyRef.current = true;
            setReady(true);
            let current = 0;
            const target = 25;
            const steps = 40;
            const stepSize = target / steps;
            const interval = setInterval(() => {
              current = Math.min(current + stepSize, target);
              try { e.target.setVolume(Math.round(current)); } catch {}
              if (current >= target) clearInterval(interval);
            }, 75); // 40 steps × 75ms ≈ 3 s
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
    }

    return () => {
      try { playerRef.current?.destroy(); playerRef.current = null; } catch {}
    };
  }, [canAutoplay]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (readyRef.current && playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
    }
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="fixed top-4 right-4 z-[110]" ref={popupRef}>
      <div style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
        <div ref={mountNodeRef} />
      </div>

      <button
        onClick={() => setOpen(v => !v)}
        className="glass-pill w-14 h-14 flex items-center justify-center"
        aria-label="Music volume"
      >
        <VolumeIcon
          size={20}
          className={ready ? 'text-cyan-400' : 'text-white/40'}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-0 glass-card px-4 py-3 min-w-[210px] border border-white/10"
          >
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3 truncate">
              i really want to stay at your house
            </div>
            <div className="flex items-center gap-3">
              <VolumeIcon size={13} className="text-cyan-400 shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolume}
                className="w-full cursor-pointer accent-cyan-400"
                title="Volume"
              />
              <span className="text-[10px] font-mono text-white/40 w-6 text-right shrink-0">
                {volume}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
