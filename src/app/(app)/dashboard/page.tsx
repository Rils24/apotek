import * as React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/server/actions/auth';
import { getSales, getActiveShift } from '@/server/actions/sales';
import { getInventoryAlerts } from '@/server/actions/inventory';
import { getProfitLoss } from '@/server/actions/finance';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SalesTrendChart } from '@/components/features/dashboard/sales-trend-chart';
import {
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Clock,
  ArrowRight,
  ShieldCheck,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { formatRupiah, formatDateTime, formatNumber, formatDateShort } from '@/lib/format';

export default async function DashboardPage() {
  const [currentUser, sales, activeShift, alerts, pl] = await Promise.all([
    getCurrentUser(),
    getSales(),
    getActiveShift(),
    getInventoryAlerts(),
    getProfitLoss(),
  ]);

  const isOwner = currentUser?.role === 'owner';

  // Today's sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(
    (s: any) => s.created_at.startsWith(todayStr) && s.status === 'completed'
  );
  const todayRevenue = todaySales.reduce((sum: number, s: any) => sum + s.total_amount, 0);

  // Generate 7-day trend data
  const trendDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(
      (s: any) => s.created_at.startsWith(dayStr) && s.status === 'completed'
    );
    const dayTotal = daySales.reduce((sum: number, s: any) => sum + s.total_amount, 0);
    return {
      date: formatDateShort(dayStr),
      total: dayTotal,
      count: daySales.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome & Role banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Selamat Bertugas, {currentUser?.fullName || 'Pengguna'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200 capitalize">
              {isOwner ? 'Pemilik Apotek' : 'Kasir Apotek'}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {isOwner
              ? 'Pantau kesehatan keuangan apotek, perputaran stok obat, dan audit kasir.'
              : 'Layani penjualan pasien dan pantau shift kasir aktif Anda.'}
          </p>
        </div>

        <Link href="/pos">
          <Button variant="primary" size="lg" className="font-bold shadow-xs">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buka Kasir POS
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Penjualan Hari Ini
            </span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{formatRupiah(todayRevenue)}</p>
          <span className="text-xs text-zinc-400 mt-1 block">
            {todaySales.length} transaksi selesai
          </span>
        </Card>

        {isOwner ? (
          <>
            <Card className="p-4 bg-white border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  Laba Bersih Apotek
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {formatRupiah(pl.netProfit)}
              </p>
              <span className="text-xs text-emerald-700/80 mt-1 block">
                Margin Bersih: {pl.netMarginPercent}%
              </span>
            </Card>

            <Card className="p-4 bg-white border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Stok Di Bawah Batas
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {formatNumber(alerts.lowStock.length)} Obat
              </p>
              <Link href="/products?status=low" className="text-xs text-teal-700 hover:underline mt-1 block">
                Cek stok menipis &rarr;
              </Link>
            </Card>

            <Card className="p-4 bg-white border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                  Mendekati Kadaluarsa
                </span>
                <Clock className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {formatNumber(alerts.expiringBatches.length)} Batch
              </p>
              <Link href="/reports/expiry" className="text-xs text-teal-700 hover:underline mt-1 block">
                Lihat daftar FEFO &rarr;
              </Link>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-4 bg-white border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Status Shift Anda
                </span>
                <Clock className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-xl font-bold text-zinc-900 mt-1">
                {activeShift ? 'Shift Aktif' : 'Belum Buka Shift'}
              </p>
              <span className="text-xs text-zinc-400 mt-1 block">
                Modal: {formatRupiah(activeShift?.opening_cash || 0)}
              </span>
            </Card>

            <Card className="p-4 bg-white border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Katalog Obat Aktif
                </span>
                <Boxes className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-xl font-bold text-zinc-900 mt-1">Stok Tersedia</p>
              <Link href="/products" className="text-xs text-teal-700 hover:underline mt-1 block">
                Cek harga & stok obat &rarr;
              </Link>
            </Card>
          </>
        )}
      </div>

      {/* Owner Graph & Alerts Grid */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Revenue Chart (8 cols) */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tren Penjualan 7 Hari Terakhir</CardTitle>
                    <CardDescription>Grafik pergerakan omzet kasir apotek harian.</CardDescription>
                  </div>
                  <Link href="/reports/sales">
                    <Button variant="outline" size="sm" className="text-xs">
                      Laporan Lengkap
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <SalesTrendChart data={trendDays} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Action & Critical Alerts (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4">
              <h3 className="font-bold text-sm text-zinc-900 mb-2">Peringatan Penting Farmasi</h3>
              <div className="space-y-2 text-xs">
                {alerts.lowStock.slice(0, 3).map((p: any) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">{p.name}</p>
                      <span className="text-amber-800">
                        Sisa: {p.total_stock} (Min: {p.stock_minimum})
                      </span>
                    </div>
                    <Link href={`/purchases/new`}>
                      <span className="text-teal-700 font-semibold hover:underline">Pesan PO</span>
                    </Link>
                  </div>
                ))}

                {alerts.expiringBatches.slice(0, 2).map((b: any) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-lg bg-red-50/60 border border-red-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">{b.product?.name}</p>
                      <span className="text-red-700">Kadaluarsa: {formatDateShort(b.expiry_date)}</span>
                    </div>
                    <Link href={`/reports/expiry`}>
                      <span className="text-red-800 font-semibold hover:underline">Detail</span>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Links Card */}
            <Card className="p-4 bg-teal-900 text-white">
              <h3 className="font-bold text-sm text-teal-200 mb-1">Akses Cepat Pengelolaan</h3>
              <p className="text-xs text-teal-300/80 mb-3">Menu rutin manajerial apotek.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  href="/inventory/opname"
                  className="p-2 rounded bg-teal-800 hover:bg-teal-700 text-white font-medium text-center transition-colors"
                >
                  Stok Opname
                </Link>
                <Link
                  href="/purchases/new"
                  className="p-2 rounded bg-teal-800 hover:bg-teal-700 text-white font-medium text-center transition-colors"
                >
                  Order PO Obat
                </Link>
                <Link
                  href="/finance/cash-flow"
                  className="p-2 rounded bg-teal-800 hover:bg-teal-700 text-white font-medium text-center transition-colors"
                >
                  Catat Kas
                </Link>
                <Link
                  href="/settings/users"
                  className="p-2 rounded bg-teal-800 hover:bg-teal-700 text-white font-medium text-center transition-colors"
                >
                  Kelola Kasir
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Recent sales table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaksi Kasir Terbaru</CardTitle>
              <CardDescription>Daftar 10 transaksi terakhir yang dilayani kasir.</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="outline" size="sm" className="text-xs">
                Semua Transaksi <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Bukti</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Total Transaksi</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.slice(0, 8).map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-bold text-xs text-zinc-900">
                    {s.sale_number}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600">
                    {formatDateTime(s.created_at)}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-800 font-medium">
                    {s.cashier?.full_name || 'Kasir'}
                  </TableCell>
                  <TableCell className="text-xs capitalize font-semibold">
                    {s.payments?.[0]?.payment_method || 'Tunai'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs tabular-nums text-zinc-900">
                    {formatRupiah(s.total_amount)}
                  </TableCell>
                  <TableCell>
                    {s.status === 'completed' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Selesai
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                        Voided
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
