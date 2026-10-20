import * as React from 'react';
import { getSalesReport } from '@/server/actions/reports';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Download, Printer } from 'lucide-react';
import { formatRupiah, formatDateTime, formatNumber } from '@/lib/format';

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const sales = await getSalesReport(params.start, params.end);

  const completedSales = sales.filter((s: any) => s.status === 'completed');
  const totalOmzet = completedSales.reduce((sum: number, s: any) => sum + s.total_amount, 0);
  const totalDiscount = completedSales.reduce((sum: number, s: any) => sum + s.discount_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Laporan Rekapitulasi Penjualan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Riwayat pendapatan omzet kasir per periode transaksi.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Omzet Penjualan
          </span>
          <p className="text-2xl font-bold text-teal-800 mt-1">{formatRupiah(totalOmzet)}</p>
          <span className="text-xs text-zinc-400 mt-1 block">
            {completedSales.length} transaksi selesai
          </span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Rata-rata Nota Belanja (Basket Size)
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {completedSales.length > 0
              ? formatRupiah(Math.round(totalOmzet / completedSales.length))
              : 'Rp 0'}
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">Per transaksi pasien</span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Potongan Diskon
          </span>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatRupiah(totalDiscount)}</p>
          <span className="text-xs text-zinc-400 mt-1 block">Diskon promosi & nota</span>
        </Card>
      </div>

      {/* Sales Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Nota Penjualan</CardTitle>
          <CardDescription>Rincian setiap transaksi yang tercatat di kasir.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Nota</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead>Metode Bayar</TableHead>
                <TableHead className="text-right">Total Transaksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedSales.map((s: any) => (
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
                  <TableCell className="text-xs text-zinc-600">
                    {s.items?.length || 0} macam obat
                  </TableCell>
                  <TableCell className="text-xs capitalize font-semibold text-zinc-700">
                    {s.payments?.[0]?.payment_method || 'Tunai'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs tabular-nums text-zinc-900">
                    {formatRupiah(s.total_amount)}
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
