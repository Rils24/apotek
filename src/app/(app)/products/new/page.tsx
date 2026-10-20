'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, createProduct } from '@/server/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft, Pill, Layers } from 'lucide-react';
import { DOSAGE_FORMS, DRUG_CLASSES, type DrugClass } from '@/lib/constants';
import { toast } from 'sonner';
import Link from 'next/link';

interface UnitRow {
  unit_name: string;
  conversion_factor: number;
  sell_price: number;
  is_default: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [activeIngredients, setActiveIngredients] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [manufacturer, setManufacturer] = useState('');
  const [drugClass, setDrugClass] = useState<DrugClass>('bebas');
  const [shelfLocation, setShelfLocation] = useState('');
  const [stockMinimum, setStockMinimum] = useState(10);

  // Units (first row is always base unit conversion_factor = 1)
  const [units, setUnits] = useState<UnitRow[]>([
    { unit_name: 'Tablet', conversion_factor: 1, sell_price: 1500, is_default: true },
  ]);

  useEffect(() => {
    getCategories().then((data) => setCategories(data));
  }, []);

  const handleAddUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        unit_name: prev.length === 1 ? 'Strip' : 'Box',
        conversion_factor: prev.length === 1 ? 10 : 100,
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

  const handleUnitChange = (index: number, field: keyof UnitRow, val: any) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nama produk wajib diisi');
      return;
    }

    startTransition(async () => {
      const res = await createProduct({
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
        is_active: true,
        units: units.map((u, idx) => ({ ...u, sort_order: idx + 1 })),
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Produk baru berhasil ditambahkan');
        router.push('/products');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Tambah Produk Baru
          </h1>
          <p className="text-sm text-zinc-500">
            Daftarkan produk obat dengan multi-satuan dan klasifikasi farmasi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info card */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar Obat</CardTitle>
            <CardDescription>
              Detail sediaan, zat aktif, dan klasifikasi perundang-undangan farmasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Merk Obat / Produk *
                </label>
                <Input
                  placeholder="Contoh: Paracetamol 500mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Generik (INN)
                </label>
                <Input
                  placeholder="Contoh: Acetaminophen"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                />
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
                  required
                >
                  {Object.entries(DRUG_CLASSES).map(([key, label]) => (
                    <option key={key} value={key}>
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
                  {DOSAGE_FORMS.map((form) => (
                    <option key={form} value={form}>
                      {form}
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
                  SKU / Kode Produk
                </label>
                <Input
                  placeholder="PCM-500"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Barcode (EAN-13)
                </label>
                <Input
                  placeholder="8992801001001"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Lokasi Rak Obat
                </label>
                <Input
                  placeholder="A-01-02"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Produsen / Pabrik Farmasi
                </label>
                <Input
                  placeholder="PT Kimia Farma Tbk"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
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

        {/* Multi-unit card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Satuan & Harga Jual Bertingkat</CardTitle>
                <CardDescription>
                  Satuan pertama adalah satuan dasar/terkecil (konversi = 1). Satuan berikutnya merupakan kelipatannya.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddUnit}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Satuan Lain
              </Button>
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
                    placeholder="Contoh: Tablet, Strip, Box"
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
                    placeholder="0"
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
                    {unit.is_default ? 'Default POS' : 'Set Default'}
                  </button>

                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(idx)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                      title="Hapus satuan ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Link href="/products">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
            <Button type="submit" isLoading={isPending} className="font-semibold shadow-xs">
              Simpan Produk
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
