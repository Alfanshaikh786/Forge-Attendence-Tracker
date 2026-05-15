import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  ...props
}) => {
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (variant === 'primary' && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      buttonRef.current.style.setProperty('--click-x', x + 'px');
      buttonRef.current.style.setProperty('--click-y', y + 'px');
    }

    props.onClick?.(e);
  };

  const variants = {
    primary: 'btn-primary',
    secondary: 'border border-aurora-text-secondary bg-transparent text-aurora-text hover:bg-aurora-surface',
    ghost: 'text-aurora-text-secondary hover:text-aurora-text hover:bg-aurora-surface',
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      ref={buttonRef}
      className={clsx(
        'font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-aurora-accent/50',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.75} />
      ) : (
        <>
          {Icon && <Icon size={20} strokeWidth={1.75} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
