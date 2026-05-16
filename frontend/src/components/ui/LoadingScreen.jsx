import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = 'Synchronizing...' }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-cyber-neon/20 blur-[40px] rounded-full animate-pulse" />
        
        <div className="relative flex flex-col items-center">
          <Loader2 className="animate-spin text-cyber-neon mb-6" size={48} />
          <div className="space-y-2 text-center">
            <h2 className="font-mono text-xl font-bold text-cyber-neon tracking-widest uppercase">
              System Loading
            </h2>
            <p className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-[0.2em] animate-pulse">
              {message}
            </p>
          </div>
        </div>
      </div>
      
      {/* Loading bar */}
      <div className="mt-12 w-48 h-1 bg-cyber-surface rounded-full overflow-hidden border border-cyber-border/30">
        <div className="h-full bg-cyber-neon animate-[loading-bar_2s_infinite_ease-in-out]" />
      </div>
    </div>
  );
}
