import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DISCORD_ID = import.meta.env.VITE_DISCORD_ID as string | undefined;

// ── Discord-accurate status indicator ────────────────────────────────────────
function StatusIcon({ status }: { status: string }) {
  if (status === 'online') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#23a55a" />
      </svg>
    );
  }
  if (status === 'idle') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#f0b232" />
        <circle cx="10" cy="5" r="4.5" fill="#0a0a16" />
      </svg>
    );
  }
  if (status === 'dnd') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#f23f43" />
        <rect x="3.5" y="6.5" width="9" height="3" rx="1.5" fill="white" />
      </svg>
    );
  }
  // offline
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="8" fill="#80848e" />
      <circle cx="8" cy="8" r="4" fill="#0a0a16" />
    </svg>
  );
}

// ── Discord Nitro badge (teal winged circle) ──────────────────────────────────
function NitroBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" title="Discord Nitro">
      <defs>
        <linearGradient id="nitro-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4dc9e6" />
          <stop offset="100%" stopColor="#2b8fcc" />
        </linearGradient>
      </defs>
      <circle cx="10" cy="10" r="10" fill="url(#nitro-bg)" />
      {/* Outer ring */}
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="white" strokeWidth="1.5" />
      {/* Inner dot */}
      <circle cx="10" cy="10" r="2.5" fill="white" />
      {/* Wing swoosh left */}
      <path d="M3.5 10 C5 6.5 7.5 5 10 5" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Discord Server Booster badge (pink upward triangle) ───────────────────────
function BoosterBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" title="Server Booster">
      <defs>
        <linearGradient id="boost-bg" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f47fff" />
          <stop offset="100%" stopColor="#c84ecb" />
        </linearGradient>
      </defs>
      {/* Solid upward-pointing triangle, same shape as the real badge */}
      <polygon points="10,2 19,18 1,18" fill="url(#boost-bg)" />
    </svg>
  );
}

export function LanyardPresence() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!DISCORD_ID) { setLoading(false); setError(true); return; }

    let cancelled = false;
    const fetchPresence = async () => {
      try {
        const res  = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const json = await res.json();
        if (!cancelled && json.success) { setData(json.data); setError(false); }
      } catch { if (!cancelled) setError(true); }
      finally  { if (!cancelled) setLoading(false); }
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-5 h-full">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-white/10 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card p-5 h-full flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-xs text-white/30 font-mono">discord not connected</span>
        </div>
      </div>
    );
  }

  const activities: any[] = (data.activities ?? []).filter((a: any) => a.type !== 4);
  const bannerUrl = "/banner.jpg";

  return (
    <motion.div
      className="glass-card relative overflow-hidden h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Banner */}
      <div className="relative w-full h-24 shrink-0 bg-black/40">
        {bannerUrl ? (
          <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#5865F2]/30 to-[#0a0a16]" />
        )}
        {/* Discord watermark */}
        <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
          </svg>
        </div>

        {/* Avatar with status ring */}
        <div className="absolute -bottom-7 left-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-black/40 border-2 border-[#0a0a16] overflow-hidden">
              {data.discord_user.avatar ? (
                <img src={`https://cdn.discordapp.com/avatars/${DISCORD_ID}/${data.discord_user.avatar}.png?size=128`} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white/60 flex items-center justify-center w-full h-full">
                  {data.discord_user.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            {/* Status icon — accurate Discord shapes */}
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusIcon status={data.discord_status} />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-9 px-5 pb-5 flex flex-col flex-1">
        {/* Username + badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white tracking-wide">{data.discord_user.username}</h3>
          <NitroBadge />
          <BoosterBadge />
        </div>

        {activities.length === 0 && !data.spotify && (
          <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
            <span className="text-xs text-white/35 font-mono">doing nothing prob asleep</span>
          </div>
        )}

        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 relative z-10 space-y-3">
            {activities.map((activity, i) => {
              const typeLabel: Record<number, string> = {
                0: 'playing', 1: 'streaming', 2: 'listening', 3: 'watching', 5: 'competing in',
              };
              const label = typeLabel[activity.type] ?? 'doing';
              return (
                <div key={i} className={i > 0 ? "pt-3 border-t border-white/5 space-y-1.5" : "space-y-1.5"}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest w-20 shrink-0" style={{ color: 'rgba(162,167,210,0.55)' }}>{label}</span>
                    <span className="text-sm font-medium text-white truncate">{activity.name}</span>
                  </div>
                  {activity.details && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest w-20 shrink-0" style={{ color: 'rgba(162,167,210,0.55)' }}>details</span>
                      <span className="text-xs text-white/60 truncate">{activity.details}</span>
                    </div>
                  )}
                  {activity.state && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest w-20 shrink-0" style={{ color: 'rgba(162,167,210,0.55)' }}>state</span>
                      <span className="text-xs text-white/60 truncate">{activity.state}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {data.spotify && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3 relative z-10">
            <img src={data.spotify.album_art_url} alt="Album Art" className="w-12 h-12 rounded shadow-md" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: 'rgb(162,167,210)' }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zM20.04 9.72C16.2 7.44 9.36 7.2 5.52 8.4c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.32-1.32 11.88-1.08 16.2 1.44.54.3.72 1.02.42 1.56-.24.6-.96.72-1.44.42z"/></svg>
                Listening
              </div>
              <div className="text-sm font-bold text-white truncate">{data.spotify.song}</div>
              <div className="text-xs text-white/60 truncate">{data.spotify.artist}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
