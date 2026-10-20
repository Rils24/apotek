import * as React from 'react';
import Link from 'next/link';
import { getBatches } from '@/server/actions/inventory';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Boxes, FileText } from 'lucide-react';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';

export default async function ExpiryReportPage() {
  const batches = await getBatches();
  const now = new Date();
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDays = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const expiredList: any[] = [];
  const criticalList: any[] = [];
  const warningList: any[] = [];
  const noticeList: any[] = [];

  batches.forEach((b: any) => {
    if (!b.current_stock || b.current_stock <= 0) return;
    const exp = new Date(b.expiry_date);
    if (exp <= now) {
      expiredList.push(b);
    } else if (exp <= thirtyDays) {
      criticalList.push(b);
    } else if (exp <= sixtyDays) {
      warningList.push(b);
    } else if (exp <= ninetyDays) {
      noticeList.push(b);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Laporan Kedaluwarsa Obat (FEFO Early Warning)
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Peringatan dini masa simpan obat untuk pencegahan kerugian dan kepatuhan standar BPOM.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-red-50 border-red-200">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block">
            Sudah Kedaluwarsa
          </span>
          <p className="text-2xl font-bold text-red-700 mt-1">{expiredList.length} Batch</p>
          <span className="text-xs text-red-600 mt-0.5 block">Wajib ditarik dari rak</span>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
            Kritis (&lt; 30 Hari)
          </span>
          <p className="text-2xl font-bold text-amber-800 mt-1">{criticalList.length} Batch</p>
          <span className="text-xs text-amber-700 mt-0.5 block">Prioritas FEFO di kasir</span>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wider block">
            Peringatan (30-60 Hari)
          </span>
          <p className="text-2xl font-bold text-yellow-800 mt-1">{warningList.length} Batch</p>
          <span className="text-xs text-yellow-700 mt-0.5 block">Pertimbangkan retur PBF</span>
        </Card>

        <Card className="p-4 bg-zinc-50 border-zinc-200">
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider block">
            Perhatian (60-90 Hari)
          </span>
          <p className="text-2xl font-bold text-zinc-800 mt-1">{noticeList.length} Batch</p>
          <span className="text-xs text-zinc-500 mt-0.5 block">Monitor rotasi stok</span>
        </Card>
      </div>

      {/* Expired List Table */}
      {expiredList.length > 0 && (
        <Card className="border-red-300">
          <CardHeader className="bg-red-50/60 border-b border-red-200">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Obat Sudah Kedaluwarsa (Karantina / Musnahkan)
            </CardTitle>
            <CardDescription className="text-red-700">
              Obat-obat berikut sudah melewati batas tanggal kedaluwarsa dan tidak boleh dijual ke pasien.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>No. Batch</TableHead>
                  <TableHead>Tanggal Kadaluarsa</TableHead>
                  <TableHead className="text-right">Sisa Stok Fisik</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredList.map((b: any) => (
                  <TableRow key={b.id} className="bg-red-50/20">
                    <TableCell className="font-semibold text-red-900 text-xs">
                      {b.product?.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-red-700">
                      {b.batch_number}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-red-600">
                      {formatDate(b.expiry_date)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs tabular-nums text-red-700">
                      {formatNumber(b.current_stock)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/inventory/adjustments">
                        <Button variant="outline" size="sm" className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50">
                          Koreksi Stok Rusak
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Critical & Warning List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Obat Mendekati Masa Kadaluarsa (&lt; 90 Hari)</CardTitle>
          <CardDescription>
            Urutan batch FEFO yang harus dihabiskan terlebih dahulu saat transaksi kasir.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {[...criticalList, ...warningList, ...noticeList].length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Tidak ada obat yang mendekati masa kedaluwarsa dalam 90 hari ke depan.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>No. Batch</TableHead>
                  <TableHead>Tgl Kadaluarsa</TableHead>
                  <TableHead>Kategori Waktu</TableHead>
                  <TableHead className="text-right">Sisa Stok Fisik</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...criticalList, ...warningList, ...noticeList].map((b: any) => {
                  const exp = new Date(b.expiry_date);
                  const isCrit = exp <= thirtyDays;
                  const isWarn = !isCrit && exp <= sixtyDays;

                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold text-zinc-900 text-xs">
                        {b.product?.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-zinc-700">
                        {b.batch_number}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(b.expiry_date)}
                      </TableCell>
                      <TableCell>
                        {isCrit ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                            &lt; 30 Hari
                          </span>
                        ) : isWarn ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            30-60 Hari
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-800 font-medium border border-yellow-200">
                            60-90 Hari
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs tabular-nums text-zinc-800">
                        {formatNumber(b.current_stock)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/inventory/stock-card?productId=${b.product_id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-700">
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
