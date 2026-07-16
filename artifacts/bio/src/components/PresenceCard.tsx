import React from 'react';
import { useGetPresence, getGetPresenceQueryKey } from "@workspace/api-client-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export function PresenceCard() {
  const { data: presence, isLoading } = useGetPresence({ 
    query: { 
      refetchInterval: 30000, 
      queryKey: getGetPresenceQueryKey() 
    } 
  });

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

  // Graceful fallback if API fails or returns nothing yet
  const status = presence?.status || 'offline';
  const isOnline = status === 'online';
  const isIdle = status === 'idle';
  
  const statusColor = isOnline
    ? 'bg-green-500'
    : isIdle
    ? 'bg-yellow-500'
    : 'bg-gray-500';

  const statusLabel = isOnline ? 'Online' : isIdle ? 'Idle' : 'Offline';

  const timeAgo = presence?.lastUpdated 
    ? formatDistanceToNow(new Date(presence.lastUpdated), { addSuffix: true }) 
    : null;

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
          <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-lg">
            💻
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a16] ${statusColor}`} />
        </div>
        <div>
          <p className="font-bold text-white tracking-wide text-sm leading-tight">{statusLabel}</p>
          <p className="text-xs text-white/60 font-mono mt-0.5">PC Presence</p>
        </div>
        {timeAgo && (
          <div className="ml-auto text-[10px] text-white/35 font-mono text-right shrink-0">
            {timeAgo.toUpperCase()}
          </div>
        )}
      </div>

      {/* Activity details */}
      {!presence?.currentApp && !presence?.currentGame ? (
        <div className="pt-3 border-t border-white/5 relative z-10">
          <span className="text-xs text-white/35 font-mono">
            {status === 'offline' ? 'pc is off or agent not running' : 'doing nothing probably'}
          </span>
        </div>
      ) : (
        <div className="pt-3 border-t border-white/5 relative z-10 space-y-1.5">
          {presence.currentGame && (
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest w-16 shrink-0">playing</span>
              <span className="text-sm font-medium text-white truncate">{presence.currentGame}</span>
              {presence.timeSpent && (
                <span className="ml-auto text-xs text-white/40 font-mono shrink-0">{presence.timeSpent}</span>
              )}
            </div>
          )}

          {presence.currentApp && !presence.currentGame && (
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest w-16 shrink-0">using</span>
              <span className="text-sm font-medium text-white truncate">
                {presence.activityIcon ? `${presence.activityIcon} ` : ''}{presence.currentApp}
              </span>
              {presence.timeSpent && (
                <span className="ml-auto text-xs text-white/40 font-mono shrink-0">{presence.timeSpent}</span>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
