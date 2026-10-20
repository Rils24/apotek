import * as React from 'react';
import { getProfitLoss } from '@/server/actions/finance';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { formatRupiah, formatNumber } from '@/lib/format';

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const pl = await getProfitLoss(params.start, params.end);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Laporan Laba Rugi Apotek (P&L)
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Ikhtisar pendapatan penjualan, harga pokok penjualan (HPP), biaya operasional, dan margin laba bersih.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Pendapatan Bersih
          </span>
          <p className="text-xl font-bold text-zinc-900 mt-1">{formatRupiah(pl.totalRevenue)}</p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            HPP (Modal Obat)
          </span>
          <p className="text-xl font-bold text-zinc-700 mt-1">{formatRupiah(pl.totalHpp)}</p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider block">
            Laba Kotor (Gross)
          </span>
          <p className="text-xl font-bold text-teal-800 mt-1">{formatRupiah(pl.grossProfit)}</p>
          <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
            Margin: {pl.grossMarginPercent}%
          </span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
            Laba Bersih (Net)
          </span>
          <p
            className={`text-xl font-bold mt-1 ${
              pl.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatRupiah(pl.netProfit)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Margin: {pl.netMarginPercent}%
          </span>
        </Card>
      </div>

      {/* Income Statement Detailed Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Laporan Laba Rugi</CardTitle>
          <CardDescription>
            Standar perhitungan laba komprehensif ritel farmasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {/* Section 1: Revenue */}
              <TableRow className="bg-zinc-50/75">
                <TableCell className="font-bold text-zinc-900 text-sm">
                  1. PENDAPATAN OPERASIONAL
                </TableCell>
                <TableCell className="text-right font-bold text-zinc-900 text-sm">
                  {formatRupiah(pl.totalRevenue)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8 text-xs text-zinc-600">
                  Penjualan Kasir POS (Selesai)
                </TableCell>
                <TableCell className="text-right text-xs text-zinc-800 tabular-nums">
                  {formatRupiah(pl.totalRevenue)}
                </TableCell>
              </TableRow>

              {/* Section 2: COGS */}
              <TableRow className="bg-zinc-50/75">
                <TableCell className="font-bold text-zinc-900 text-sm">
                  2. HARGA POKOK PENJUALAN (HPP)
                </TableCell>
                <TableCell className="text-right font-bold text-red-600 text-sm">
                  ({formatRupiah(pl.totalHpp)})
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8 text-xs text-zinc-600">
                  Modal Pokok Obat Terjual (Batch FEFO)
                </TableCell>
                <TableCell className="text-right text-xs text-red-600 tabular-nums">
                  -{formatRupiah(pl.totalHpp)}
                </TableCell>
              </TableRow>

              {/* Gross Profit Subtotal */}
              <TableRow className="bg-teal-50/60 font-bold border-y-2 border-teal-200">
                <TableCell className="text-teal-900">
                  LABA KOTOR (GROSS PROFIT)
                </TableCell>
                <TableCell className="text-right text-teal-900 text-base tabular-nums">
                  {formatRupiah(pl.grossProfit)}
                </TableCell>
              </TableRow>

              {/* Section 3: Operating Expenses */}
              <TableRow className="bg-zinc-50/75">
                <TableCell className="font-bold text-zinc-900 text-sm">
                  3. BEBAN OPERASIONAL USAHA
                </TableCell>
                <TableCell className="text-right font-bold text-red-600 text-sm">
                  ({formatRupiah(pl.totalExpenses)})
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8 text-xs text-zinc-600">
                  Biaya Rutin (Listrik, Sewa, Gaji Staf, Perlengkapan)
                </TableCell>
                <TableCell className="text-right text-xs text-red-600 tabular-nums">
                  -{formatRupiah(pl.totalExpenses)}
                </TableCell>
              </TableRow>

              {/* Net Profit Final */}
              <TableRow className="bg-zinc-900 text-white font-bold text-base">
                <TableCell className="text-white">
                  LABA BERSIH PERIODE (NET PROFIT)
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums text-lg ${
                    pl.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatRupiah(pl.netProfit)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
