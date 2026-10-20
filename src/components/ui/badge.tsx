import * as React from 'react';
import type { DrugClass } from '@/lib/types/database';
import { DRUG_CLASSES } from '@/lib/constants';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
}

export function Badge({
  className = '',
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    primary: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    outline: 'bg-transparent text-zinc-700 border-zinc-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function DrugClassBadge({ drugClass }: { drugClass: DrugClass }) {
  const styles: Record<DrugClass, { bg: string; text: string; dot: string }> = {
    bebas: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    bebas_terbatas: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    keras: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700 font-semibold',
      dot: 'bg-red-600',
    },
    psikotropika: {
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700 font-semibold',
      dot: 'bg-purple-600',
    },
    narkotika: {
      bg: 'bg-zinc-900 border-zinc-800',
      text: 'text-white font-bold',
      dot: 'bg-red-500',
    },
    alkes: {
      bg: 'bg-zinc-100 border-zinc-200',
      text: 'text-zinc-700',
      dot: 'bg-zinc-400',
    },
    suplemen: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
    },
  };

  const style = styles[drugClass] || styles.bebas;
  const label = DRUG_CLASSES[drugClass] || drugClass;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${style.bg} ${style.text}`}
      title={label}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
