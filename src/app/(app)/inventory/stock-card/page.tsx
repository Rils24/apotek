import * as React from 'react';
import Link from 'next/link';
import { getStockCard } from '@/server/actions/inventory';
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
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import { formatDateTime, formatNumber } from '@/lib/format';
import { MOVEMENT_TYPES } from '@/lib/constants';

export default async function StockCardPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts();
  const selectedProductId = params.productId || products[0]?.id;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const movements = selectedProductId ? await getStockCard(selectedProductId) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Kartu Stok Obat
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Buku besar mutasi fisik obat per transaksi (Standar BPOM & Akuntansi Farmasi).
          </p>
        </div>

        <Link href="/inventory/batches">
          <Button variant="outline" size="sm">
            Lihat Batch Obat
          </Button>
        </Link>
      </div>

      {/* Product Selector Card */}
      <Card className="p-4 bg-white border-zinc-200">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              Pilih Obat yang Ingin Dilihat
            </label>
            <select
              name="productId"
              defaultValue={selectedProductId}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm focus-visible:outline-teal-500 font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.total_stock} {p.defaultUnit?.unit_name})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto self-end">
            <Button type="submit" variant="primary" className="w-full sm:w-auto h-10">
              Buka Kartu Stok
            </Button>
          </div>
        </form>
      </Card>

      {/* Selected Product Overview */}
      {selectedProduct && (
        <div className="p-4 rounded-xl bg-teal-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 block">
              Kartu Stok Obat
            </span>
            <h2 className="text-xl font-bold text-white">{selectedProduct.name}</h2>
            <p className="text-xs text-teal-200 mt-0.5">
              Generik: {selectedProduct.generic_name || '-'} • SKU: {selectedProduct.sku || '-'} • Rak: {selectedProduct.shelf_location || '-'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-teal-300 block">Saldo Akhir Fisik</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatNumber(selectedProduct.total_stock || 0)} {selectedProduct.defaultUnit?.unit_name}
            </span>
          </div>
        </div>
      )}

      {/* Stock movements ledger table */}
      <Card>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada riwayat pergerakan stok untuk obat ini.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu (WIB)</TableHead>
                  <TableHead>Jenis Mutasi</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Perubahan Qty</TableHead>
                  <TableHead className="text-right">Sebelum</TableHead>
                  <TableHead className="text-right font-bold">Sesudah</TableHead>
                  <TableHead>Keterangan / Alasan</TableHead>
                  <TableHead>Petugas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m: any) => {
                  const isPositive = m.quantity > 0;
                  const typeLabel = MOVEMENT_TYPES[m.movement_type as keyof typeof MOVEMENT_TYPES] || m.movement_type;

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-zinc-600 whitespace-nowrap">
                        {formatDateTime(m.created_at)}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold ${
                            m.movement_type === 'sale'
                              ? 'bg-blue-50 text-blue-700'
                              : m.movement_type === 'purchase'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.movement_type === 'void'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-red-600" />
                          )}
                          {typeLabel}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-zinc-700">
                        {m.batch?.batch_number || '-'}
                      </TableCell>

                      <TableCell
                        className={`text-right font-bold tabular-nums text-sm ${
                          isPositive ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? `+${formatNumber(m.quantity)}` : formatNumber(m.quantity)}
                      </TableCell>

                      <TableCell className="text-right text-xs text-zinc-500 tabular-nums">
                        {formatNumber(m.stock_before)}
                      </TableCell>

                      <TableCell className="text-right font-bold text-xs text-zinc-900 tabular-nums">
                        {formatNumber(m.stock_after)}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-600 max-w-xs truncate">
                        {m.notes || m.reference_type || '-'}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-500">
                        {m.performed_by_profile?.full_name || 'Sistem'}
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
