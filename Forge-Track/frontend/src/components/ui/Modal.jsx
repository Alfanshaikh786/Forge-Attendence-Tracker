import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, className }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 py-16 sm:py-24 overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-sm">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-opacity duration-300"
        onClick={() => onClose?.()}
      />
      
      {/* Modal Box */}
      <div className={clsx(
        'relative bg-surface-raised rounded-2xl border border-border-strong w-full shadow-2xl animate-slide-up overflow-hidden my-auto',
        className || 'max-w-md'
      )}>
        <div className="absolute inset-0 bg-card-shine pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-border-subtle">
          <h2 className="text-xl font-display font-semibold text-fg-primary">
            {title}
          </h2>
          <button
            onClick={() => onClose?.()}
            className="p-1 hover:bg-surface border border-transparent hover:border-border-subtle rounded-md transition-all text-fg-tertiary hover:text-fg-primary"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
        
        {/* Body */}
        <div className="relative p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="relative p-6 border-t border-border-subtle bg-surface/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
