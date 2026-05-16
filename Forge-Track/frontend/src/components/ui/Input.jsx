import React, { useState } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  error,
  type = 'text',
  hint,
  className,
  containerClassName,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={clsx('flex flex-col gap-1.5 w-full', containerClassName)}>
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      
      <div className="relative group">
        <input
          type={inputType}
          className={clsx(
            'w-full rounded-lg px-4 py-3 outline-none transition-all duration-200',
            isPassword && 'pr-12',
            className
          )}
          style={{
            backgroundColor: '#1A1A25',
            color: 'var(--text-primary)',
            border: error ? '1px solid #F43F5E' : '1px solid rgba(255, 255, 255, 0.08)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? '#F43F5E' : 'var(--accent-primary)';
            e.target.style.boxShadow = error ? '0 0 0 3px rgba(244, 63, 94, 0.15)' : '0 0 0 3px rgba(108, 99, 255, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#F43F5E' : 'rgba(255, 255, 255, 0.08)';
            e.target.style.boxShadow = 'none';
          }}
          placeholder={props.placeholder}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {showPassword ? (
              <EyeOff size={20} strokeWidth={1.75} />
            ) : (
              <Eye size={20} strokeWidth={1.75} />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs mt-1 flex gap-1 items-center" style={{ color: '#F43F5E' }}>
          <AlertCircle size={14} strokeWidth={1.75} />
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{hint}</p>
      )}
    </div>
  );
};

export default Input;
