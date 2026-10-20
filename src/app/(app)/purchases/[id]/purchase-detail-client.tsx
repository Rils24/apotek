'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { receivePurchaseAction, payPurchaseAction } from '@/server/actions/purchases';
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
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Wallet,
  Clock,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import { formatRupiah, formatDate, formatDateShort } from '@/lib/format';
import { PURCHASE_STATUSES } from '@/lib/constants';
import { toast } from 'sonner';
import type { PurchasePaymentMethod } from '@/lib/types/database';

interface PurchaseDetailClientProps {
  purchase: any;
  isOwner: boolean;
}

export function PurchaseDetailClient({
  purchase,
  isOwner,
}: PurchaseDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Payment modal state
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(
    Math.max(0, purchase.total_amount - purchase.paid_amount)
  );
  const [payMethod, setPayMethod] = useState<PurchasePaymentMethod>('transfer');
  const [payNotes, setPayNotes] = useState('');

  const debt = Math.max(0, purchase.total_amount - purchase.paid_amount);

  const handleReceiveGoods = () => {
    if (!confirm('Apakah Anda yakin barang fisik dari PBF telah tiba dan sesuai faktur?')) {
      return;
    }

    startTransition(async () => {
      const res = await receivePurchaseAction(purchase.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Barang berhasil diterima! Batch dan stok telah ditambahkan ke sistem.');
        router.refresh();
      }
    });
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      toast.error('Nominal pembayaran harus lebih besar dari 0');
      return;
    }

    startTransition(async () => {
      const res = await payPurchaseAction({
        purchaseId: purchase.id,
        amount: payAmount,
        paymentMethod: payMethod,
        notes: payNotes,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Pembayaran berhasil dicatat!');
        setIsPayOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/purchases">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {purchase.purchase_number}
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  purchase.status === 'paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : purchase.status === 'received'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : purchase.status === 'partial'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {PURCHASE_STATUSES[purchase.status as keyof typeof PURCHASE_STATUSES] || purchase.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              PBF: {purchase.supplier?.name} • Tgl: {formatDate(purchase.purchase_date)}
            </p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-2">
          {purchase.status === 'draft' && isOwner && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isPending}
              onClick={handleReceiveGoods}
              className="font-semibold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Terima Barang ke Gudang
            </Button>
          )}

          {purchase.status !== 'draft' && debt > 0 && isOwner && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPayAmount(debt);
                setIsPayOpen(true);
              }}
              className="font-semibold shadow-xs"
            >
              <Wallet className="w-4 h-4 mr-1.5" />
              Bayar Hutang ({formatRupiah(debt)})
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Tagihan Faktur
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {formatRupiah(purchase.total_amount)}
          </p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
            Sudah Dibayar
          </span>
          <p className="text-2xl font-bold text-emerald-800 mt-1">
            {formatRupiah(purchase.paid_amount)}
          </p>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
            Sisa Hutang Usaha
          </span>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {formatRupiah(debt)}
          </p>
        </Card>
      </div>

      {/* Supplier & metadata card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Supplier & Kontak</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block">Nama PBF / Pabrikan:</span>
            <span className="font-bold text-zinc-900 text-sm mt-0.5 block">
              {purchase.supplier?.name}
            </span>
            <span className="text-zinc-500">{purchase.supplier?.address || '-'}</span>
          </div>

          <div>
            <span className="text-zinc-500 block">Kontak Person & Telepon:</span>
            <span className="font-semibold text-zinc-800 mt-0.5 block">
              {purchase.supplier?.contact_person || '-'}
            </span>
            <span className="text-zinc-600 font-mono">{purchase.supplier?.phone || '-'}</span>
          </div>

          <div>
            <span className="text-zinc-500 block">Jatuh Tempo Pembayaran:</span>
            <span className="font-bold text-zinc-900 mt-0.5 block">
              {purchase.due_date ? formatDate(purchase.due_date) : 'Langsung Lunas'}
            </span>
            {purchase.invoice_number && (
              <span className="text-zinc-500 block">Faktur No: {purchase.invoice_number}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items list table */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Obat Dipesan</CardTitle>
          <CardDescription>
            {purchase.status === 'draft'
              ? 'Barang belum masuk ke stok fisik. Klik "Terima Barang" saat pesanan tiba.'
              : 'Barang telah diterima dan stok otomatis masuk ke inventori.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Obat</TableHead>
                <TableHead>No. Batch</TableHead>
                <TableHead>Kadaluarsa</TableHead>
                <TableHead className="text-right">Kuantitas</TableHead>
                <TableHead className="text-right">Harga Beli</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items?.map((it: any) => (
                <TableRow key={it.id}>
                  <TableCell className="font-semibold text-zinc-900 text-xs">
                    {it.product?.name || 'Obat'}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-zinc-700">
                    {it.batch_number}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600">
                    {formatDate(it.expiry_date)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs tabular-nums">
                    {it.quantity}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {formatRupiah(it.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs tabular-nums">
                    {formatRupiah(it.total_price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments history */}
      {purchase.payments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran Hutang</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead>Catatan / Bukti</TableHead>
                  <TableHead>Dicatat Oleh</TableHead>
                  <TableHead className="text-right">Nominal Bayar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.payments.map((pm: any) => (
                  <TableRow key={pm.id}>
                    <TableCell className="text-xs text-zinc-600">
                      {formatDateShort(pm.payment_date)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold capitalize">
                      {pm.payment_method}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600">
                      {pm.notes || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {pm.created_by_profile?.full_name || 'Staf'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-700 tabular-nums">
                      {formatRupiah(pm.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal: Catat Pembayaran */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent onClose={() => setIsPayOpen(false)}>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran Hutang Supplier</DialogTitle>
            <DialogDescription>
              Faktur: {purchase.purchase_number} • Sisa Hutang: {formatRupiah(debt)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePay}>
            <DialogBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nominal Pembayaran (Rp) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max={debt}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Metode Pembayaran *
                </label>
                <Select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PurchasePaymentMethod)}
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai (Kas Keluar)</option>
                  <option value="giro">Bilyet Giro</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Catatan / No. Referensi Transfer
                </label>
                <Input
                  placeholder="Contoh: Bukti transfer BCA ref #04921"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isPending} className="font-bold">
                Konfirmasi Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
