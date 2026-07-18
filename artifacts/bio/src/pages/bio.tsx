import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { EntryGate } from '../components/EntryGate';
import { Background } from '../components/Background';
import { useTypingEffect } from '../hooks/use-typing';
import { LanyardPresence as DiscordPresence } from '../components/DiscordPresence';
import { RecentTracks } from '../components/RecentTracks';
import { BackgroundMusic, type BackgroundMusicHandle } from '../components/BackgroundMusic';
import { VisitCounter } from '../components/VisitCounter';
import { MessageCard } from '../components/MessageCard';
import { Check, Copy } from 'lucide-react';
import { DiscordIcon, RobloxIcon, SpotifyIcon } from '../components/SocialIcons';
import { PresenceCard } from '../components/PresenceCard';

const BADGES = ["chud", "htn", "grindmaxxing", "valorant demon"];
const PHRASES = ["sleeper", "chud", "valorant demon"];
const DISCORD_USERNAME = "vkirata";

function fade(delay: number): Variants {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] } },
  };
}

export default function BioPage() {
  const typedText = useTypingEffect(PHRASES, 100, 50, 2000);
  const musicRef = useRef<BackgroundMusicHandle>(null);
  const skipBoot = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('bio_visited');
  const [entered, setEntered] = useState(false);
  const [discordOpen, setDiscordOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.documentElement.classList.add('dark'); }, []);

  useEffect(() => {
    if (!discordOpen) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setDiscordOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [discordOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(DISCORD_USERNAME);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const s = entered ? 'visible' : 'hidden';

  return (
    <>
      <EntryGate skipBoot={skipBoot} onAudioReady={() => musicRef.current?.play()} onDone={() => { sessionStorage.setItem('bio_visited', '1'); setEntered(true); }} />
      <BackgroundMusic ref={musicRef} />
      <Background>
        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">

          {/* ── LEFT: Profile + About ── */}
          <div className="flex flex-col gap-6">

            {/* Avatar + name + typing */}
            <motion.div
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
              initial="hidden" animate={s} variants={fade(0.1)}
            >
              <div className="relative mb-5 self-center lg:self-start">
                <div className="absolute inset-[-10px] rounded-full avatar-ring z-0" />
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 relative z-10 bg-black">
                  <img src="/avatar.jpg" alt="kirata" className="w-full h-full object-cover" />
                </div>
              </div>

              <h1 className="text-4xl font-display font-bold text-white mb-1 text-glow-cyan tracking-tight">
                kirata
              </h1>

              <div className="text-base font-mono h-7 flex items-center" style={{ color: 'rgb(162,167,210)' }}>
                {'>'} <span className="ml-2">{typedText}</span><span className="animate-pulse ml-1">_</span>
              </div>
            </motion.div>

            {/* Badges */}
            <motion.div className="flex flex-wrap gap-2 justify-center lg:justify-start" initial="hidden" animate={s} variants={fade(0.2)}>
              {BADGES.map((badge) => (
                <span key={badge} className="glass-pill px-3 py-1 text-xs font-medium text-white/75">
                  {badge}
                </span>
              ))}
            </motion.div>

            {/* Social icons */}
            <motion.div className="flex gap-3 justify-center lg:justify-start" initial="hidden" animate={s} variants={fade(0.3)}>
              <div className="relative" ref={popupRef}>
                <button
                  data-testid="button-discord"
                  onClick={() => setDiscordOpen(v => !v)}
                  className="glass-pill w-10 h-10 text-white/60 hover:text-white flex items-center justify-center"
                  aria-label="Discord"
                >
                  <DiscordIcon size={18} />
                </button>
                <AnimatePresence>
                  {discordOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 left-0 z-50 min-w-[160px]"
                    >
                      <div className="glass-card px-4 py-3 flex items-center gap-3 border border-white/10">
                        <DiscordIcon size={16} className="text-[#5865F2] shrink-0" />
                        <span className="text-sm font-mono text-white/90 select-all">{DISCORD_USERNAME}</span>
                        <button
                          data-testid="button-copy-discord"
                          onClick={handleCopy}
                          className="ml-auto text-white/50 hover:text-white transition-colors"
                          aria-label="Copy username"
                        >
                          {copied ? <Check size={14} style={{ color: '#a2a7d2' }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                data-testid="link-roblox"
                href="https://www.roblox.com/users/1872507151/profile"
                target="_blank" rel="noreferrer"
                className="glass-pill w-10 h-10 text-white/60 hover:text-white flex items-center justify-center"
                aria-label="Roblox"
              >
                <RobloxIcon size={18} />
              </a>

              <a
                data-testid="link-spotify"
                href="https://open.spotify.com/user/k3mx457gl6spsenev0uxsfkw3?si=4529a64f8f1545aa"
                target="_blank" rel="noreferrer"
                className="glass-pill w-10 h-10 text-white/60 hover:text-white flex items-center justify-center"
                aria-label="Spotify"
              >
                <SpotifyIcon size={18} />
              </a>
            </motion.div>

            {/* About */}
            <motion.div className="glass-card p-5" initial="hidden" animate={s} variants={fade(0.4)}>
              <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(162,167,210,0.6)' }}>About</h3>
              <p className="text-white/75 leading-relaxed text-sm">
                dm me multiple times if i dont respond
              </p>
            </motion.div>

            {/* Visit counter */}
            <motion.div className="flex justify-center lg:justify-start pl-1" initial="hidden" animate={s} variants={fade(0.9)}>
              <VisitCounter />
            </motion.div>
          </div>

          {/* ── RIGHT: Live cards ── */}
          <div className="flex flex-col gap-4">
            <motion.div initial="hidden" animate={s} variants={fade(0.25)}>
              <PresenceCard />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div initial="hidden" animate={s} variants={fade(0.35)}>
                <DiscordPresence />
              </motion.div>
              <motion.div initial="hidden" animate={s} variants={fade(0.45)}>
                <RecentTracks />
              </motion.div>
            </div>

            <motion.div initial="hidden" animate={s} variants={fade(0.55)}>
              <MessageCard />
            </motion.div>
          </div>

        </div>
      </Background>
    </>
  );
}
