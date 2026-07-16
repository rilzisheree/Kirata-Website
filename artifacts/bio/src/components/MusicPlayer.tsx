import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <motion.div 
      className="glass-card p-5 group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col gap-4">
        {/* Top Info */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200&h=200" 
              alt="Album Cover" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700"
            />
            {/* Play overlay for hover (optional aesthetic detail) */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-cyan-400 mb-1 opacity-80">NOW PLAYING</div>
            <h4 className="text-base font-bold text-white truncate group-hover:text-glow-cyan transition-all">Resonance</h4>
            <p className="text-sm text-white/60 truncate">HOME</p>
          </div>

          {/* Animated Waveform */}
          <div className="flex items-end gap-1 h-8 px-2 shrink-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-cyan-400 rounded-t-sm"
                initial={{ height: "4px" }}
                animate={{ 
                  height: isPlaying 
                    ? ["4px", `${Math.random() * 20 + 8}px`, "4px"] 
                    : "4px" 
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8 + Math.random() * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-2">
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>
          
          <div className="flex-1 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 relative"
                style={{ width: `${volume}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
              </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute opacity-0 w-24 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
