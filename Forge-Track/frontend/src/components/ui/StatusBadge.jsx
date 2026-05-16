import React from 'react';

/**
 * StatusBadge - Displays status with neon styling
 * 
 * @param {Object} props
 * @param {string} props.status - Status value ("active", "offline", "delayed")
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export const StatusBadge = ({ status = 'offline', className = '' }) => {
  const statusConfig = {
    active: {
      bg: 'bg-cyber-neon/10',
      border: 'border-cyber-neon/50',
      text: 'text-cyber-neon',
      pulse: 'animate-pulse-neon',
    },
    offline: {
      bg: 'bg-gray-900/20',
      border: 'border-gray-700/30',
      text: 'text-gray-400',
      pulse: '',
    },
    delayed: {
      bg: 'bg-warning-color/10',
      border: 'border-warning-color/50',
      text: 'text-warning-color',
      pulse: 'animate-pulse',
    },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <span
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-sm border
        font-mono text-xs font-semibold uppercase tracking-wider
        ${config.bg} ${config.border} ${config.text} ${config.pulse}
        ${className}
      `}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          status === 'active' ? 'bg-cyber-neon' : status === 'delayed' ? 'bg-warning-color' : 'bg-gray-500'
        }`}
      />
      {status}
    </span>
  );
};

export default StatusBadge;
