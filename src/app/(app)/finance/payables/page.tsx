import * as React from 'react';
import Link from 'next/link';
import { getPurchases } from '@/server/actions/purchases';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wallet, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatRupiah, formatDate, formatDateShort } from '@/lib/format';

export default async function PayablesPage() {
  const purchases = await getPurchases();

  // Filter only purchases with remaining debt
  const unpaidPurchases = purchases
    .map((p) => ({
      ...p,
      debt: Math.max(0, p.total_amount - p.paid_amount),
    }))
    .filter((p) => p.debt > 0)
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const totalOutstanding = unpaidPurchases.reduce((sum, p) => sum + p.debt, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Daftar Hutang Usaha Supplier (Faktur Tempo)
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Kewajiban pelunasan faktur pembelian obat ke PBF diurutkan berdasarkan tanggal jatuh tempo.
        </p>
      </div>

      {/* Summary banner */}
      <div className="p-5 rounded-xl bg-amber-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-amber-300 block">
            Total Sisa Hutang Usaha Apotek
          </span>
          <p className="text-3xl font-bold text-white tabular-nums mt-0.5">
            {formatRupiah(totalOutstanding)}
          </p>
          <span className="text-xs text-amber-200 mt-1 block">
            Tersebar di {unpaidPurchases.length} faktur supplier aktif
          </span>
        </div>

        <Link href="/purchases">
          <Button variant="secondary" className="shadow-xs font-semibold">
            Lihat Semua Pembelian PO
          </Button>
        </Link>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {unpaidPurchases.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Wallet className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-700">Semua hutang faktur lunas!</p>
              <p className="text-xs text-zinc-400 mt-0.5">Tidak ada tagihan yang belum dibayar saat ini.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faktur / PO</TableHead>
                  <TableHead>Supplier / PBF</TableHead>
                  <TableHead>Tgl Pembelian</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Total Faktur</TableHead>
                  <TableHead className="text-right">Sudah Dibayar</TableHead>
                  <TableHead className="text-right">Sisa Tagihan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidPurchases.map((p) => {
                  const isOverdue = p.due_date && new Date(p.due_date) < new Date();

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold text-xs text-zinc-900">
                        {p.purchase_number}
                      </TableCell>

                      <TableCell className="font-semibold text-xs text-zinc-800">
                        {p.supplier?.name}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-600">
                        {formatDateShort(p.purchase_date)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span className={isOverdue ? 'text-red-600 font-bold' : 'text-zinc-700'}>
                            {p.due_date ? formatDate(p.due_date) : '-'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums text-zinc-600">
                        {formatRupiah(p.total_amount)}
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums text-emerald-700 font-medium">
                        {formatRupiah(p.paid_amount)}
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums font-bold text-red-600">
                        {formatRupiah(p.debt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/purchases/${p.id}`}>
                          <Button size="sm" variant="primary" className="h-8 text-xs font-semibold">
                            Bayar <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
