'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { voidSaleAction, getSaleById } from '@/server/actions/sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ReceiptDialog } from '@/components/features/pos/receipt-dialog';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';
import { formatRupiah, formatDateTime, formatDateShort } from '@/lib/format';
import { PAYMENT_METHODS } from '@/lib/constants';
import { toast } from 'sonner';

interface TransactionsClientProps {
  sales: any[];
  isOwner: boolean;
}

export function TransactionsClient({ sales, isOwner }: TransactionsClientProps) {
  const router = useRouter();
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Void modal state
  const [voidSaleTarget, setVoidSaleTarget] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isPending, startTransition] = useTransition();

  // Receipt modal state
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleOpenDetail = async (sale: any) => {
    setIsDetailLoading(true);
    const detail = await getSaleById(sale.id);
    setSelectedSale(detail || sale);
    setIsDetailLoading(false);
  };

  const handleOpenReprint = async (sale: any) => {
    const detail = await getSaleById(sale.id);
    if (!detail) return;

    setReceiptData({
      saleNumber: detail.sale_number,
      createdAt: detail.created_at,
      cashierName: detail.cashier?.full_name || 'Kasir',
      items: detail.items?.map((it: any) => ({
        name: it.product_name_snapshot,
        unitName: it.unit_name_snapshot,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        discountAmount: it.discount_amount,
        subtotal: it.subtotal,
      })) || [],
      subtotal: detail.subtotal,
      discountAmount: detail.discount_amount,
      taxAmount: detail.tax_amount,
      totalAmount: detail.total_amount,
      payments: detail.payments?.map((p: any) => ({
        paymentMethod: p.payment_method,
        amount: p.amount,
        changeAmount: p.change_amount,
      })) || [],
      prescriptionDoctor: detail.prescription_doctor,
      prescriptionNumber: detail.prescription_number,
    });
  };

  const handleVoidSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidSaleTarget) return;

    if (!voidReason.trim() || voidReason.trim().length < 5) {
      toast.error('Alasan void wajib minimal 5 karakter!');
      return;
    }

    startTransition(async () => {
      const res = await voidSaleAction(voidSaleTarget.id, voidReason);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Transaksi ${voidSaleTarget.sale_number} berhasil dibatalkan (void)`);
        setVoidSaleTarget(null);
        setVoidReason('');
        setSelectedSale(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Riwayat Transaksi Penjualan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Daftar lengkap nota kasir, cetak ulang struk, dan otorisasi pembatalan (void).
          </p>
        </div>
      </div>

      {/* Sales Table Card */}
      <Card>
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Receipt className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada transaksi penjualan yang tercatat.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Transaksi</TableHead>
                  <TableHead>Waktu (WIB)</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead className="text-right">Total Transaksi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const isVoided = sale.status === 'voided';
                  const primaryPayment = sale.payments?.[0];

                  return (
                    <TableRow key={sale.id} className={isVoided ? 'bg-zinc-50 opacity-70' : ''}>
                      <TableCell className="font-mono font-bold text-zinc-900 text-xs">
                        {sale.sale_number}
                        {sale.prescription_doctor && (
                          <span className="block text-[10px] text-zinc-500 font-sans font-normal">
                            Resep: dr. {sale.prescription_doctor}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-600 whitespace-nowrap">
                        {formatDateTime(sale.created_at)}
                      </TableCell>

                      <TableCell className="text-xs font-medium text-zinc-800">
                        {sale.cashier?.full_name || 'Kasir'}
                      </TableCell>

                      <TableCell className="text-xs">
                        {primaryPayment ? (
                          <span className="capitalize font-semibold text-zinc-700">
                            {PAYMENT_METHODS[primaryPayment.payment_method as keyof typeof PAYMENT_METHODS] || primaryPayment.payment_method}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>

                      <TableCell className="text-right font-bold tabular-nums text-sm">
                        <span className={isVoided ? 'line-through text-zinc-400' : 'text-zinc-900'}>
                          {formatRupiah(sale.total_amount)}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isVoided ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-500" /> Voided
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(sale)}
                            className="h-8 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Detail
                          </Button>

                          {!isVoided && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReprint(sale)}
                              className="h-8 text-xs text-teal-700 hover:bg-teal-50"
                              title="Cetak ulang struk"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {!isVoided && isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setVoidSaleTarget(sale);
                                setVoidReason('');
                              }}
                              className="h-8 text-xs text-red-600 hover:bg-red-50"
                              title="Batalkan transaksi (Void)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sale Detail Modal */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent maxWidth="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Detail Transaksi {selectedSale?.sale_number}</DialogTitle>
                <DialogDescription>
                  Waktu: {selectedSale && formatDateTime(selectedSale.created_at)} • Kasir: {selectedSale?.cashier?.full_name || 'Kasir'}
                </DialogDescription>
              </div>
              <div>
                {selectedSale?.status === 'voided' ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold">
                    Transaksi Dibatalkan (VOID)
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Lunas
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedSale?.status === 'voided' && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Alasan Void: {selectedSale.void_reason}
                </p>
                <p className="text-red-700">
                  Dibatalkan pada {formatDateTime(selectedSale.voided_at)} oleh {selectedSale.voided_by_profile?.full_name || 'Pemilik'}. Stok fisik telah dikembalikan ke batch semula.
                </p>
              </div>
            )}

            {/* Items list */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Rincian Obat Terjual
              </h4>
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Obat</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale?.items?.map((it: any) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-semibold text-zinc-900 text-xs">
                          {it.product_name_snapshot}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {it.quantity} {it.unit_name_snapshot}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatRupiah(it.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs tabular-nums">
                          {formatRupiah(it.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals and prescription */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                <p className="font-bold text-zinc-700 mb-1">Informasi Resep & Catatan</p>
                <p>Dokter: {selectedSale?.prescription_doctor || '-'}</p>
                <p>No. Resep: {selectedSale?.prescription_number || '-'}</p>
                <p>Catatan: {selectedSale?.notes || '-'}</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1 text-right">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal:</span>
                  <span>{formatRupiah(selectedSale?.subtotal || 0)}</span>
                </div>
                {selectedSale?.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedSale.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1 border-t border-zinc-200">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(selectedSale?.total_amount || 0)}</span>
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
              Tutup
            </Button>
            {selectedSale?.status !== 'voided' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenReprint(selectedSale)}
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Cetak Struk
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Konfirmasi Void Transaksi */}
      <Dialog open={!!voidSaleTarget} onOpenChange={(open) => !open && setVoidSaleTarget(null)}>
        <DialogContent onClose={() => setVoidSaleTarget(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle>Konfirmasi Pembatalan Transaksi (Void)</DialogTitle>
                <DialogDescription>
                  Nota: <strong>{voidSaleTarget?.sale_number}</strong> (Total: {formatRupiah(voidSaleTarget?.total_amount || 0)})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleVoidSale}>
            <DialogBody className="space-y-4">
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <p className="font-bold">Perhatian Otorisasi Pemilik:</p>
                <p>
                  Tindakan ini akan mengembalikan stok seluruh obat dalam transaksi ke batch aslinya secara atomik dan mencatat riwayat pembatalan pada kartu stok & log audit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Alasan Pembatalan (Wajib Minimal 5 Karakter) *
                </label>
                <Input
                  placeholder="Contoh: Pasien keliru memberikan resep obat, uang telah dikembalikan penuh"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  required
                  minLength={5}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVoidSaleTarget(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive" isLoading={isPending} className="font-bold">
                Batalkan & Kembalikan Stok
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        onNewTransaction={() => setReceiptData(null)}
        saleData={receiptData}
      />
    </div>
  );
}
