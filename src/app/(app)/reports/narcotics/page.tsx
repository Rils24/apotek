import * as React from 'react';
import { getNarcoticsReport } from '@/server/actions/reports';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DrugClassBadge } from '@/components/ui/badge';
import { ShieldAlert, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';

export default async function NarcoticsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const items = await getNarcoticsReport(params.start, params.end);

  const narkotikaCount = items.filter((i: any) => i.product?.drug_class === 'narkotika').length;
  const psikotropikaCount = items.filter((i: any) => i.product?.drug_class === 'psikotropika').length;
  const kerasCount = items.filter((i: any) => i.product?.drug_class === 'keras').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Laporan Obat Resep, Psikotropika & Narkotika
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
              Standar SIPNAP Kemenkes
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Buku register pelayanan obat dengan resep dokter sesuai regulasi Permenkes No. 3 Tahun 2015.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-zinc-900 text-white">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Narkotika Terjual
          </span>
          <p className="text-2xl font-bold text-white mt-1">{narkotikaCount} Transaksi</p>
          <span className="text-xs text-red-400 font-semibold mt-0.5 block">Pengawasan Khusus</span>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">
            Psikotropika Terjual
          </span>
          <p className="text-2xl font-bold text-purple-900 mt-1">{psikotropikaCount} Transaksi</p>
          <span className="text-xs text-purple-700 font-medium mt-0.5 block">Wajib Resep Asli</span>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block">
            Obat Keras (Daftar G) Terjual
          </span>
          <p className="text-2xl font-bold text-red-900 mt-1">{kerasCount} Transaksi</p>
          <span className="text-xs text-red-700 font-medium mt-0.5 block">Antibiotik & Kardiovaskular</span>
        </Card>
      </div>

      {/* Register Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Buku Register Pelayanan Resep</CardTitle>
          <CardDescription>
            Data audit untuk laporan berkala SIPNAP kepada Suku Dinas Kesehatan dan BPOM.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada transaksi obat resep terdaftar pada periode ini.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu Pelayanan</TableHead>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Golongan</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>No. Batch</TableHead>
                  <TableHead>Nama Dokter</TableHead>
                  <TableHead>No. Resep</TableHead>
                  <TableHead>Kasir / Petugas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell className="text-xs text-zinc-600 whitespace-nowrap">
                      {formatDateTime(it.created_at)}
                    </TableCell>

                    <TableCell className="font-semibold text-zinc-900 text-xs">
                      {it.product_name_snapshot}
                    </TableCell>

                    <TableCell>
                      {it.product?.drug_class && (
                        <DrugClassBadge drugClass={it.product.drug_class} />
                      )}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs tabular-nums text-zinc-900">
                      {it.quantity} {it.unit_name_snapshot}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-zinc-700">
                      {it.batch?.batch_number || '-'}
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-zinc-800">
                      dr. {it.sale?.prescription_doctor || '-'}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-zinc-600">
                      {it.sale?.prescription_number || '-'}
                    </TableCell>

                    <TableCell className="text-xs text-zinc-500">
                      {it.sale?.cashier?.full_name || 'Kasir'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
