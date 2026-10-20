'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative z-50 w-full max-h-[90vh] flex flex-col">{children}</div>
    </div>
  );
}

export function DialogContent({
  className = '',
  children,
  onClose,
  maxWidth = 'max-w-lg',
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
  maxWidth?: string;
}) {
  return (
    <div
      className={`mx-auto w-full ${maxWidth} bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 rounded-md p-1 hover:bg-zinc-100 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`p-6 pb-4 border-b border-zinc-100 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className={`text-lg font-semibold text-zinc-900 leading-tight ${className}`}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={`text-sm text-zinc-500 mt-1 ${className}`}>{children}</p>;
}

export function DialogBody({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`p-6 overflow-y-auto ${className}`}>{children}</div>;
}

export function DialogFooter({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-end gap-2 p-4 px-6 border-t border-zinc-100 bg-zinc-50/70 ${className}`}
    >
      {children}
    </div>
  );
}
