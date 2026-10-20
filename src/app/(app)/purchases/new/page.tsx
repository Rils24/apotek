'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSuppliers, createPurchaseOrder } from '@/server/actions/purchases';
import { getProducts } from '@/server/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Truck } from 'lucide-react';
import { formatRupiah, formatDateInput } from '@/lib/format';
import { toast } from 'sonner';

interface PurchaseItemRow {
  product_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(formatDateInput(new Date()));
  const [dueDate, setDueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseItemRow[]>([
    {
      product_id: '',
      batch_number: '',
      expiry_date: '',
      quantity: 10,
      unit_price: 5000,
      discount_amount: 0,
    },
  ]);

  useEffect(() => {
    Promise.all([getSuppliers(), getProducts()]).then(([supps, prods]) => {
      setSuppliers(supps);
      setProducts(prods);
      if (supps.length > 0) setSupplierId(supps[0].id);
      if (prods.length > 0) {
        setItems([
          {
            product_id: prods[0].id,
            batch_number: `BTH-${Date.now().toString().slice(-4)}`,
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            quantity: 20,
            unit_price: 5000,
            discount_amount: 0,
          },
        ]);
      }
      setLoading(false);
    });
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: products[0]?.id || '',
        batch_number: `BTH-${Math.floor(1000 + Math.random() * 9000)}`,
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        quantity: 10,
        unit_price: 5000,
        discount_amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Minimal harus ada satu item pesanan');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemRow, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const totalAmount = items.reduce(
    (sum, it) => sum + (it.quantity * it.unit_price - it.discount_amount),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error('Pilih supplier terlebih dahulu');
      return;
    }

    startTransition(async () => {
      const res = await createPurchaseOrder({
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        due_date: dueDate || undefined,
        invoice_number: invoiceNumber || undefined,
        notes: notes || undefined,
        items,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Pesanan pembelian (PO) berhasil dibuat');
        router.push('/purchases');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/purchases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Buat Pesanan Pembelian (PO) Baru
          </h1>
          <p className="text-sm text-zinc-500">
            Pesan obat ke Pedagang Besar Farmasi (PBF) dan catat faktur jatuh tempo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Header info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Supplier & Faktur</CardTitle>
            <CardDescription>Pilih PBF resmi rekanan apotek dan tanggal jatuh tempo pembayaran.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Supplier / PBF *
                </label>
                <Select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  disabled={loading}
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Tempo: {s.payment_terms_days} hari)
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nomor Faktur Supplier (Opsional)
                </label>
                <Input
                  placeholder="Contoh: INV-PBF/2026/089"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Tanggal Pemesanan *
                </label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Tanggal Jatuh Tempo Pembayaran
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PO Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rincian Obat yang Dipesan</CardTitle>
                <CardDescription>Cantumkan nomor batch dan tanggal kadaluarsa dari kemasan pabrik.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Pilih Obat *
                    </label>
                    <Select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.dosage_form || 'Sediaan'})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Nomor Batch Pabrik *
                    </label>
                    <Input
                      placeholder="BTH-01"
                      value={item.batch_number}
                      onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Tgl Kadaluarsa *
                    </label>
                    <Input
                      type="date"
                      value={item.expiry_date}
                      onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Jumlah (Qty) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Harga Beli per Satuan (HPP) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(idx, 'unit_price', Number(e.target.value) || 0)
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <span className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Subtotal Item:
                    </span>
                    <span className="font-bold text-sm text-zinc-900 block py-1 tabular-nums">
                      {formatRupiah(item.quantity * item.unit_price)}
                    </span>
                  </div>

                  <div className="sm:col-span-1 text-right">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50">
            <div>
              <span className="text-xs text-zinc-500 block">Total Nilai Pemesanan:</span>
              <span className="text-xl font-bold text-teal-900 tabular-nums">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/purchases">
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
              <Button type="submit" isLoading={isPending} className="font-bold shadow-xs">
                Simpan Pesanan PO
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
