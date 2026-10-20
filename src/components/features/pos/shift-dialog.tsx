'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
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
import { Clock, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { openShift, closeShiftAction } from '@/server/actions/sales';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

interface ShiftDialogProps {
  mode: 'open' | 'close';
  isOpen: boolean;
  onClose: () => void;
  activeShift?: {
    id: string;
    opening_cash: number;
    opened_at: string;
  } | null;
  onSuccess: () => void;
}

export function ShiftDialog({
  mode,
  isOpen,
  onClose,
  activeShift,
  onSuccess,
}: ShiftDialogProps) {
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [closeResult, setCloseResult] = useState<{
    system_cash: number;
    difference: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await openShift(cashAmount);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Shift kasir berhasil dibuka!');
        onSuccess();
        onClose();
      }
    });
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    startTransition(async () => {
      const res = await closeShiftAction(activeShift.id, cashAmount, notes);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Shift kasir berhasil ditutup!');
        setCloseResult(res.result || null);
        onSuccess();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>
                {mode === 'open' ? 'Buka Shift Kasir Baru' : 'Tutup Shift & Rekonsiliasi Kas'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'open'
                  ? 'Catat uang modal kembalian awal di laci kasir.'
                  : 'Hitung total uang fisik di laci untuk rekonsiliasi kas.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {closeResult ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
              <h3 className="font-bold text-base text-teal-900">Shift Berhasil Ditutup</h3>
              <p className="text-xs text-teal-700">Laporan penutupan kas telah tersimpan ke sistem.</p>
            </div>

            <div className="space-y-2 text-sm bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <div className="flex justify-between">
                <span className="text-zinc-600">Total Kas Sistem:</span>
                <span className="font-bold">{formatRupiah(closeResult.system_cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Uang Fisik Dihitung:</span>
                <span className="font-bold">{formatRupiah(cashAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200">
                <span className="font-semibold text-zinc-900">Selisih Kas:</span>
                <span
                  className={`font-bold ${
                    closeResult.difference === 0
                      ? 'text-emerald-600'
                      : closeResult.difference > 0
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}
                >
                  {closeResult.difference > 0 ? '+' : ''}
                  {formatRupiah(closeResult.difference)}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setCloseResult(null);
                onClose();
              }}
            >
              Selesai
            </Button>
          </div>
        ) : mode === 'open' ? (
          <form onSubmit={handleOpenShift}>
            <DialogBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Modal Kas Awal (Uang Kembalian)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 100000"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                    className="w-full h-11 pl-11 pr-4 rounded-lg border border-zinc-300 text-lg font-bold text-zinc-900 focus-visible:outline-teal-500 tabular-nums shadow-xs"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Jumlah uang tunai yang berada di laci kasir saat shift dimulai.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" isLoading={isPending} className="font-semibold">
                Buka Shift Sekarang
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleCloseShift}>
            <DialogBody className="space-y-4">
              {activeShift && (
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Waktu Mulai:</span>
                    <span className="font-semibold">{formatDateTime(activeShift.opened_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Modal Kas Awal:</span>
                    <span className="font-semibold">{formatRupiah(activeShift.opening_cash)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Total Uang Tunai Fisik di Laci Saat Ini *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                    className="w-full h-11 pl-11 pr-4 rounded-lg border border-zinc-300 text-lg font-bold text-zinc-900 focus-visible:outline-teal-500 tabular-nums shadow-xs"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                  Catatan Penutupan (Opsional)
                </label>
                <Input
                  placeholder="Keterangan bila ada selisih kas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" variant="destructive" isLoading={isPending} className="font-semibold">
                Konfirmasi & Tutup Shift
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
