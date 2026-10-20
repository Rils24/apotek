'use client';

import * as React from 'react';
import { Menu, LogOut, ShoppingCart, Clock, User, Shield } from 'lucide-react';
import { signOut } from '@/server/actions/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDateIndonesian } from '@/lib/format';

interface TopbarProps {
  userName: string;
  userRole: 'owner' | 'cashier';
  onMenuToggle: () => void;
  shiftStatus?: {
    isOpen: boolean;
    openedAt?: string;
  };
}

export function Topbar({
  userName,
  userRole,
  onMenuToggle,
  shiftStatus = { isOpen: false },
}: TopbarProps) {
  const [currentDate, setCurrentDate] = React.useState('');

  React.useEffect(() => {
    const now = new Date();
    setCurrentDate(formatDateIndonesian(now));
  }, []);

  return (
    <header className="h-16 bg-white border-b border-zinc-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Hamburger & pharmacy header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 md:hidden cursor-pointer"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Apotek Sehat Farma
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {currentDate || 'WIB'}
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Shift badge, POS shortcut, and user logout */}
      <div className="flex items-center gap-3">
        {/* Shift status badge */}
        <div className="hidden md:flex items-center">
          {shiftStatus.isOpen ? (
            <Badge variant="success" className="py-1 px-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Shift Kasir Aktif
            </Badge>
          ) : (
            <Badge variant="neutral" className="py-1 px-3 text-zinc-500">
              Shift Belum Dibuka
            </Badge>
          )}
        </div>

        {/* Quick POS shortcut */}
        <Link href="/pos">
          <Button size="sm" variant="primary" className="hidden sm:inline-flex shadow-xs">
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir POS</span>
          </Button>
        </Link>

        {/* Role badge */}
        <Badge
          variant={userRole === 'owner' ? 'primary' : 'neutral'}
          className="hidden lg:inline-flex capitalize font-semibold"
        >
          {userRole === 'owner' ? (
            <>
              <Shield className="w-3 h-3 text-teal-600 mr-1" /> Pemilik
            </>
          ) : (
            <>
              <User className="w-3 h-3 text-zinc-600 mr-1" /> Kasir
            </>
          )}
        </Badge>

        {/* Logout action */}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-red-600 hover:bg-red-50 text-xs gap-1.5"
            title="Keluar dari sistem"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
