import * as React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, icon, type, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={`flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
            icon ? 'pl-9' : ''
          } ${
            error
              ? 'border-red-500 focus-visible:outline-red-500'
              : 'border-zinc-300 hover:border-zinc-400'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
