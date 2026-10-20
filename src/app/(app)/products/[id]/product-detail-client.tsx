'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateProduct, deleteProduct } from '@/server/actions/products';
import { addBatch } from '@/server/actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge, DrugClassBadge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
  Plus,
  Trash2,
  Boxes,
  Calendar,
  AlertTriangle,
  FileText,
  Save,
} from 'lucide-react';
import { DOSAGE_FORMS, DRUG_CLASSES, type DrugClass } from '@/lib/constants';
import { formatRupiah, formatDate, formatNumber } from '@/lib/format';
import { toast } from 'sonner';

interface ProductDetailClientProps {
  product: any;
  categories: any[];
  isOwner: boolean;
}

export function ProductDetailClient({
  product,
  categories,
  isOwner,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState(product.name || '');
  const [genericName, setGenericName] = useState(product.generic_name || '');
  const [activeIngredients, setActiveIngredients] = useState(product.active_ingredients || '');
  const [sku, setSku] = useState(product.sku || '');
  const [barcode, setBarcode] = useState(product.barcode || '');
  const [categoryId, setCategoryId] = useState(product.category_id || '');
  const [dosageForm, setDosageForm] = useState(product.dosage_form || 'Tablet');
  const [manufacturer, setManufacturer] = useState(product.manufacturer || '');
  const [drugClass, setDrugClass] = useState<DrugClass>(product.drug_class || 'bebas');
  const [shelfLocation, setShelfLocation] = useState(product.shelf_location || '');
  const [stockMinimum, setStockMinimum] = useState(product.stock_minimum || 10);
  const [isActive, setIsActive] = useState(product.is_active ?? true);

  // Multi-units state
  const [units, setUnits] = useState<any[]>(
    product.units?.length > 0
      ? product.units
      : [{ unit_name: 'Tablet', conversion_factor: 1, sell_price: 0, is_default: true }]
  );

  // Add Batch modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newBuyPrice, setNewBuyPrice] = useState(0);
  const [newStock, setNewStock] = useState(0);

  const handleAddUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        unit_name: 'Strip',
        conversion_factor: 10,
        sell_price: 0,
        is_default: false,
      },
    ]);
  };

  const handleRemoveUnit = (index: number) => {
    if (units.length <= 1) {
      toast.error('Minimal harus memiliki satu satuan dasar');
      return;
    }
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUnitChange = (index: number, field: string, val: any) => {
    setUnits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSetDefaultUnit = (index: number) => {
    setUnits((prev) =>
      prev.map((u, i) => ({
        ...u,
        is_default: i === index,
      }))
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProduct(product.id, {
        name,
        generic_name: genericName || null,
        active_ingredients: activeIngredients || null,
        sku: sku || null,
        barcode: barcode || null,
        category_id: categoryId || null,
        dosage_form: dosageForm || null,
        manufacturer: manufacturer || null,
        drug_class: drugClass,
        shelf_location: shelfLocation || null,
        stock_minimum: stockMinimum,
        is_active: isActive,
        units,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Perubahan produk berhasil disimpan');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) return;
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Produk berhasil dihapus');
        router.push('/products');
      }
    });
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addBatch({
        product_id: product.id,
        batch_number: newBatchNo,
        expiry_date: newExpiry,
        buy_price: newBuyPrice,
        initial_stock: newStock,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Batch baru berhasil ditambahkan');
        setIsBatchModalOpen(false);
        setNewBatchNo('');
        setNewExpiry('');
        setNewBuyPrice(0);
        setNewStock(0);
        router.refresh();
      }
    });
  };

  const totalBatchStock = product.batches?.reduce(
    (sum: number, b: any) => sum + (b.is_active ? b.current_stock : 0),
    0
  ) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{product.name}</h1>
              <DrugClassBadge drugClass={product.drug_class} />
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              ID: {product.id} • Dibuat: {formatDate(product.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/inventory/stock-card?productId=${product.id}`}>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-1" /> Kartu Stok
            </Button>
          </Link>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Hapus Produk
            </Button>
          )}
        </div>
      </div>

      {/* Main product form */}
      <form onSubmit={handleUpdate} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data & Spesifikasi Obat</CardTitle>
            <CardDescription>Perbarui nama dagang, generik, lokasi rak, atau golongan obat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Produk *
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Generik
                </label>
                <Input value={genericName} onChange={(e) => setGenericName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Golongan Obat *
                </label>
                <Select
                  value={drugClass}
                  onChange={(e) => setDrugClass(e.target.value as DrugClass)}
                >
                  {Object.entries(DRUG_CLASSES).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Bentuk Sediaan
                </label>
                <Select
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                >
                  {DOSAGE_FORMS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Kategori
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  SKU
                </label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Barcode (EAN-13)
                </label>
                <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Lokasi Rak
                </label>
                <Input value={shelfLocation} onChange={(e) => setShelfLocation(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Pabrik / Produsen
                </label>
                <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Batas Stok Minimum
                </label>
                <Input
                  type="number"
                  min="0"
                  value={stockMinimum}
                  onChange={(e) => setStockMinimum(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-units editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Satuan & Harga Jual</CardTitle>
                <CardDescription>Ubah satuan atau tetapkan harga jual baru.</CardDescription>
              </div>
              {isOwner && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddUnit}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Satuan
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {units.map((unit, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 flex flex-wrap sm:flex-nowrap items-center gap-3"
              >
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    Nama Satuan {idx === 0 ? '(Dasar/Terkecil)' : ''}
                  </label>
                  <Input
                    value={unit.unit_name}
                    onChange={(e) => handleUnitChange(idx, 'unit_name', e.target.value)}
                    required
                  />
                </div>

                <div className="w-full sm:w-1/4">
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    Faktor Konversi (x {units[0]?.unit_name || 'Dasar'})
                  </label>
                  <Input
                    type="number"
                    min="1"
                    disabled={idx === 0}
                    value={idx === 0 ? 1 : unit.conversion_factor}
                    onChange={(e) =>
                      handleUnitChange(idx, 'conversion_factor', Number(e.target.value) || 1)
                    }
                    required
                  />
                </div>

                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={unit.sell_price}
                    onChange={(e) =>
                      handleUnitChange(idx, 'sell_price', Number(e.target.value) || 0)
                    }
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSetDefaultUnit(idx)}
                    className={`text-xs px-2.5 py-1.5 rounded-md border font-medium cursor-pointer ${
                      unit.is_default
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {unit.is_default ? 'Default' : 'Set Default'}
                  </button>

                  {idx > 0 && isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(idx)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                      title="Hapus satuan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          {isOwner && (
            <CardFooter className="justify-end">
              <Button type="submit" isLoading={isPending} className="font-semibold shadow-xs">
                <Save className="w-4 h-4 mr-2" /> Simpan Perubahan Produk
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* Batches Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Batch Obat (FEFO)</CardTitle>
              <CardDescription>
                Total stok fisik saat ini: <strong>{formatNumber(totalBatchStock)}</strong> {units[0]?.unit_name}. Sistem kasir secara otomatis mengonsumsi stok dengan masa kedaluwarsa terdekat lebih dulu.
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBatchModalOpen(true)}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Batch Baru
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {product.batches?.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              Belum ada data batch untuk produk ini.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Batch</TableHead>
                  <TableHead>Tgl Kadaluarsa</TableHead>
                  {isOwner && <TableHead className="text-right">Harga Beli (HPP)</TableHead>}
                  <TableHead className="text-right">Sisa Stok Fisik</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.batches?.map((batch: any) => {
                  const isExpired = new Date(batch.expiry_date) <= new Date();
                  const isExpiringSoon =
                    !isExpired &&
                    new Date(batch.expiry_date) <=
                      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono font-bold text-zinc-900">
                        {batch.batch_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span
                            className={
                              isExpired
                                ? 'text-red-600 font-bold'
                                : isExpiringSoon
                                ? 'text-amber-700 font-semibold'
                                : 'text-zinc-700'
                            }
                          >
                            {formatDate(batch.expiry_date)}
                          </span>
                        </div>
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-right font-mono text-xs text-zinc-600">
                          {formatRupiah(batch.buy_price)}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-bold tabular-nums">
                        {formatNumber(batch.current_stock)} {units[0]?.unit_name}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                            Kadaluarsa
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            Segera Kadaluarsa
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            Baik
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal: Tambah Batch Baru */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent onClose={() => setIsBatchModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Tambah Batch Stok Baru</DialogTitle>
            <DialogDescription>
              Menambahkan nomor batch dan kuantitas stok awal untuk produk <strong>{product.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBatch}>
            <DialogBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nomor Batch Pabrik *
                </label>
                <Input
                  placeholder="Contoh: BTH-2026-X1"
                  value={newBatchNo}
                  onChange={(e) => setNewBatchNo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Tanggal Kadaluarsa (Expiry Date) *
                </label>
                <Input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Harga Beli per {units[0]?.unit_name} (HPP)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={newBuyPrice}
                    onChange={(e) => setNewBuyPrice(Number(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Jumlah Stok Masuk ({units[0]?.unit_name})
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBatchModalOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={isPending}>
                Simpan Batch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
