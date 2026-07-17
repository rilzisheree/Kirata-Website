import React, { useEffect, useState } from 'react';
import { useGetPresence, getGetPresenceQueryKey } from "@workspace/api-client-react";
import { motion } from 'framer-motion';

const APP_ICONS: Record<string, string> = {
  // Apps
  'VS Code':          '🖥️',
  'Windows Terminal': '⬛',
  'PowerShell':       '🔷',
  'Google Chrome':    '🌐',
  'Firefox':          '🦊',
  'Microsoft Edge':   '🌀',
  'Discord':          '💬',
  'Spotify':          '🎵',
  'Figma':            '🎨',
  'Obsidian':         '🔮',
  'Slack':            '💼',
  'Notion':           '📝',
  'Steam':            '🎮',
  'JetBrains Rider':  '🛠️',
  'IntelliJ IDEA':    '🛠️',
  'WebStorm':         '🌩️',
  'Notepad++':        '📄',
  // Games
  'VALORANT':         '🔴',
  'Roblox':           '🧱',
  'Minecraft':        '⛏️',
  'CS2':              '💣',
  'CS:GO':            '💣',
  'League of Legends':'⚔️',
  'Fortnite':         '🏗️',
  'Apex Legends':     '🎯',
  'Genshin Impact':   '🌸',
  'Rocket League':    '🚗',
  'Destiny 2':        '🌙',
  'Elden Ring':        '💀',
  'GTA V':            '🚔',
};

function getAppIcon(name: string): string {
  return APP_ICONS[name] ?? '📦';
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

  // Fall back to server-formatted strings if timestamps aren't present (old agent)
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
      {/* Decorative monitor watermark */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.07] pointer-events-none select-none">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
          <path d="M21 2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7l-2 3v1h8v-1l-2-3h7a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 14H3V4h18v12z"/>
        </svg>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-3 relative z-10 mb-4">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden">
            <img src="/avatar.jpg" alt="kirata" className="w-full h-full object-cover" />
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a16] ${statusDotColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white tracking-wide text-sm leading-tight">kirata's pc :D</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
            <span className="text-[11px] text-white/50 font-mono">{statusLabel}</span>
          </div>
        </div>

        {uptime && isOnline && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">uptime</p>
            <p className="text-xs text-white/50 font-mono">{uptime}</p>
          </div>
        )}
      </div>

      {/* Activity / status details */}
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
                <span className="text-base">{getAppIcon(currentGame)}</span>
                <span className="text-sm font-medium text-white truncate">{currentGame}</span>
                {timeSpent && (
                  <span className="ml-auto text-[11px] text-cyan-400/70 font-mono shrink-0 bg-cyan-400/10 px-2 py-0.5 rounded-full">
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
                    <span className="text-base">{getAppIcon(app)}</span>
                    <span className="text-sm font-medium text-white truncate">{app}</span>
                    {timeSpent && i === 0 && !currentGame && (
                      <span className="ml-auto text-[11px] text-cyan-400/70 font-mono shrink-0 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                        {timeSpent}
                      </span>
                    )}
                  </div>
                ))}
              </>
            ) : currentApp ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest w-14 shrink-0">using</span>
                <span className="text-base">{getAppIcon(currentApp)}</span>
                <span className="text-sm font-medium text-white truncate">{currentApp}</span>
                {timeSpent && !currentGame && (
                  <span className="ml-auto text-[11px] text-cyan-400/70 font-mono shrink-0 bg-cyan-400/10 px-2 py-0.5 rounded-full">
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
