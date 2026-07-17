import React, { useEffect, useState } from 'react';
import { useGetPresence, getGetPresenceQueryKey } from "@workspace/api-client-react";
import { motion } from 'framer-motion';

type AppIconDef = { slug: string; color: string };

const APP_ICON_DEFS: Record<string, AppIconDef> = {
  'VS Code':          { slug: 'visualstudiocode',  color: '007ACC' },
  'Google Chrome':    { slug: 'googlechrome',      color: '4285F4' },
  'Firefox':          { slug: 'firefox',           color: 'FF7139' },
  'Microsoft Edge':   { slug: 'microsoftedge',     color: '0078D7' },
  'Discord':          { slug: 'discord',           color: '5865F2' },
  'Spotify':          { slug: 'spotify',           color: '1DB954' },
  'Figma':            { slug: 'figma',             color: 'F24E1E' },
  'Obsidian':         { slug: 'obsidian',          color: '7C3AED' },
  'Slack':            { slug: 'slack',             color: '4A154B' },
  'Notion':           { slug: 'notion',            color: 'ffffff' },
  'Steam':            { slug: 'steam',             color: 'ffffff' },
  'JetBrains Rider':  { slug: 'rider',             color: 'FE315D' },
  'IntelliJ IDEA':    { slug: 'intellijidea',      color: 'FF0000' },
  'WebStorm':         { slug: 'webstorm',          color: '00C0F3' },
  'Notepad++':        { slug: 'notepadplusplus',   color: '90E59A' },
  'VALORANT':         { slug: 'valorant',          color: 'FF4655' },
  'Roblox':           { slug: 'roblox',            color: 'ffffff' },
  'Minecraft':        { slug: 'minecraft',         color: '62B47A' },
  'CS2':              { slug: 'counter-strike',    color: 'F4A400' },
  'CS:GO':            { slug: 'counter-strike',    color: 'F4A400' },
  'League of Legends':{ slug: 'leagueoflegends',   color: 'C6A84B' },
  'Fortnite':         { slug: 'fortnite',          color: 'ffffff' },
  'Destiny 2':        { slug: 'bungie',            color: 'ffffff' },
  'GTA V':            { slug: 'rockstargames',     color: 'FCAF17' },
};

function AppIcon({ name, size = 16 }: { name: string; size?: number }) {
  const def = APP_ICON_DEFS[name];

  const fallback = (
    <span
      className="shrink-0 flex items-center justify-center rounded bg-white/10 text-[9px] font-bold text-white/60"
      style={{ width: size, height: size }}
    >
      {name[0]}
    </span>
  );

  if (!def) return fallback;

  return (
    <img
      src={`https://cdn.simpleicons.org/${def.slug}/${def.color}`}
      alt={name}
      width={size}
      height={size}
      className="shrink-0"
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = 'none';
        const span = document.createElement('span');
        span.textContent = name[0];
        span.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:4px;background:rgba(255,255,255,0.1);font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);flex-shrink:0`;
        el.parentNode?.insertBefore(span, el);
      }}
    />
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function useLiveTime(isoTimestamp: string | null | undefined): string | null {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!isoTimestamp) { setDisplay(null); return; }
    const update = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000));
      setDisplay(formatDuration(elapsed));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isoTimestamp]);

  return display;
}

export function PresenceCard() {
  const { data: presence, isLoading } = useGetPresence({
    query: {
      refetchInterval: 30000,
      queryKey: getGetPresenceQueryKey()
    }
  });

  const liveUptime    = useLiveTime((presence as any)?.bootTime);
  const liveTimeSpent = useLiveTime((presence as any)?.activityStartTime);

  const uptime    = liveUptime    ?? (presence as any)?.uptime    ?? null;
  const timeSpent = liveTimeSpent ?? (presence as any)?.timeSpent ?? null;

  if (isLoading) {
    return (
      <div className="glass-card p-5 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-white/10 rounded w-24" />
            <div className="h-3 bg-white/10 rounded w-16" />
          </div>
        </div>
        <div className="h-14 bg-white/5 rounded-lg w-full" />
      </div>
    );
  }

  const status = (presence as any)?.status || 'offline';
  const isOnline  = status === 'online';
  const isIdle    = status === 'idle';
  const isOffline = status === 'offline';

  const statusDotColor = isOnline
    ? 'bg-green-500'
    : isIdle
    ? 'bg-yellow-400'
    : 'bg-gray-500';

  const statusLabel = isOnline ? 'online' : isIdle ? 'idle' : 'offline';

  const currentApps = (presence as any)?.currentApps as string[] | undefined;
  const currentApp  = (currentApps && currentApps.length > 0) ? null : (presence?.currentApp ?? null);
  const currentGame = presence?.currentGame ?? null;

  const idleMessage    = "prob asleep or doing fuck all";
  const offlineMessage = "pc's off n js asleep";

  return (
    <motion.div
      className="glass-card p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.07] pointer-events-none select-none">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
          <path d="M21 2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7l-2 3v1h8v-1l-2-3h7a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 14H3V4h18v12z"/>
        </svg>
      </div>

      <div className="flex items-center gap-3 relative z-10 mb-4">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden">
            <img src="/avatar.jpg" alt="kirata" className="w-full h-full object-cover" />
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a16] ${statusDotColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white tracking-wide text-sm leading-tight">kirata's pc</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
            <span className="text-[11px] text-white/50 font-mono">{statusLabel}</span>
          </div>
        </div>

        {uptime && !isOffline && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">uptime</p>
            <p className="text-xs text-white/50 font-mono">{uptime}</p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 relative z-10 space-y-1.5">
        {isOffline ? (
          <span className="text-xs text-white/35 font-mono">{offlineMessage}</span>
        ) : isIdle ? (
          <span className="text-xs text-white/35 font-mono">{idleMessage}</span>
        ) : !currentGame && !currentApp && !(currentApps && currentApps.length > 0) ? (
          <span className="text-xs text-white/35 font-mono">doing nothing probably</span>
        ) : (
          <div className="space-y-2">
            {currentGame && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest w-14 shrink-0">playing</span>
                <AppIcon name={currentGame} size={16} />
                <span className="text-sm font-medium text-white truncate">{currentGame}</span>
                {timeSpent && (
                  <span className="ml-auto text-[11px] text-[#a2a7d2]/70 font-mono shrink-0 bg-[#a2a7d2]/10 px-2 py-0.5 rounded-full">
                    {timeSpent}
                  </span>
                )}
              </div>
            )}
            {currentApps && currentApps.length > 0 ? (
              <>
                {currentApps.map((app, i) => (
                  <div key={app} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest w-14 shrink-0">{i === 0 ? 'using' : ''}</span>
                    <AppIcon name={app} size={16} />
                    <span className="text-sm font-medium text-white truncate">{app}</span>
                    {timeSpent && i === 0 && !currentGame && (
                      <span className="ml-auto text-[11px] text-[#a2a7d2]/70 font-mono shrink-0 bg-[#a2a7d2]/10 px-2 py-0.5 rounded-full">
                        {timeSpent}
                      </span>
                    )}
                  </div>
                ))}
              </>
            ) : currentApp ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest w-14 shrink-0">using</span>
                <AppIcon name={currentApp} size={16} />
                <span className="text-sm font-medium text-white truncate">{currentApp}</span>
                {timeSpent && !currentGame && (
                  <span className="ml-auto text-[11px] text-[#a2a7d2]/70 font-mono shrink-0 bg-[#a2a7d2]/10 px-2 py-0.5 rounded-full">
                    {timeSpent}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}
