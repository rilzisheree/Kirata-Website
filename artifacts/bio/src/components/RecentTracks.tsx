import React from 'react';
import { motion } from 'framer-motion';

interface Track {
  name: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string | null;
  playedAt: string;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function RecentTracks() {
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/spotify/recent');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (!cancelled) { setTracks(data.tracks ?? []); setError(false); }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading) {
    return (
      <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgb(162,167,210)' }}>recently played</span>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded bg-white/10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-2.5 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error || tracks.length === 0) {
    return (
      <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgb(162,167,210)' }}>recently played</span>
        </div>
        <span className="text-xs text-white/30 font-mono">no tracks yet</span>
      </motion.div>
    );
  }

  return (
    <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className="shrink-0" style={{ color: 'rgb(162,167,210)' }}>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zM20.04 9.72C16.2 7.44 9.36 7.2 5.52 8.4c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.32-1.32 11.88-1.08 16.2 1.44.54.3.72 1.02.42 1.56-.24.6-.96.72-1.44.42z"/>
        </svg>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgb(162,167,210)' }}>recently played</span>
      </div>

      {/* Track list */}
      <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {tracks.map((track, i) => (
          <motion.div
            key={`${track.name}-${track.playedAt}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            {track.spotifyUrl ? (
              <a href={track.spotifyUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 group">
                <TrackRow track={track} index={i} />
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <TrackRow track={track} index={i} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function TrackRow({ track, index }: { track: Track; index: number }) {
  return (
    <>
      {/* Index */}
      <span className="text-[10px] font-mono text-white/20 w-4 text-right shrink-0">{index + 1}</span>

      {/* Album art */}
      <div className="w-9 h-9 rounded bg-white/5 shrink-0 overflow-hidden">
        {track.albumArt ? (
          <img src={track.albumArt} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}
      </div>

      {/* Name + artist */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate transition-colors group-hover:text-[#a2a7d2]">{track.name}</p>
        <p className="text-[10px] text-white/40 font-mono truncate">{track.artist}</p>
      </div>

      {/* Time ago */}
      <span className="text-[10px] text-white/25 font-mono shrink-0">{timeAgo(track.playedAt)}</span>
    </>
  );
}
