import * as React from 'react';
import Link from 'next/link';
import { getPurchases, getSuppliers } from '@/server/actions/purchases';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Plus, Eye, Truck, CheckCircle2, Clock } from 'lucide-react';
import { formatRupiah, formatDateShort, formatNumber } from '@/lib/format';
import { PURCHASE_STATUSES } from '@/lib/constants';

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; supplier?: string }>;
}) {
  const params = await searchParams;
  const [purchases, suppliers] = await Promise.all([
    getPurchases({
      status: params.status,
      supplierId: params.supplier,
    }),
    getSuppliers(),
  ]);

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaidAmount = purchases.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalDebtAmount = Math.max(0, totalPurchasesAmount - totalPaidAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Pembelian Obat & Faktur PBF
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola pesanan pembelian (PO), penerimaan barang ke gudang, dan pelunasan hutang tempo.
          </p>
        </div>

        <Link href="/purchases/new">
          <Button className="shadow-xs font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Buat PO Baru
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Pembelian
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {formatRupiah(totalPurchasesAmount)}
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">{purchases.length} faktur tercatat</span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
            Sudah Terbayar
          </span>
          <p className="text-2xl font-bold text-emerald-800 mt-1">
            {formatRupiah(totalPaidAmount)}
          </p>
          <span className="text-xs text-emerald-700/80 mt-1 block">Lunas ke supplier</span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
            Sisa Hutang Usaha
          </span>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {formatRupiah(totalDebtAmount)}
          </p>
          <span className="text-xs text-amber-700/80 mt-1 block">Jatuh tempo berjalan</span>
        </Card>
      </div>

      {/* Purchases Table Card */}
      <Card>
        <CardContent className="p-0">
          {purchases.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Truck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada faktur pembelian yang dibuat.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. PO / Faktur</TableHead>
                  <TableHead>Supplier / PBF</TableHead>
                  <TableHead>Tgl Pesan</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Total Faktur</TableHead>
                  <TableHead className="text-right">Sisa Hutang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => {
                  const debt = Math.max(0, p.total_amount - p.paid_amount);

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold text-zinc-900 text-xs">
                        {p.purchase_number}
                        {p.invoice_number && (
                          <span className="block text-[10px] text-zinc-500 font-sans font-normal">
                            Faktur: {p.invoice_number}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="font-semibold text-zinc-800 text-xs">
                        {p.supplier?.name || 'PBF'}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-600">
                        {formatDateShort(p.purchase_date)}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-600">
                        {p.due_date ? formatDateShort(p.due_date) : '-'}
                      </TableCell>

                      <TableCell className="text-right font-bold text-xs tabular-nums text-zinc-900">
                        {formatRupiah(p.total_amount)}
                      </TableCell>

                      <TableCell className="text-right font-semibold text-xs tabular-nums">
                        {debt === 0 ? (
                          <span className="text-emerald-700">Lunas</span>
                        ) : (
                          <span className="text-red-600">{formatRupiah(debt)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            p.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'received'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : p.status === 'partial'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          {PURCHASE_STATUSES[p.status as keyof typeof PURCHASE_STATUSES] || p.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/purchases/${p.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1" /> Rincian
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
