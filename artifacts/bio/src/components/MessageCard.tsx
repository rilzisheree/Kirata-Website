import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const LS_KEY = 'msg_last_sent';

function getRemainingMs(): number {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return 0;
    const elapsed = Date.now() - parseInt(raw, 10);
    return Math.max(0, COOLDOWN_MS - elapsed);
  } catch {
    return 0;
  }
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.ceil(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

export function MessageCard() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorText, setErrorText] = useState('');
  const [remaining, setRemaining] = useState(getRemainingMs);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Countdown ticker
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const r = getRemainingMs();
      setRemaining(r);
      if (r <= 0) {
        setStatus('idle');
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  // Init rate_limited state from localStorage on mount
  useEffect(() => {
    const r = getRemainingMs();
    if (r > 0) {
      setRemaining(r);
      setStatus('rate_limited');
    }
  }, []);

  const isBusy = status === 'sending' || status === 'rate_limited';
  const charCount = message.length;
  const overLimit = charCount > 2000;

  async function handleSend() {
    if (!message.trim() || isBusy || overLimit) return;

    setStatus('sending');
    setErrorText('');

    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const mins = data.retryAfterMinutes ?? 30;
        // Sync localStorage so the countdown is accurate
        localStorage.setItem(LS_KEY, String(Date.now() - (COOLDOWN_MS - mins * 60 * 1000)));
        setRemaining(getRemainingMs());
        setStatus('rate_limited');
        setErrorText('');
        return;
      }

      if (res.status === 503) {
        setErrorText('messaging unavailable right now');
        setStatus('error');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorText(data.error || 'something went wrong');
        setStatus('error');
        return;
      }

      // Success
      localStorage.setItem(LS_KEY, String(Date.now()));
      setMessage('');
      setStatus('sent');
      setRemaining(COOLDOWN_MS);
    } catch {
      setErrorText('could not reach server');
      setStatus('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  const isRateLimited = status === 'rate_limited';
  const isSent = status === 'sent';

  return (
    <motion.div
      className="glass-card p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Decorative icon */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.06] pointer-events-none select-none">
        <Send size={64} />
      </div>

      <div className="relative z-10">
        <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">
          send me a message
        </h3>

        <AnimatePresence mode="wait">
          {isSent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <CheckCircle size={28} className="text-cyan-400" />
              <p className="text-sm text-white/70 font-mono">message sent</p>
              <p className="text-xs text-white/35 font-mono">
                you can send another in {formatCountdown(remaining)}
              </p>
            </motion.div>
          ) : isRateLimited ? (
            <motion.div
              key="ratelimit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <Clock size={28} className="text-white/30" />
              <p className="text-sm text-white/50 font-mono">
                {errorText || 'already sent one recently'}
              </p>
              <p className="text-xs text-cyan-400/60 font-mono tabular-nums">
                {formatCountdown(remaining)}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3"
            >
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isBusy}
                  placeholder="say whatever"
                  rows={4}
                  className={`
                    w-full resize-none rounded-lg bg-white/5 border
                    ${overLimit ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/40'}
                    text-white/80 placeholder:text-white/25 text-sm font-mono
                    px-3 py-2.5 outline-none transition-colors duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
                <span
                  className={`absolute bottom-2 right-2.5 text-[10px] font-mono tabular-nums pointer-events-none
                    ${overLimit ? 'text-red-400' : 'text-white/20'}`}
                >
                  {charCount}/2000
                </span>
              </div>

              <AnimatePresence>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-xs font-mono text-red-400/80"
                  >
                    <AlertCircle size={12} className="shrink-0" />
                    {errorText}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-white/20 font-mono hidden sm:block">
                  ctrl+enter to send
                </span>
                <motion.button
                  onClick={handleSend}
                  disabled={isBusy || !message.trim() || overLimit}
                  whileTap={{ scale: 0.96 }}
                  className="
                    ml-auto flex items-center gap-2
                    px-4 py-2 rounded-lg text-xs font-mono
                    bg-cyan-500/15 hover:bg-cyan-500/25
                    border border-cyan-500/20 hover:border-cyan-500/40
                    text-cyan-400 hover:text-cyan-300
                    transition-all duration-150
                    disabled:opacity-40 disabled:cursor-not-allowed
                    disabled:hover:bg-cyan-500/15 disabled:hover:border-cyan-500/20
                  "
                >
                  {status === 'sending' ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="inline-block"
                      >
                        ◌
                      </motion.span>
                      sending
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      send
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
