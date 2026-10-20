import * as React from 'react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={`flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat pr-8 ${
            error
              ? 'border-red-500 focus-visible:outline-red-500'
              : 'border-zinc-300 hover:border-zinc-400'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
