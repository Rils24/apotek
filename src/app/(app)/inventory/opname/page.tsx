'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { getBatches, submitStockOpname } from '@/server/actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ClipboardCheck, Search, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface OpnameRow {
  batchId: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  systemStock: number;
  physicalCount: number;
}

export default function StockOpnamePage() {
  const [rows, setRows] = useState<OpnameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [opnameNotes, setOpnameNotes] = useState('Stok Opname Rutin Bulanan');
  const [isPending, startTransition] = useTransition();

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await getBatches();
      const mapped = data.map((b: any) => ({
        batchId: b.id,
        productId: b.product_id,
        productName: b.product?.name || 'Obat',
        batchNumber: b.batch_number,
        expiryDate: b.expiry_date,
        systemStock: b.current_stock,
        physicalCount: b.current_stock, // default to system stock
      }));
      setRows(mapped);
    } catch {
      toast.error('Gagal memuat batch untuk opname');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handlePhysicalChange = (batchId: string, val: number) => {
    setRows((prev) =>
      prev.map((r) => (r.batchId === batchId ? { ...r, physicalCount: Math.max(0, val) } : r))
    );
  };

  const filteredRows = rows.filter(
    (r) =>
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  const changedRows = rows.filter((r) => r.physicalCount !== r.systemStock);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (changedRows.length === 0) {
      toast.info('Tidak ada selisih stok fisik vs sistem yang terdeteksi');
      return;
    }

    if (
      !confirm(
        `Terdapat ${changedRows.length} batch obat dengan selisih stok. Apakah Anda yakin ingin memproses penyesuaian stok opname ini?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const payload = changedRows.map((r) => ({
        product_id: r.productId,
        batch_id: r.batchId,
        physical_count: r.physicalCount,
      }));

      const res = await submitStockOpname(payload, opnameNotes);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Stok opname berhasil disesuaikan (${res.count} item)`);
        fetchBatches();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Stok Opname Fisik Apotek
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Bandingkan hitungan fisik di rak dengan data sistem untuk mendeteksi selisih barang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBatches} disabled={loading}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Batch Dihitung
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{rows.length}</p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
            Batch Berselisih
          </span>
          <p className="text-2xl font-bold text-amber-800 mt-1">{changedRows.length}</p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider block">
            Batch Cocok
          </span>
          <p className="text-2xl font-bold text-teal-800 mt-1">
            {rows.length - changedRows.length}
          </p>
        </Card>
      </div>

      {/* Opname Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Lembar Kerja Hitung Fisik</CardTitle>
              <CardDescription>
                Ketikkan angka hasil hitung fisik riil di kolom <strong>Hitung Fisik</strong>.
              </CardDescription>
            </div>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Cari obat / no. batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400">Memuat data opname...</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">Tidak ada obat yang cocok.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>No. Batch</TableHead>
                  <TableHead>Kadaluarsa</TableHead>
                  <TableHead className="text-right">Stok Sistem</TableHead>
                  <TableHead className="text-right w-36">Hitung Fisik</TableHead>
                  <TableHead className="text-right">Selisih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => {
                  const diff = r.physicalCount - r.systemStock;
                  const hasDiff = diff !== 0;

                  return (
                    <TableRow key={r.batchId} className={hasDiff ? 'bg-amber-50/40' : ''}>
                      <TableCell className="font-semibold text-zinc-900">
                        {r.productName}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-700 font-bold">
                        {r.batchNumber}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {formatDate(r.expiryDate)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-700 tabular-nums">
                        {formatNumber(r.systemStock)}
                      </TableCell>
                      <TableCell className="text-right">
                        <input
                          type="number"
                          min="0"
                          value={r.physicalCount}
                          onChange={(e) =>
                            handlePhysicalChange(r.batchId, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-24 h-8 px-2 text-right rounded border border-zinc-300 font-bold text-sm bg-white focus-visible:outline-teal-500 tabular-nums"
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {diff === 0 ? (
                          <span className="text-xs font-semibold text-emerald-600">Sesuai (0)</span>
                        ) : diff > 0 ? (
                          <span className="text-xs font-bold text-blue-600">+{diff} (Lebih)</span>
                        ) : (
                          <span className="text-xs font-bold text-red-600">{diff} (Kurang)</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/75 border-t border-zinc-100">
          <div className="w-full sm:w-1/2">
            <Input
              placeholder="Catatan opname (misal: Opname kuartal 4 oleh Tim A)"
              value={opnameNotes}
              onChange={(e) => setOpnameNotes(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={changedRows.length === 0}
            className="w-full sm:w-auto font-bold shadow-xs"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Simpan Hasil Opname ({changedRows.length} Selisih)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
