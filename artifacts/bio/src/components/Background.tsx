import React from 'react';

export function Background({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-background">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(162,167,210,0.035) 0%, transparent 55%)' }}
      />

      <div className="relative z-10 w-full flex justify-center py-12 px-4 sm:px-8 sm:py-16">
        <div className="w-full max-w-5xl pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}
