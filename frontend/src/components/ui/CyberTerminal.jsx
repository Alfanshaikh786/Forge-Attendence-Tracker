import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * CyberTerminal - A full-screen terminal interface with typewriter effect
 * 
 * @param {Object} props
 * @param {Array} props.logs - Array of log messages
 * @param {string} props.status - Terminal status ("idle", "scanning", "success", "error")
 * @param {boolean} props.showCursor - Show blinking cursor
 * @param {string} props.title - Terminal title
 * @param {Function} props.onCommand - Handle terminal command input
 * @returns {JSX.Element}
 */
export const CyberTerminal = ({
  logs = [],
  status = 'idle',
  showCursor = true,
  title = 'CYBER OPS TERMINAL v1.0',
  onCommand,
}) => {
  const terminalRef = useRef(null);
  const logsRef = useRef(null);
  const cursorRef = useRef(null);
  const [input, setInput] = useState('');
  const [displayedLogs, setDisplayedLogs] = useState([]);

  // Status color mapping
  const statusColors = {
    idle: 'text-cyber-text-secondary',
    scanning: 'text-warning-color animate-pulse-neon',
    success: 'text-cyber-neon',
    error: 'text-danger-color',
  };

  // Typewriter animation for logs
  useEffect(() => {
    if (logs.length > displayedLogs.length) {
      const newLog = logs[displayedLogs.length];
      const chars = newLog.text.split('');
      let charIndex = 0;

      const interval = setInterval(() => {
        if (charIndex <= chars.length) {
          setDisplayedLogs([
            ...displayedLogs.slice(0, -1),
            {
              ...newLog,
              text: chars.slice(0, charIndex).join(''),
            },
          ]);
          charIndex++;
        } else {
          clearInterval(interval);
          setDisplayedLogs([...displayedLogs, newLog]);
        }
      }, 20); // Typewriter speed

      return () => clearInterval(interval);
    }
  }, [logs, displayedLogs]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logsRef.current) {
      gsap.to(logsRef.current, {
        scrollTop: logsRef.current.scrollHeight,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [displayedLogs]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onCommand) {
      onCommand(input);
      setInput('');
    }
  };

  return (
    <div
      ref={terminalRef}
      className="w-full h-screen bg-cyber-bg overflow-hidden flex flex-col border border-cyber-border"
    >
      {/* Terminal Header */}
      <div className="border-b border-cyber-border bg-cyber-surface/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyber-neon animate-pulse-neon" />
          <h1 className="font-mono text-sm text-cyber-neon uppercase tracking-widest">
            {title}
          </h1>
        </div>
        <span className={`font-mono text-xs ${statusColors[status]} uppercase tracking-widest`}>
          [{status.toUpperCase()}]
        </span>
      </div>

      {/* Terminal Logs */}
      <div
        ref={logsRef}
        className="flex-1 overflow-y-auto px-6 py-4 font-mono text-sm space-y-2"
        style={{
          scrollbarColor: 'rgba(0, 255, 65, 0.3) rgba(10, 10, 10)',
        }}
      >
        {displayedLogs.map((log, index) => (
          <div
            key={index}
            className={`text-cyber-text-secondary flex gap-2`}
          >
            <span className="text-cyber-neon flex-shrink-0 min-w-fit">
              [{new Date().toLocaleTimeString()}]
            </span>
            <span className={log.color || 'text-cyber-text'}>
              {log.text}
            </span>
          </div>
        ))}
      </div>

      {/* Terminal Input */}
      {onCommand && (
        <div className="border-t border-cyber-border bg-cyber-surface/50 px-6 py-4">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-cyber-neon">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="flex-1 bg-transparent text-cyber-text placeholder-cyber-text-secondary outline-none"
            />
            {showCursor && (
              <span
                ref={cursorRef}
                className="w-2 h-4 bg-cyber-neon animate-blink"
              />
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="border-t border-cyber-border bg-cyber-surface/30 px-6 py-2 flex justify-between text-xs font-mono text-cyber-text-secondary">
        <span>SYSTEM READY</span>
        <span>LOGS: {displayedLogs.length}</span>
      </div>
    </div>
  );
};

export default CyberTerminal;
