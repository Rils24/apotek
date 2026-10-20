import * as React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      primary:
        'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm border border-transparent',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-200',
      outline:
        'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 shadow-xs',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent',
      ghost:
        'text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 border border-transparent',
      link:
        'text-teal-600 underline-offset-4 hover:underline p-0 border border-transparent',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-sm rounded-md gap-2',
      lg: 'h-11 px-6 text-base rounded-md gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-md',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
