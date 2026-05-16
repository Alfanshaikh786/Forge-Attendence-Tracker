import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * CyberMetric - An animated metrics card with counting effect
 * 
 * @param {Object} props
 * @param {string} props.label - Metric label (e.g., "Total Users")
 * @param {number} props.value - The value to display
 * @param {string} props.unit - Optional unit (e.g., "%", "ms")
 * @param {string} props.status - Status indicator ("active", "offline", "delayed")
 * @param {string} props.trend - Optional trend indicator (e.g., "+5%", "-2%")
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export const CyberMetric = ({
  label,
  value,
  unit = '',
  status = 'active',
  trend,
  className = '',
}) => {
  const valueRef = useRef(null);
  const trendRef = useRef(null);

  // Color mapping for status
  const statusColors = {
    active: 'text-cyber-neon',
    offline: 'text-gray-500',
    delayed: 'text-warning-color',
  };

  const statusBadgeColors = {
    active: 'bg-cyber-neon/10 border-cyber-neon/30 text-cyber-neon',
    offline: 'bg-gray-900/20 border-gray-700/30 text-gray-400',
    delayed: 'bg-warning-color/10 border-warning-color/30 text-warning-color',
  };

  useEffect(() => {
    if (!valueRef.current || typeof value !== 'number') return;

    // Count-up animation
    const startValue = 0;
    const endValue = value;
    const duration = 1.2;

    gsap.to(
      { count: startValue },
      {
        count: endValue,
        duration,
        ease: 'power2.out',
        onUpdate: function () {
          valueRef.current.textContent = Math.round(this.targets()[0].count)
            .toLocaleString('en-US');
        },
      }
    );

    // Trend animation (if present)
    if (trendRef.current) {
      gsap.fromTo(
        trendRef.current,
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2 }
      );
    }
  }, [value]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono text-cyber-text-secondary uppercase tracking-wide">
          {label}
        </span>
        <span className={`text-xs px-2 py-1 rounded-sm border font-mono ${statusBadgeColors[status]}`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span
          ref={valueRef}
          className={`text-4xl font-mono font-bold ${statusColors[status]} tabular-nums`}
        >
          0
        </span>
        {unit && (
          <span className="text-lg font-mono text-cyber-text-secondary">
            {unit}
          </span>
        )}
      </div>

      {trend && (
        <div
          ref={trendRef}
          className={`text-xs font-mono ${
            trend.startsWith('+')
              ? 'text-cyber-neon'
              : 'text-danger-color'
          }`}
        >
          {trend}
        </div>
      )}
    </div>
  );
};

export default CyberMetric;
