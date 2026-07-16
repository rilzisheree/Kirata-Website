import React from 'react';
import { useGetPresence, getGetPresenceQueryKey } from "@workspace/api-client-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export function PresenceCard() {
  const { data: presence, isLoading, isError } = useGetPresence({ 
    query: { 
      refetchInterval: 30000, 
      queryKey: getGetPresenceQueryKey() 
    } 
  });

  if (isLoading) {
    return (
      <div className="glass-card p-5 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="h-4 bg-white/10 rounded w-24" />
        </div>
        <div className="h-16 bg-white/5 rounded-lg w-full" />
      </div>
    );
  }

  // Graceful fallback if API fails or returns nothing yet
  const status = presence?.status || 'offline';
  const isOnline = status === 'online';
  const isIdle = status === 'idle';
  
  const statusColor = isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 
                      isIdle ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]' : 
                      'bg-gray-500 shadow-[0_0_10px_rgba(107,114,128,0.4)]';

  const statusText = isOnline ? 'ONLINE' : isIdle ? 'IDLE' : 'OFFLINE';

  const timeAgo = presence?.lastUpdated 
    ? formatDistanceToNow(new Date(presence.lastUpdated), { addSuffix: true }) 
    : 'Unknown';

  return (
    <motion.div 
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {isOnline && <div className="absolute w-full h-full rounded-full bg-green-500/40 animate-ping" />}
            <div className={`w-3 h-3 rounded-full relative z-10 ${statusColor}`} />
          </div>
          <span className="text-xs font-mono tracking-widest text-white/80">{statusText}</span>
        </div>
        
        {presence?.lastUpdated && (
          <div className="text-[10px] text-white/40 font-mono text-right">
            UPDATED {timeAgo.toUpperCase()}
          </div>
        )}
      </div>

      {!presence?.currentApp && !presence?.currentGame && !presence?.currentSong ? (
        <div className="py-4 text-center border border-white/5 rounded-lg bg-black/20">
          <p className="text-sm text-white/40 italic">No recent activity detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {presence.currentGame && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                🎮
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/50 uppercase tracking-wide">Playing</div>
                <div className="text-sm font-bold text-white truncate">{presence.currentGame}</div>
              </div>
              {presence.timeSpent && (
                <div className="text-xs text-white/50 font-mono shrink-0">{presence.timeSpent}</div>
              )}
            </div>
          )}

          {presence.currentApp && !presence.currentGame && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                {presence.activityIcon || '💻'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/50 uppercase tracking-wide">Working in</div>
                <div className="text-sm font-bold text-white truncate">{presence.currentApp}</div>
              </div>
              {presence.timeSpent && (
                <div className="text-xs text-white/50 font-mono shrink-0">{presence.timeSpent}</div>
              )}
            </div>
          )}
          
          {presence.currentSong && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              {presence.currentSongAlbumArt ? (
                <img src={presence.currentSongAlbumArt} alt="Album Art" className="w-8 h-8 rounded shrink-0 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                  🎵
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/50 uppercase tracking-wide">Listening</div>
                <div className="text-sm font-bold text-white truncate">{presence.currentSong}</div>
                {presence.currentSongArtist && (
                  <div className="text-xs text-white/50 truncate">{presence.currentSongArtist}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
