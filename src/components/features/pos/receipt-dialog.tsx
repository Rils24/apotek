'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Printer, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/constants';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
  saleData: {
    saleNumber: string;
    createdAt: string | Date;
    cashierName: string;
    items: {
      name: string;
      unitName: string;
      quantity: number;
      unitPrice: number;
      discountAmount: number;
      subtotal: number;
    }[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    payments: {
      paymentMethod: PaymentMethod;
      amount: number;
      changeAmount: number;
    }[];
    prescriptionDoctor?: string | null;
    prescriptionNumber?: string | null;
  } | null;
}

export function ReceiptDialog({
  open,
  onClose,
  onNewTransaction,
  saleData,
}: ReceiptDialogProps) {
  const [paperWidth, setPaperWidth] = React.useState<'58mm' | '80mm'>('80mm');

  if (!saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-md" className="p-0 overflow-hidden">
        {/* Header toolbar (no-print) */}
        <div className="no-print p-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-300" />
            <div>
              <p className="font-bold text-sm">Transaksi Berhasil Disimpan</p>
              <p className="text-xs text-teal-200">No. {saleData.saleNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper size selector (no-print) */}
        <div className="no-print px-6 pt-3 flex items-center justify-between text-xs text-zinc-600 border-b border-zinc-100 pb-2">
          <span>Lebar Kertas Thermal:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                paperWidth === '58mm'
                  ? 'bg-teal-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              58 mm
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                paperWidth === '80mm'
                  ? 'bg-teal-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              80 mm
            </button>
          </div>
        </div>

        {/* Thermal Receipt Paper Container */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-zinc-100 flex justify-center">
          <div
            id="thermal-receipt"
            className={`bg-white p-4 shadow-sm border border-zinc-200 text-black font-mono text-[11px] leading-tight ${
              paperWidth === '58mm' ? 'receipt-58mm w-[58mm]' : 'receipt-80mm w-[80mm]'
            }`}
          >
            {/* Pharmacy details */}
            <div className="text-center pb-2 border-b border-dashed border-zinc-400">
              <h2 className="font-bold text-sm tracking-tight uppercase">APOTEK SEHAT FARMA</h2>
              <p className="text-[10px] text-zinc-600">Jl. Kesehatan No. 123, Jakarta Pusat</p>
              <p className="text-[10px] text-zinc-600">Telp: (021) 1234567 | SIA: 442/012/2024</p>
              <p className="text-[9px] text-zinc-500">SIPA: 19850101/SIPA_31.71/2022/1001</p>
            </div>

            {/* Transaction metadata */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>No. Bukti:</span>
                <span className="font-bold">{saleData.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(saleData.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{saleData.cashierName}</span>
              </div>
              {saleData.prescriptionDoctor && (
                <div className="flex justify-between pt-0.5 text-[9px] text-zinc-600">
                  <span>Resep:</span>
                  <span>dr. {saleData.prescriptionDoctor}</span>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-1.5">
              {saleData.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-medium text-[11px] truncate">{item.name}</div>
                  <div className="flex justify-between text-zinc-600 text-[10px]">
                    <span>
                      {item.quantity} {item.unitName} x {formatRupiah(item.unitPrice)}
                    </span>
                    <span className="font-semibold text-black">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                  {item.discountAmount > 0 && (
                    <div className="flex justify-between text-[9px] text-red-600 italic">
                      <span>Diskon item:</span>
                      <span>-{formatRupiah(item.discountAmount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(saleData.subtotal)}</span>
              </div>
              {saleData.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon Nota:</span>
                  <span>-{formatRupiah(saleData.discountAmount)}</span>
                </div>
              )}
              {saleData.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>PPN:</span>
                  <span>{formatRupiah(saleData.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-zinc-300">
                <span>TOTAL:</span>
                <span>{formatRupiah(saleData.totalAmount)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-1 text-[10px]">
              {saleData.payments.map((p, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="uppercase">
                      Bayar ({PAYMENT_METHODS[p.paymentMethod]}):
                    </span>
                    <span className="font-semibold">{formatRupiah(p.amount)}</span>
                  </div>
                  {p.changeAmount > 0 && (
                    <div className="flex justify-between font-bold text-zinc-900">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(p.changeAmount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[9px] text-zinc-500 space-y-1">
              <p className="font-semibold">Semoga Lekas Sembuh & Sehat Selalu</p>
              <p>Obat yang sudah dibeli tidak dapat ditukar/dikembalikan kecuali ada perjanjian.</p>
              <p className="text-[8px] pt-1">Layanan Konsultasi Apoteker: 0812-3456-7890</p>
            </div>
          </div>
        </div>

        {/* Dialog Actions toolbar (no-print) */}
        <div className="no-print p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNewTransaction}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Transaksi Baru
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Tutup
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="shadow-xs font-semibold text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Cetak Struk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
