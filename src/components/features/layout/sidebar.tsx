'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Pill,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  FileClock,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  AlertTriangle,
  History,
  TrendingDown,
  Users,
} from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

interface SidebarProps {
  userRole: UserRole;
  userName: string;
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  badge?: string;
  children?: { title: string; href: string; ownerOnly?: boolean }[];
}

export function Sidebar({ userRole, userName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    inventory: pathname.startsWith('/inventory'),
    finance: pathname.startsWith('/finance'),
    reports: pathname.startsWith('/reports'),
    settings: pathname.startsWith('/settings'),
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems: (NavItem & { sectionKey?: string })[] = [
    {
      title: 'POS / Kasir',
      href: '/pos',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      title: 'Katalog Produk',
      href: '/products',
      icon: <Package className="w-4 h-4" />,
    },
    {
      title: 'Riwayat Transaksi',
      href: '/transactions',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      title: 'Inventori & Stok',
      href: '/inventory',
      icon: <Boxes className="w-4 h-4" />,
      ownerOnly: true,
      sectionKey: 'inventory',
      children: [
        { title: 'Batch Obat', href: '/inventory/batches' },
        { title: 'Stok Opname', href: '/inventory/opname' },
        { title: 'Penyesuaian Stok', href: '/inventory/adjustments' },
        { title: 'Kartu Stok', href: '/inventory/stock-card' },
      ],
    },
    {
      title: 'Pembelian (PO)',
      href: '/purchases',
      icon: <TrendingDown className="w-4 h-4" />,
      ownerOnly: true,
    },
    {
      title: 'PBF / Supplier',
      href: '/suppliers',
      icon: <Truck className="w-4 h-4" />,
      ownerOnly: true,
    },
    {
      title: 'Keuangan',
      href: '/finance',
      icon: <Wallet className="w-4 h-4" />,
      ownerOnly: true,
      sectionKey: 'finance',
      children: [
        { title: 'Arus Kas', href: '/finance/cash-flow' },
        { title: 'Laba Rugi', href: '/finance/profit-loss' },
        { title: 'Hutang Pembelian', href: '/finance/payables' },
      ],
    },
    {
      title: 'Laporan',
      href: '/reports',
      icon: <BarChart3 className="w-4 h-4" />,
      ownerOnly: true,
      sectionKey: 'reports',
      children: [
        { title: 'Laporan Penjualan', href: '/reports/sales' },
        { title: 'Laporan Stok & Nilai', href: '/reports/stock' },
        { title: 'Laporan Kadaluarsa', href: '/reports/expiry' },
        { title: 'Narkotika & Psikotropika', href: '/reports/narcotics' },
      ],
    },
    {
      title: 'Pengaturan',
      href: '/settings',
      icon: <Settings className="w-4 h-4" />,
      ownerOnly: true,
      sectionKey: 'settings',
      children: [
        { title: 'Informasi Apotek', href: '/settings/pharmacy' },
        { title: 'Kelola Akun Kasir', href: '/settings/users' },
        { title: 'Format Struk', href: '/settings/receipt' },
      ],
    },
    {
      title: 'Log Aktivitas',
      href: '/audit-log',
      icon: <FileClock className="w-4 h-4" />,
      ownerOnly: true,
    },
  ];

  const filteredItems = navItems.filter((item) => {
    if (userRole === 'cashier' && item.ownerOnly) return false;
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo brand */}
        <div className="h-16 px-5 border-b border-zinc-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-900 block leading-tight">
                ApoTech
              </span>
              <span className="text-[11px] text-teal-700 font-medium">Sistem Apotek</span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Menu Utama
          </div>

          {filteredItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isSectionOpen = item.sectionKey ? openSections[item.sectionKey] : false;
            const isActive =
              pathname === item.href ||
              (hasChildren && item.children?.some((c) => pathname === c.href));

            if (hasChildren) {
              return (
                <div key={item.title} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => item.sectionKey && toggleSection(item.sectionKey)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-900'
                        : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-teal-600' : 'text-zinc-500'}>
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    {isSectionOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>

                  {isSectionOpen && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              isChildActive
                                ? 'bg-teal-600 text-white font-semibold'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                            }`}
                          >
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      pathname === item.href ? 'text-white' : 'text-zinc-500'
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-700 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User profile info bar */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50/75">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 truncate">{userName}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                {userRole === 'owner' ? 'Pemilik Apotek' : 'Kasir Farmasi'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
