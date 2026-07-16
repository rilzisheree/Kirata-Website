import React from 'react';
import { motion } from 'framer-motion';

const projects = [
  {
    title: "Project Nexus",
    desc: "A real-time data visualization engine built with WebGL and React.",
    tags: ["React", "WebGL", "TypeScript"],
    link: "#"
  },
  {
    title: "Aura Theme",
    desc: "A dark, glowing cyber-aesthetic theme for VS Code with over 50k installs.",
    tags: ["Design", "JSON", "Theme"],
    link: "#"
  },
  {
    title: "Signal API",
    desc: "High-performance WebSocket server handling thousands of concurrent connections.",
    tags: ["Go", "WebSockets", "Redis"],
    link: "#"
  }
];

export function ProjectsGrid() {
  return (
    <div className="mt-8">
      <motion.h3 
        className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-cyan-400 text-xl">{'//'}</span> Featured Work
      </motion.h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj, i) => (
          <motion.a
            href={proj.link}
            key={i}
            className="glass-card p-5 block group relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">{proj.title}</h4>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              <p className="text-sm text-white/60 mb-6 flex-1 line-clamp-2">
                {proj.desc}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-auto">
                {proj.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 text-white/70 border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
