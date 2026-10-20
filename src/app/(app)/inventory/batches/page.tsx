import * as React from 'react';
import Link from 'next/link';
import { getBatches } from '@/server/actions/inventory';
import { getProducts } from '@/server/actions/products';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DrugClassBadge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Boxes, Search, FileText } from 'lucide-react';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [batches, products] = await Promise.all([
    getBatches(params.productId),
    getProducts(),
  ]);

  const now = new Date();
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDays = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const filteredBatches = batches.filter((b: any) => {
    const exp = new Date(b.expiry_date);
    if (params.status === 'expired') return exp <= now;
    if (params.status === 'critical') return exp > now && exp <= thirtyDays;
    if (params.status === 'warning') return exp > thirtyDays && exp <= sixtyDays;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Manajemen Batch & Kedaluwarsa Obat (FEFO)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pantau nomor batch, tanggal kadaluarsa, dan stok per batch secara terperinci.
          </p>
        </div>
        <Link href="/inventory/opname">
          <Button variant="outline" className="shadow-xs">
            Mulai Stok Opname
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <select
              name="productId"
              defaultValue={params.productId || ''}
              className="w-full h-9 px-3 rounded-md border border-zinc-300 bg-white text-sm focus-visible:outline-teal-500 text-zinc-700"
            >
              <option value="">Semua Obat</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <select
              name="status"
              defaultValue={params.status || ''}
              className="w-full h-9 px-3 rounded-md border border-zinc-300 bg-white text-sm focus-visible:outline-teal-500 text-zinc-700"
            >
              <option value="">Semua Status Kadaluarsa</option>
              <option value="critical">&lt; 30 Hari (Kritis)</option>
              <option value="warning">30 - 60 Hari (Peringatan)</option>
              <option value="expired">Sudah Kadaluarsa</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" className="w-full">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Batches Table Card */}
      <Card>
        <CardContent className="p-0">
          {filteredBatches.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Boxes className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Tidak ada batch yang sesuai kriteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Golongan</TableHead>
                  <TableHead>No. Batch</TableHead>
                  <TableHead>Tgl Kadaluarsa</TableHead>
                  <TableHead className="text-right">Harga Beli (HPP)</TableHead>
                  <TableHead className="text-right">Sisa Stok Fisik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((b: any) => {
                  const exp = new Date(b.expiry_date);
                  const isExpired = exp <= now;
                  const isCritical = !isExpired && exp <= thirtyDays;
                  const isWarning = !isExpired && exp > thirtyDays && exp <= sixtyDays;

                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold text-zinc-900">
                        <Link
                          href={`/products/${b.product_id}`}
                          className="hover:text-teal-700 hover:underline"
                        >
                          {b.product?.name || 'Obat'}
                        </Link>
                      </TableCell>

                      <TableCell>
                        {b.product?.drug_class && (
                          <DrugClassBadge drugClass={b.product.drug_class} />
                        )}
                      </TableCell>

                      <TableCell className="font-mono font-bold text-zinc-800 text-xs">
                        {b.batch_number}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span
                            className={
                              isExpired
                                ? 'text-red-600 font-bold'
                                : isCritical
                                ? 'text-red-700 font-bold'
                                : isWarning
                                ? 'text-amber-700 font-semibold'
                                : 'text-zinc-700'
                            }
                          >
                            {formatDate(b.expiry_date)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-zinc-600">
                        {formatRupiah(b.buy_price)}
                      </TableCell>

                      <TableCell className="text-right font-bold tabular-nums">
                        {formatNumber(b.current_stock)}
                      </TableCell>

                      <TableCell>
                        {isExpired ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                            Kadaluarsa
                          </span>
                        ) : isCritical ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                            &lt; 30 Hari
                          </span>
                        ) : isWarning ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            Segera
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            Aman
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/inventory/stock-card?productId=${b.product_id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-teal-700">
                            <FileText className="w-3.5 h-3.5 mr-1" /> Kartu
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
