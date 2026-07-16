import React, { useEffect, useRef } from 'react';
import { useMousePosition } from '../hooks/use-mouse';
import { motion } from 'framer-motion';

const Particles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number, y: number, speed: number, size: number, opacity: number }[] = [];
    const particleCount = 40;
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.2 + Math.random() * 0.5,
        size: Math.random() * 2,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();

        // Move up
        p.y -= p.speed;
        
        // Wrap around
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-40 z-0" />;
};

export function Background({ children }: { children: React.ReactNode }) {
  const { x, y } = useMousePosition();
  
  // Subtle parallax for the main container
  const xOffset = typeof window !== 'undefined' ? (x / window.innerWidth - 0.5) * 16 : 0;
  const yOffset = typeof window !== 'undefined' ? (y / window.innerHeight - 0.5) * 16 : 0;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      {/* Base Gradient */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none" />
      
      {/* Animated Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[100px] blob-animate" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-700/10 blur-[120px] blob-animate" style={{ animationDelay: '-10s' }} />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-blue-700/15 blur-[100px] blob-animate" style={{ animationDelay: '-5s' }} />
      </div>

      <Particles />
      
      {/* Subtle Noise Texture Overlay */}
      <div 
        className="fixed inset-0 z-[1] opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      <motion.div 
        className="relative z-10 w-full flex justify-center py-20 px-4 sm:px-6"
        animate={{ x: xOffset, y: yOffset }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <div className="w-full max-w-2xl space-y-8 pb-32">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
