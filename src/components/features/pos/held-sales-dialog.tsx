'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { PauseCircle, Play, Trash2, Clock } from 'lucide-react';
import { getHeldSalesAction, deleteHeldSaleAction } from '@/server/actions/sales';
import { formatTime } from '@/lib/format';
import { toast } from 'sonner';

interface HeldSalesDialogProps {
  open: boolean;
  onClose: () => void;
  onResume: (cartData: any) => void;
}

export function HeldSalesDialog({ open, onClose, onResume }: HeldSalesDialogProps) {
  const [heldList, setHeldList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHeld = async () => {
    setLoading(true);
    const data = await getHeldSalesAction();
    setHeldList(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchHeld();
    }
  }, [open]);

  const handleDelete = async (id: string) => {
    const res = await deleteHeldSaleAction(id);
    if (res.error) {
      toast.error('Gagal menghapus antrean tertahan');
    } else {
      toast.success('Pesanan tertahan dihapus');
      fetchHeld();
    }
  };

  const handleSelect = (item: any) => {
    onResume(item.cart_data);
    handleDelete(item.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-600" />
            <div>
              <DialogTitle>Daftar Transaksi Tertahan [F8]</DialogTitle>
              <DialogDescription>
                Pilih transaksi untuk melanjutkan proses kasir.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-xs text-zinc-400 py-6">Memuat antrean...</p>
          ) : heldList.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm">Tidak ada transaksi yang ditahan saat ini.</p>
            </div>
          ) : (
            heldList.map((held) => (
              <div
                key={held.id}
                className="p-3.5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm text-zinc-900">{held.label}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Ditahan pukul {formatTime(held.created_at)} WIB • {held.cart_data?.length || 0} obat
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(held.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    title="Hapus transaksi ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSelect(held)}
                    className="h-8 text-xs font-semibold"
                  >
                    <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Lanjutkan
                  </Button>
                </div>
              </div>
            ))
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
