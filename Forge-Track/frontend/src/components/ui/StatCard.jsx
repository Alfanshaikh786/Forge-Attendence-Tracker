import React, { useEffect, useRef } from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { animateCounter } from '../../utils/cursorAnimation';

export const StatCard = ({ label, value, delta, deltaType = 'up', icon: Icon }) => {
  const valueRef = useRef(null);

  useEffect(() => {
    if (valueRef.current && !isNaN(parseInt(value))) {
      animateCounter(valueRef.current, parseInt(value), 1200);
    }
  }, [value]);

  return (
    <div 
      className="stat-card data-animate"
      style={{
        borderRadius: '20px',
        background: 'var(--card-surface)',
        border: '1px solid var(--border-accent)',
        padding: '28px',
        boxShadow: 'inset 0 -1px 0 0 rgba(108, 99, 255, 0.5)',
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-aurora-text-secondary">
          {label}
        </span>
        {Icon && <Icon className="text-aurora-text-secondary" size={18} strokeWidth={1.75} />}
      </div>
      
      <div className="flex items-baseline gap-3">
        <h3 
          ref={valueRef}
          className="font-display font-bold text-aurora-text tabular-nums tracking-tight"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '36px',
            fontWeight: 700,
          }}
        >
          {value}
        </h3>
        
        {delta && (
          <div className={clsx(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
            deltaType === 'up' ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
          )}>
            {deltaType === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {delta}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
