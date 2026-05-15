import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const HeatmapGrid = ({ data = [], month, year, onMonthChange }) => {
  const days = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
  const [visibleCells, setVisibleCells] = useState(0);

  useEffect(() => {
    setVisibleCells(0);
    // reveal more slowly so layout doesn't jump and animation is visible
    const interval = setInterval(() => {
      setVisibleCells((prev) => {
        if (prev >= data.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 3;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-tertiary">
          Attendance Heatmap
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={() => onMonthChange?.(-1)}
            className="p-1 hover:bg-surface-raised rounded-md transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-mono text-fg-secondary">
            {month} {year}
          </span>
          <button
            onClick={() => onMonthChange?.(1)}
            className="p-1 hover:bg-surface-raised rounded-md transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day} className="flex items-center justify-center text-[10px] font-bold text-fg-tertiary uppercase w-6 h-6 sm:w-7 sm:h-7">
            {day}
          </div>
        ))}

        {data.map((day, idx) => {
          const isVisible = idx < visibleCells;
          const statusStyles = {
            present: 'bg-success/20 border border-success/30',
            absent: 'bg-danger/20 border border-danger/30',
            none: 'bg-surface-raised border border-border-subtle',
            future: 'bg-surface-inset border border-border-subtle opacity-30',
            pad: 'bg-transparent border-transparent',
          };

          const title = day.status && day.status !== 'pad' ? `${day.date}: ${day.status}` : undefined;

          return (
            <div
              key={day.date || idx}
              title={title}
              aria-hidden={day.status === 'pad' ? 'true' : 'false'}
              className={clsx(
                'rounded-sm transition-all duration-300 transform w-6 h-6 sm:w-7 sm:h-7',
                statusStyles[day.status] || statusStyles.none,
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

export default HeatmapGrid;
