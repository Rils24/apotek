'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Banknote,
  QrCode,
  CreditCard,
  Building,
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import type { PaymentMethod } from '@/lib/types/database';
import type { CheckoutPaymentPayload } from '@/server/actions/sales';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  grandTotal: number;
  hasControlledDrugs: boolean;
  isSubmitting: boolean;
  doctorName: string;
  setDoctorName: (val: string) => void;
  prescriptionNo: string;
  setPrescriptionNo: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  onSubmit: (payments: CheckoutPaymentPayload[]) => void;
}

export function PaymentDialog({
  open,
  onClose,
  grandTotal,
  hasControlledDrugs,
  isSubmitting,
  doctorName,
  setDoctorName,
  prescriptionNo,
  setPrescriptionNo,
  notes,
  setNotes,
  onSubmit,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(grandTotal);
  const [isSplit, setIsSplit] = useState(false);
  const [splitMethod, setSplitMethod] = useState<PaymentMethod>('qris');
  const [splitAmount, setSplitAmount] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setCashGiven(grandTotal);
      setIsSplit(false);
      setSplitAmount(0);
    }
  }, [open, grandTotal]);

  const changeAmount = selectedMethod === 'cash' ? Math.max(0, cashGiven - grandTotal) : 0;
  const isCashInsufficient = selectedMethod === 'cash' && !isSplit && cashGiven < grandTotal;

  // Split payment calculations
  const remainingForSplit = isSplit ? Math.max(0, grandTotal - cashGiven) : 0;

  const handleQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  const handleExactCash = () => {
    setCashGiven(grandTotal);
  };

  const handleNextMultiple = (multiple: number) => {
    const nextAmount = Math.ceil(grandTotal / multiple) * multiple;
    setCashGiven(nextAmount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasControlledDrugs && (!doctorName.trim() || !prescriptionNo.trim())) {
      alert('Nama dokter dan nomor resep wajib diisi untuk obat keras/psikotropika/narkotika!');
      return;
    }

    if (isSplit) {
      if (cashGiven + splitAmount < grandTotal) {
        alert('Total pembayaran split kurang dari total belanja');
        return;
      }
      onSubmit([
        {
          payment_method: 'cash',
          amount: cashGiven,
          change_amount: 0,
        },
        {
          payment_method: splitMethod,
          amount: splitAmount,
          change_amount: 0,
        },
      ]);
    } else {
      if (isCashInsufficient) {
        alert('Nominal uang tunai yang diberikan kurang dari total belanja');
        return;
      }

      onSubmit([
        {
          payment_method: selectedMethod,
          amount: selectedMethod === 'cash' ? cashGiven : grandTotal,
          change_amount: changeAmount,
        },
      ]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Pembayaran Kasir</DialogTitle>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              POS Apotek
            </span>
          </div>
          <DialogDescription>
            Pilih metode pembayaran dan konfirmasi data resep jika diperlukan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-5">
            {/* Grand Total Display */}
            <div className="p-4 rounded-xl bg-teal-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-teal-300 font-semibold">
                  Total Tagihan
                </p>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
                  {formatRupiah(grandTotal)}
                </p>
              </div>
              {hasControlledDrugs && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/20 text-red-200 border border-red-500/30 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Wajib Resep
                  </span>
                </div>
              )}
            </div>

            {/* Controlled drugs warning & prescription fields */}
            {hasControlledDrugs && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Obat Resep / Keras / Narkotika Terdeteksi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Nama Dokter Pembuat Resep *
                    </label>
                    <Input
                      placeholder="dr. Ahmad Sp.A"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Nomor Lembar Resep *
                    </label>
                    <Input
                      placeholder="RSP-2026-0042"
                      value={prescriptionNo}
                      onChange={(e) => setPrescriptionNo(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Tabs */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('cash');
                    setIsSplit(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedMethod === 'cash' && !isSplit
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1.5 text-emerald-600" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('qris');
                    setIsSplit(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedMethod === 'qris' && !isSplit
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1.5 text-teal-600" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('transfer');
                    setIsSplit(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedMethod === 'transfer' && !isSplit
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Building className="w-5 h-5 mb-1.5 text-blue-600" />
                  <span>Transfer Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('debit');
                    setIsSplit(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    selectedMethod === 'debit' && !isSplit
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1.5 text-purple-600" />
                  <span>Kartu Debit</span>
                </button>
              </div>
            </div>

            {/* Cash Input Details */}
            {selectedMethod === 'cash' && !isSplit && (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Uang Diterima dari Pasien
                  </label>
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    Uang Pas [Esc]
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-zinc-300 bg-white text-lg font-bold text-zinc-900 focus-visible:outline-teal-500 tabular-nums shadow-xs"
                    placeholder="0"
                    autoFocus
                  />
                </div>

                {/* Quick amount shortcuts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleNextMultiple(10000)}
                    className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
                  >
                    +10 rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextMultiple(20000)}
                    className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
                  >
                    +20 rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextMultiple(50000)}
                    className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
                  >
                    +50 rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextMultiple(100000)}
                    className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
                  >
                    +100 rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(50000)}
                    className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(100000)}
                    className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
                  >
                    100.000
                  </button>
                </div>

                {/* Change display */}
                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-600">Kembalian:</span>
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      isCashInsufficient ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {isCashInsufficient ? 'Uang Masih Kurang' : formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Non-cash notice */}
            {selectedMethod !== 'cash' && !isSplit && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Pembayaran Non-Tunai ({formatRupiah(grandTotal)})
                </p>
                <p className="text-teal-700">
                  Pastikan pembayaran melalui {selectedMethod.toUpperCase()} telah berhasil terverifikasi pada mesin EDC / QRIS soundbox sebelum menyelesaikan pesanan.
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Catatan Transaksi (Opsional)
              </label>
              <Input
                placeholder="Contoh: Pasien minta copy resep, aturan minum 3x1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal [Esc]
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isCashInsufficient}
              className="font-bold shadow-xs min-w-[160px]"
            >
              Bayar & Cetak [F4]
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
