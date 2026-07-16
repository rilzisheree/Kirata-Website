import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Background } from '../components/Background';
import { CursorGlow } from '../components/CursorGlow';
import { useTypingEffect } from '../hooks/use-typing';
import { LanyardPresence as DiscordPresence } from '../components/DiscordPresence';
import { PresenceCard } from '../components/PresenceCard';
import { MusicPlayer } from '../components/MusicPlayer';
import { ProjectsGrid } from '../components/ProjectsGrid';

import { SiDiscord, SiRoblox, SiSpotify } from 'react-icons/si';

const SOCIALS = [
  { icon: SiDiscord, href: '#', label: 'Discord' },
  { icon: SiRoblox, href: '#', label: 'Roblox' },
  { icon: SiSpotify, href: '#', label: 'Spotify' },
];

const BADGES = ["chud", "htn", "grindmaxxing", "valorant demon"];
const PHRASES = ["kinda developer", "chud", "valorant demon"];

export default function BioPage() {
  const typedText = useTypingEffect(PHRASES, 100, 50, 2000);

  // Force dark mode on html element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <CursorGlow />
      <Background>
        {/* Profile / Hero */}
        <motion.div 
          className="flex flex-col items-center text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mb-6">
            <div className="absolute inset-[-10px] rounded-full avatar-ring z-0" />
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 relative z-10 bg-black">
              <img src="/avatar.jpg" alt="kirata" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-2 text-glow-cyan tracking-tight">
            kirata
          </h1>
          
          <div className="text-lg font-mono text-cyan-400 h-8 flex items-center justify-center">
            {'>'} <span className="ml-2">{typedText}</span><span className="animate-pulse ml-1">_</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {BADGES.map((badge, i) => (
              <motion.div 
                key={badge}
                className="glass-pill px-4 py-1.5 text-xs font-medium text-white/80"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {badge}
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-8">
            {SOCIALS.map((social, i) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="glass-pill w-12 h-12 text-white/70 hover:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                aria-label={social.label}
              >
                <social.icon size={20} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          className="glass-card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-sm font-display font-bold text-white/40 uppercase tracking-widest mb-3">About</h3>
          <p className="text-white/80 leading-relaxed">
            i play valorant every single day with 4 other chuds lwkeniunkly carrying them<br /><br />
            if i dont respond im probably in bed or sum idk<br /><br />
            dm me multiple times if i dont respond
          </p>
        </motion.div>

        {/* Cards Grid / Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DiscordPresence />
          <div className="flex flex-col gap-4">
            <PresenceCard />
            <MusicPlayer />
          </div>
        </div>

        {/* Projects */}
        <ProjectsGrid />
        
      </Background>
    </>
  );
}
