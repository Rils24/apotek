import * as React from 'react';
import Link from 'next/link';
import { getProducts, getCategories } from '@/server/actions/products';
import { getCurrentUser } from '@/server/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, DrugClassBadge } from '@/components/ui/badge';
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
  PackagePlus,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Boxes,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { formatRupiah, formatNumber } from '@/lib/format';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; drug_class?: string }>;
}) {
  const params = await searchParams;
  const [products, categories, currentUser] = await Promise.all([
    getProducts({
      search: params.q,
      categoryId: params.category,
      drugClass: params.drug_class,
    }),
    getCategories(),
    getCurrentUser(),
  ]);

  const isOwner = currentUser?.role === 'owner';

  // Quick stats
  const totalItems = products.length;
  const lowStockItems = products.filter((p) => (p.total_stock || 0) <= p.stock_minimum);
  const outOfStockItems = products.filter((p) => (p.total_stock || 0) <= 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Katalog Produk & Obat
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Daftar lengkap sediaan farmasi, multi-satuan, lokasi rak, dan ketersediaan stok fisik.
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link href="/products/new">
              <Button className="shadow-xs">
                <PackagePlus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Katalog
            </span>
            <Boxes className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{formatNumber(totalItems)}</p>
          <span className="text-xs text-zinc-400 mt-1 block">Produk terdaftar di apotek</span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Stok Menipis
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-2">{formatNumber(lowStockItems.length)}</p>
          <span className="text-xs text-amber-700/80 mt-1 block">Di bawah batas minimum</span>
        </Card>

        <Card className="p-4 bg-white border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Stok Kosong
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700 mt-2">{formatNumber(outOfStockItems.length)}</p>
          <span className="text-xs text-red-600/80 mt-1 block">Segera buat pesanan PO</span>
        </Card>
      </div>

      {/* Filters and Search form */}
      <Card className="p-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              name="q"
              defaultValue={params.q || ''}
              placeholder="Cari nama obat, generik, SKU, barcode..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-300 bg-white text-sm shadow-xs focus-visible:outline-teal-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              name="category"
              defaultValue={params.category || ''}
              className="w-full h-9 px-3 rounded-md border border-zinc-300 bg-white text-sm focus-visible:outline-teal-500 text-zinc-700"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <select
              name="drug_class"
              defaultValue={params.drug_class || ''}
              className="w-full h-9 px-3 rounded-md border border-zinc-300 bg-white text-sm focus-visible:outline-teal-500 text-zinc-700"
            >
              <option value="">Semua Golongan</option>
              <option value="bebas">Obat Bebas</option>
              <option value="bebas_terbatas">Obat Bebas Terbatas</option>
              <option value="keras">Obat Keras</option>
              <option value="psikotropika">Psikotropika</option>
              <option value="narkotika">Narkotika</option>
              <option value="suplemen">Suplemen</option>
              <option value="alkes">Alkes</option>
            </select>

            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Products Table Card */}
      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <p className="text-sm font-semibold">Tidak ada produk yang sesuai filter</p>
              <p className="text-xs text-zinc-400 mt-1">Coba ubah kata kunci atau reset filter pencarian Anda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk & Sediaan</TableHead>
                  <TableHead>Golongan</TableHead>
                  <TableHead>Rak</TableHead>
                  <TableHead>Satuan & Harga</TableHead>
                  <TableHead className="text-right">Stok Fisik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const defaultUnit = p.defaultUnit || p.units[0];
                  const isLow = (p.total_stock || 0) <= p.stock_minimum;
                  const isOut = (p.total_stock || 0) <= 0;

                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-semibold text-zinc-900 leading-tight">
                          {p.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {p.generic_name || p.dosage_form || 'Obat'}
                          {p.sku && ` • SKU: ${p.sku}`}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DrugClassBadge drugClass={p.drug_class} />
                      </TableCell>

                      <TableCell className="font-mono text-xs text-zinc-600">
                        {p.shelf_location || '-'}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-zinc-900">
                          {formatRupiah(defaultUnit?.sell_price || 0)}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          per {defaultUnit?.unit_name || 'Satuan'}
                          {p.units.length > 1 && ` (+${p.units.length - 1} satuan)`}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-bold tabular-nums">
                        <span
                          className={
                            isOut
                              ? 'text-red-600'
                              : isLow
                              ? 'text-amber-700'
                              : 'text-zinc-900'
                          }
                        >
                          {formatNumber(p.total_stock || 0)}
                        </span>
                        <span className="text-xs text-zinc-400 font-normal ml-1">
                          {defaultUnit?.unit_name}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isOut ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Menipis
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aman
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link href={`/inventory/stock-card?productId=${p.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-teal-700 hover:bg-teal-50"
                              title="Kartu Stok"
                            >
                              Kartu
                            </Button>
                          </Link>
                          {isOwner && (
                            <Link href={`/products/${p.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                              >
                                Detail / Edit
                              </Button>
                            </Link>
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
    </div>
  );
}
