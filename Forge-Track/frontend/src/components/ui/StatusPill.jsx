import React from 'react';
import clsx from 'clsx';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export const StatusPill = ({ status = 'info', className, label }) => {
  const map = (s) => {
    if (!s && s !== 0) return 'info';
    const raw = String(s).toLowerCase();
    const synonyms = {
      success: 'present',
      danger: 'absent',
      present: 'present',
      absent: 'absent',
      warn: 'warning',
      warning: 'warning',
      info: 'info',
    };
    return synonyms[raw] ?? 'info';
  };

  const key = map(status);

  const styles = {
    present: 'bg-success/20 text-success border-success/30',
    absent: 'bg-danger/20 text-danger border-danger/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    info: 'bg-info/20 text-info border-info/30',
  };

  const icons = {
    present: Check,
    absent: X,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[key] ?? Info;

  return (
    <span
      className={clsx(
        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest inline-flex items-center gap-1.5 border',
        styles[key],
        className
      )}
    >
      {Icon ? <Icon size={12} strokeWidth={2.5} /> : null}
      {label ?? key}
    </span>
  );
};

export default StatusPill;
