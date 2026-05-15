import React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export const StepIndicator = ({ steps = [], currentStep = 0 }) => {
  return (
    <div className="flex items-center w-full max-w-3xl mx-auto px-4 py-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center relative group">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 z-10',
                  isCompleted && 'bg-success/20 border-success/40 text-success',
                  isActive && 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]',
                  !isCompleted && !isActive && 'bg-surface-raised border-border-default text-fg-tertiary'
                )}
              >
                {isCompleted ? (
                  <Check size={20} strokeWidth={2.5} />
                ) : (
                  <span className="font-bold text-sm">{index + 1}</span>
                )}
              </div>
              
              <span
                className={clsx(
                  'absolute -bottom-7 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300',
                  isActive ? 'text-fg-primary' : 'text-fg-tertiary'
                )}
              >
                {step}
              </span>
            </div>

            {!isLast && (
              <div
                className={clsx(
                  'flex-1 h-px transition-all duration-500 mx-2',
                  isCompleted ? 'bg-success/40' : 'bg-border-default'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
