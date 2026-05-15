import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export const ProgressBar = ({ progress = 0, className, height = 'h-2' }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.min(100, Math.max(0, progress)));
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={clsx('w-full bg-surface-inset rounded-full overflow-hidden border border-border-subtle', height, className)}>
      <div
        className="h-full bg-accent transition-[width] duration-700 ease-out rounded-full"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export default ProgressBar;
