'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { getCashTransactions, getExpenseCategories, createCashTransaction } from '@/server/actions/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { formatRupiah, formatDate, formatDateInput } from '@/lib/format';
import { toast } from 'sonner';
import type { CashFlowType } from '@/lib/types/database';

export default function CashFlowPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<CashFlowType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [txDate, setTxDate] = useState(formatDateInput(new Date()));

  const fetchData = async () => {
    setLoading(true);
    const [txs, cats] = await Promise.all([
      getCashTransactions(),
      getExpenseCategories(),
    ]);
    setTransactions(txs);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      toast.error('Nominal dan deskripsi transaksi wajib diisi!');
      return;
    }

    startTransition(async () => {
      const res = await createCashTransaction({
        type,
        expense_category_id: categoryId || undefined,
        amount,
        description,
        transaction_date: txDate,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Transaksi kas ${type === 'income' ? 'masuk' : 'keluar'} berhasil dicatat`
        );
        setIsModalOpen(false);
        setAmount(0);
        setDescription('');
        fetchData();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Arus Kas Operasional Apotek
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Buku kas masuk dan pengeluaran operasional (gaji, listrik, sewa tempat, ATK).
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="shadow-xs font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Catat Kas Masuk / Keluar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Total Kas Masuk
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{formatRupiah(totalIncome)}</p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Total Kas Keluar
            </span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700 mt-2">{formatRupiah(totalExpense)}</p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
              Saldo Arus Kas Bersih
            </span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <p
            className={`text-2xl font-bold mt-2 ${
              netCash >= 0 ? 'text-teal-800' : 'text-red-600'
            }`}
          >
            {formatRupiah(netCash)}
          </p>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400">Memuat mutasi kas...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Wallet className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada mutasi kas operasional yang tercatat.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi / Keperluan</TableHead>
                  <TableHead>Dicatat Oleh</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const isIncome = t.type === 'income';

                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-zinc-600 whitespace-nowrap">
                        {formatDate(t.transaction_date)}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-red-600" />
                          )}
                          {isIncome ? 'Kas Masuk' : 'Kas Keluar'}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-zinc-800">
                        {t.category?.name || 'Operasional'}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-700 font-medium">
                        {t.description}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-500">
                        {t.created_by_profile?.full_name || 'Pemilik'}
                      </TableCell>

                      <TableCell
                        className={`text-right font-bold text-xs tabular-nums ${
                          isIncome ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isIncome ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal: Catat Kas */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Catat Mutasi Kas Operasional</DialogTitle>
            <DialogDescription>
              Catat pengeluaran biaya rutin apotek atau penerimaan kas non-penjualan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    type === 'expense'
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  Kas Keluar (Biaya)
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  Kas Masuk (Pendapatan Lain)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Kategori Pengeluaran
                </label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Nominal (Rp) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Tanggal Transaksi *
                  </label>
                  <Input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Deskripsi / Keterangan Keperluan *
                </label>
                <Input
                  placeholder="Contoh: Tagihan listrik PLN bulan Oktober 2026"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isPending} className="font-bold">
                Simpan Transaksi Kas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
