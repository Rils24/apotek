'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { getBatches, adjustStock } from '@/server/actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Sliders, CheckCircle2 } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/format';
import { toast } from 'sonner';

export default function AdjustmentsPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const fetchBatches = async () => {
    setLoading(true);
    const data = await getBatches();
    setBatches(data);
    if (data.length > 0) {
      setSelectedBatchId(data[0].id);
      setNewQuantity(data[0].current_stock);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const handleBatchSelect = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = batches.find((x) => x.id === batchId);
    if (b) {
      setNewQuantity(b.current_stock);
    }
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    if (!reason.trim()) {
      toast.error('Alasan penyesuaian stok wajib diisi!');
      return;
    }

    startTransition(async () => {
      const res = await adjustStock({
        product_id: selectedBatch.product_id,
        batch_id: selectedBatch.id,
        new_quantity: newQuantity,
        reason: reason.trim(),
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Penyesuaian stok berhasil disimpan');
        setReason('');
        fetchBatches();
      }
    });
  };

  const difference = selectedBatch ? newQuantity - selectedBatch.current_stock : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Penyesuaian Stok Manual
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Koreksi jumlah stok fisik untuk barang rusak, bocor, pecah, hilang, atau kadaluarsa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            <CardTitle>Formulir Koreksi Stok</CardTitle>
          </div>
          <CardDescription>
            Setiap perubahan stok akan langsung tercatat di Kartu Stok dan Log Audit dengan alasan wajib.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAdjust}>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Pilih Batch Obat *
              </label>
              <Select
                value={selectedBatchId}
                onChange={(e) => handleBatchSelect(e.target.value)}
                disabled={loading}
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.product?.name} — Batch: {b.batch_number} (Stok Saat Ini: {b.current_stock})
                  </option>
                ))}
              </Select>
            </div>

            {selectedBatch && (
              <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nama Obat:</span>
                  <span className="font-semibold text-zinc-900">{selectedBatch.product?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nomor Batch:</span>
                  <span className="font-mono font-bold">{selectedBatch.batch_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tanggal Kadaluarsa:</span>
                  <span>{formatDate(selectedBatch.expiry_date)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200">
                  <span className="text-zinc-500">Stok Sistem Saat Ini:</span>
                  <span className="font-bold text-zinc-900">{formatNumber(selectedBatch.current_stock)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Jumlah Stok Baru Riil *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 0)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Selisih Perubahan
                </label>
                <div className="h-9 px-3 rounded-md border border-zinc-200 bg-zinc-100 flex items-center font-bold text-sm tabular-nums">
                  {difference === 0 ? (
                    <span className="text-zinc-500">Tidak ada perubahan</span>
                  ) : difference > 0 ? (
                    <span className="text-emerald-700">+{difference} (Bertambah)</span>
                  ) : (
                    <span className="text-red-600">{difference} (Berkurang)</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Alasan Penyesuaian (Wajib Diisi) *
              </label>
              <Input
                placeholder="Contoh: Kemasan strip sobek terkena air saat pembersihan rak"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                minLength={3}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button
              type="submit"
              isLoading={isPending}
              disabled={!selectedBatch || difference === 0}
              className="font-bold shadow-xs"
            >
              Simpan Koreksi Stok
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
