import React from 'react';
import { clsx } from 'clsx';

export const Avatar = ({ name = '?', size = 'md', className }) => {
  const getInitials = (n) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getColorByHash = (n) => {
    const colors = [
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-blue-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-violet-500',
      'bg-cyan-500',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[12px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-16 h-16 text-[20px]',
  };

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-lg',
        getColorByHash(name),
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
