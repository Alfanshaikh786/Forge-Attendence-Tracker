import React from 'react';
import { clsx } from 'clsx';

export const EmptyState = ({ icon: Icon, heading, subtext, action, className }) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in', className)}>
      <div className="w-16 h-16 bg-surface-inset rounded-2xl flex items-center justify-center text-fg-tertiary mb-4 border border-border-subtle shadow-inner">
        {Icon && <Icon size={32} strokeWidth={1.5} />}
      </div>
      
      <h3 className="text-xl font-semibold text-fg-primary mb-2">
        {heading}
      </h3>
      
      <p className="text-sm text-fg-secondary max-w-xs mx-auto mb-6">
        {subtext}
      </p>
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
