import React from 'react';
import { useMousePosition } from '../hooks/use-mouse';

export function CursorGlow() {
  const { x, y } = useMousePosition();

  // Return null if mouse hasn't moved yet (prevents flash in top-left)
  if (x === 0 && y === 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-50 mix-blend-screen transition-opacity duration-300"
      style={{
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0) 70%)',
        transform: `translate(${x - 200}px, ${y - 200}px)`,
        willChange: 'transform'
      }}
    />
  );
}
