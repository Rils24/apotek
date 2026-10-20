import * as React from 'react';
import { getStockValueReport } from '@/server/actions/reports';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DrugClassBadge } from '@/components/ui/badge';
import { Boxes, DollarSign, Calendar } from 'lucide-react';
import { formatRupiah, formatNumber, formatDate } from '@/lib/format';

export default async function StockReportPage() {
  const data = await getStockValueReport();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Laporan Stok & Nilai Persediaan Obat
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Valuasi aset persediaan apotek berdasarkan harga pokok perolehan (HPP) per nomor batch.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Valuasi Nilai Persediaan
          </span>
          <p className="text-2xl font-bold text-teal-800 mt-1">
            {formatRupiah(data.totalInventoryValue)}
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">Aset lancar obat di rak</span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Unit Fisik Obat
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {formatNumber(data.totalStockUnits)}
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">Dalam satuan dasar</span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Jumlah Batch Aktif
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {formatNumber(data.batchCount)}
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">Batch terdaftar</span>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Valuasi Stok per Batch</CardTitle>
          <CardDescription>
            Nilai aset dihitung otomatis dari (Stok Fisik Tersisa x Harga Beli Pokok).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Obat</TableHead>
                <TableHead>Golongan</TableHead>
                <TableHead>No. Batch</TableHead>
                <TableHead>Kadaluarsa</TableHead>
                <TableHead className="text-right">Stok Fisik</TableHead>
                <TableHead className="text-right">HPP Satuan</TableHead>
                <TableHead className="text-right">Total Nilai Aset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.batches.map((b: any) => {
                const itemTotalValue = b.current_stock * b.buy_price;

                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-semibold text-zinc-900 text-xs">
                      {b.product?.name || 'Obat'}
                    </TableCell>

                    <TableCell>
                      {b.product?.drug_class && (
                        <DrugClassBadge drugClass={b.product.drug_class} />
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-bold text-zinc-700">
                      {b.batch_number}
                    </TableCell>

                    <TableCell className="text-xs text-zinc-600">
                      {formatDate(b.expiry_date)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs tabular-nums text-zinc-800">
                      {formatNumber(b.current_stock)}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-zinc-600">
                      {formatRupiah(b.buy_price)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs tabular-nums text-teal-800">
                      {formatRupiah(itemTotalValue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
