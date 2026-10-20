'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import type { UserRole } from '@/lib/types/database';

interface AppShellProps {
  userRole: UserRole;
  userName: string;
  shiftStatus?: {
    isOpen: boolean;
    openedAt?: string;
  };
  children: React.ReactNode;
}

export function AppShell({
  userRole,
  userName,
  shiftStatus,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar navigation */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Topbar
          userRole={userRole}
          userName={userName}
          shiftStatus={shiftStatus}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
