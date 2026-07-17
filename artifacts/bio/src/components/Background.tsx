import React, { useEffect, useRef } from 'react';

const Particles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number, y: number, speed: number, size: number, opacity: number }[] = [];
    const particleCount = 60;
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

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
        p.y -= p.speed;
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
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-background">
      {/* Base Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(162,167,210,0.06) 0%, transparent 60%)' }} />
      
      {/* Ambient blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[380px] h-[380px] rounded-full blur-[70px] blob-animate" style={{ background: 'rgba(162,167,210,0.08)' }} />
        <div className="absolute bottom-[-5%] right-[-5%] w-[420px] h-[420px] rounded-full blur-[80px] blob-animate" style={{ background: 'rgba(162,167,210,0.06)', animationDelay: '-10s' }} />
      </div>

      <Particles />

      <div className="relative z-10 w-full flex justify-center py-20 px-4 sm:px-6">
        <div className="w-full max-w-2xl space-y-8 pb-32">
          {children}
        </div>
      </div>
    </div>
  );
}
