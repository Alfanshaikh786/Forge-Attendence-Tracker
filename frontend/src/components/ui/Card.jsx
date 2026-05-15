import React from 'react';
import { clsx } from 'clsx';

export const Card = ({ children, className, hover = false, glow = false }) => {
  return (
    <div
      className={clsx(
        'rounded-xl border p-6 md:p-8 relative overflow-hidden',
        hover && 'hover:transition-colors duration-200 cursor-pointer',
        className
      )}
      style={{
        backgroundColor: 'var(--card-surface)',
        borderColor: 'var(--border-subtle)',
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 50%)',
      }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Card;
