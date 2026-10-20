'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { usePos, type CartItem } from '@/hooks/use-pos';
import { getProducts, getCategories } from '@/server/actions/products';
import { getActiveShift, checkoutSaleAction, holdSaleAction } from '@/server/actions/sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, DrugClassBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PaymentDialog } from '@/components/features/pos/payment-dialog';
import { ReceiptDialog } from '@/components/features/pos/receipt-dialog';
import { ShiftDialog } from '@/components/features/pos/shift-dialog';
import { HeldSalesDialog } from '@/components/features/pos/held-sales-dialog';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  Clock,
  Sparkles,
  Barcode,
  Keyboard,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { formatRupiah, calculateDiscount } from '@/lib/format';
import { toast } from 'sonner';
import type { DrugClass, PaymentMethod } from '@/lib/types/database';

export default function PosPage() {
  const {
    cart,
    setCart,
    addToCart,
    updateQuantity,
    changeUnit,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    subtotal,
    grandTotal,
    transactionDiscount,
    setTransactionDiscount,
    taxAmount,
    setTaxAmount,
    doctorName,
    setDoctorName,
    prescriptionNo,
    setPrescriptionNo,
    notes,
    setNotes,
    hasControlledDrugs,
  } = usePos();

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDrugClass, setSelectedDrugClass] = useState<string | null>(null);

  // Shift state
  const [activeShift, setActiveShift] = useState<any>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<'open' | 'close'>('open');

  // Dialog states
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHeldOpen, setIsHeldOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodData, catData, shiftData] = await Promise.all([
        getProducts(),
        getCategories(),
        getActiveShift(),
      ]);
      setProducts(prodData);
      setCategories(catData);
      setActiveShift(shiftData);
      if (!shiftData) {
        setIsShiftModalOpen(true);
        setShiftModalMode('open');
      }
    } catch {
      toast.error('Gagal memuat data POS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Keyboard shortcuts (F2: search, F4: pay, F8: hold, Esc: close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && activeShift) {
          setIsPaymentOpen(true);
        } else if (!activeShift) {
          toast.warning('Buka shift kasir terlebih dahulu');
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldTransaction();
        } else {
          setIsHeldOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, activeShift]);

  // Handle barcode scanner enter or search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        p.barcode?.toLowerCase() === query ||
        p.sku?.toLowerCase() === query ||
        p.name.toLowerCase() === query
    );

    if (matched) {
      if (matched.total_stock <= 0) {
        toast.error(`Stok obat ${matched.name} telah habis!`);
        return;
      }
      addToCart(matched);
      setSearchQuery('');
      toast.success(`Menambahkan ${matched.name}`);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (selectedDrugClass && p.drug_class !== selectedDrugClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.generic_name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, selectedDrugClass, searchQuery]);

  // Handle discount change
  const handleApplyDiscount = (val: string, type: 'nominal' | 'percent') => {
    setDiscountInput(val);
    const num = Number(val) || 0;
    const computed = calculateDiscount(subtotal, type, num);
    setTransactionDiscount(computed);
  };

  // Hold transaction
  const handleHoldTransaction = async () => {
    if (cart.length === 0) return;
    const label = `Pelanggan #${Math.floor(100 + Math.random() * 900)} (${cart.length} item)`;
    const res = await holdSaleAction(label, cart);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Pesanan berhasil ditahan');
      clearCart();
    }
  };

  // Checkout submission
  const handleCheckout = async (payments: any[]) => {
    if (!activeShift) {
      toast.error('Shift belum aktif');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map((c) => ({
        product_id: c.productId,
        product_unit_id: c.selectedUnit.id,
        quantity: c.quantity,
        unit_price: c.selectedUnit.sell_price,
        discount_amount: c.discountAmount,
        product_name: c.name,
        unit_name: c.selectedUnit.unit_name,
        conversion_factor: c.selectedUnit.conversion_factor,
      }));

      const res = await checkoutSaleAction({
        shiftId: activeShift.id,
        items: itemsPayload,
        payments: payments,
        discountAmount: transactionDiscount,
        taxAmount: taxAmount,
        prescriptionDoctor: doctorName,
        prescriptionNumber: prescriptionNo,
        notes: notes,
      });

      if (res.error) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      // Prepare receipt data
      const receipt = {
        saleNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-OK`,
        createdAt: new Date(),
        cashierName: 'Kasir ApoTech',
        items: cart.map((c) => ({
          name: c.name,
          unitName: c.selectedUnit.unit_name,
          quantity: c.quantity,
          unitPrice: c.selectedUnit.sell_price,
          discountAmount: c.discountAmount,
          subtotal: c.quantity * c.selectedUnit.sell_price - c.discountAmount,
        })),
        subtotal,
        discountAmount: transactionDiscount,
        taxAmount,
        totalAmount: grandTotal,
        payments,
        prescriptionDoctor: doctorName,
        prescriptionNumber: prescriptionNo,
      };

      setReceiptData(receipt);
      setIsPaymentOpen(false);
      clearCart();
      fetchData(); // refresh product stocks
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyelesaikan checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="flex items-center gap-2">
          {activeShift ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-zinc-800">
                Shift Aktif (Modal: {formatRupiah(activeShift.opening_cash)})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShiftModalMode('close');
                  setIsShiftModalOpen(true);
                }}
                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 ml-2"
              >
                Tutup Shift
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <span className="text-xs font-semibold text-zinc-500">
                Shift Belum Dibuka
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShiftModalMode('open');
                  setIsShiftModalOpen(true);
                }}
                className="h-7 text-xs font-semibold"
              >
                Buka Shift Sekarang
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Held sales button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHeldOpen(true)}
            className="text-xs h-8 text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-50"
          >
            <PauseCircle className="w-3.5 h-3.5 mr-1.5" />
            Antrean Tertahan [F8]
          </Button>

          {/* Shortcut guide tooltip */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 border-l border-zinc-200 pl-3">
            <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 font-mono font-semibold">
              F2
            </span>
            <span>Cari</span>
            <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 font-mono font-semibold">
              F4
            </span>
            <span>Bayar</span>
          </div>
        </div>
      </div>

      {/* POS Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Search & Product Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar & barcode simulation */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari obat (Nama / Generik / SKU / Scan Barcode) [F2]..."
              className="w-full h-11 pl-10 pr-24 rounded-xl border border-zinc-300 bg-white text-sm shadow-xs transition-colors placeholder:text-zinc-400 focus-visible:outline-teal-500"
              autoFocus
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
              <Barcode className="w-3.5 h-3.5" />
              <span>Scan Enter</span>
            </div>
          </form>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedDrugClass(null);
              }}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${
                !selectedCategory && !selectedDrugClass
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Semua Obat
            </button>
            <button
              type="button"
              onClick={() => setSelectedDrugClass(selectedDrugClass === 'keras' ? null : 'keras')}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${
                selectedDrugClass === 'keras'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              Obat Keras
            </button>
            <button
              type="button"
              onClick={() => setSelectedDrugClass(selectedDrugClass === 'bebas' ? null : 'bebas')}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${
                selectedDrugClass === 'bebas'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Obat Bebas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                }
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {loading ? (
              <div className="col-span-full py-12 text-center text-zinc-400 text-xs">
                Memuat katalog obat...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 bg-white rounded-xl border border-dashed border-zinc-200 p-8">
                <p className="text-sm font-semibold text-zinc-700">Obat tidak ditemukan</p>
                <p className="text-xs text-zinc-400 mt-1">Coba kata kunci pencarian lain atau ganti kategori filter.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const defaultUnit = product.defaultUnit || product.units[0];
                const isOutOfStock = product.total_stock <= 0;
                const isExpiringSoon =
                  product.nearest_expiry &&
                  new Date(product.nearest_expiry) <=
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                      isOutOfStock
                        ? 'opacity-50 bg-zinc-50 border-zinc-200 cursor-not-allowed'
                        : 'bg-white border-zinc-200 hover:border-teal-500 hover:shadow-sm active:scale-[0.99]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <DrugClassBadge drugClass={product.drug_class} />
                        {product.shelf_location && (
                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
                            {product.shelf_location}
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2 group-hover:text-teal-700">
                        {product.name}
                      </h4>
                      {product.generic_name && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {product.generic_name}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-end justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-500 block">
                          Stok: <strong className={isOutOfStock ? 'text-red-600' : 'text-zinc-800'}>{product.total_stock}</strong> {defaultUnit?.unit_name}
                        </span>
                        {isExpiringSoon && (
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            Kadaluarsa dekat!
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-sm text-teal-800 tabular-nums">
                        {formatRupiah(defaultUnit?.sell_price || 0)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Cart & Payment (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="rounded-xl border-zinc-200 shadow-sm flex flex-col h-[calc(100vh-140px)] sticky top-20">
            {/* Cart Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-zinc-900">Keranjang Belanja</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-zinc-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300 mb-2">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-600">Keranjang Masih Kosong</p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Klik obat di sebelah kiri atau ketik nama/barcode di kolom pencarian [F2].
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="pt-2 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-zinc-900 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Unit dropdown selector */}
                          <select
                            value={item.selectedUnit.id}
                            onChange={(e) => changeUnit(item.productId, e.target.value)}
                            className="text-[11px] font-semibold bg-zinc-100 text-zinc-700 rounded px-1.5 py-0.5 border border-zinc-200 cursor-pointer"
                          >
                            {item.availableUnits.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.unit_name} ({formatRupiah(u.sell_price)})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Item subtotal */}
                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-zinc-900 tabular-nums block">
                          {formatRupiah(item.quantity * item.selectedUnit.sell_price - item.discountAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-zinc-400 hover:text-red-600 text-[10px] mt-0.5 inline-block cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {/* Quantity & item discount controls */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-zinc-100 text-zinc-600 rounded-l-lg cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-10 text-center text-xs font-bold text-zinc-900 border-x border-zinc-200 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-zinc-100 text-zinc-600 rounded-r-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Optional item discount */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400">Disc:</span>
                        <input
                          type="number"
                          placeholder="Rp"
                          value={item.discountAmount || ''}
                          onChange={(e) =>
                            updateItemDiscount(item.productId, Number(e.target.value) || 0)
                          }
                          className="w-16 h-6 px-1.5 text-[11px] rounded border border-zinc-200 text-right tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout Trigger */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 space-y-3">
              {/* Subtotal & Global Discount */}
              <div className="space-y-1.5 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Diskon Transaksi:</span>
                  <div className="flex items-center gap-1">
                    <select
                      value={discountType}
                      onChange={(e) => {
                        const t = e.target.value as 'nominal' | 'percent';
                        setDiscountType(t);
                        handleApplyDiscount(discountInput, t);
                      }}
                      className="text-[10px] bg-white border border-zinc-200 rounded px-1 py-0.5"
                    >
                      <option value="nominal">Rp</option>
                      <option value="percent">%</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={discountInput}
                      onChange={(e) => handleApplyDiscount(e.target.value, discountType)}
                      className="w-20 h-6 px-1.5 text-right font-medium text-xs border border-zinc-200 rounded bg-white tabular-nums"
                      placeholder="0"
                    />
                  </div>
                </div>

                {transactionDiscount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Potongan Nota:</span>
                    <span>-{formatRupiah(transactionDiscount)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Box */}
              <div className="p-3.5 rounded-xl bg-teal-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-300 block">
                    TOTAL AKHIR
                  </span>
                  <span className="text-2xl font-bold tracking-tight tabular-nums">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
                {hasControlledDrugs && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-semibold">
                    Wajib Resep
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cart.length === 0}
                  onClick={handleHoldTransaction}
                  className="text-xs h-10 col-span-1"
                >
                  <PauseCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Hold [F8]
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={cart.length === 0 || !activeShift}
                  onClick={() => setIsPaymentOpen(true)}
                  className="font-bold text-sm h-10 col-span-2 shadow-xs"
                >
                  BAYAR [F4]
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        grandTotal={grandTotal}
        hasControlledDrugs={hasControlledDrugs}
        isSubmitting={isSubmitting}
        doctorName={doctorName}
        setDoctorName={setDoctorName}
        prescriptionNo={prescriptionNo}
        setPrescriptionNo={setPrescriptionNo}
        notes={notes}
        setNotes={setNotes}
        onSubmit={handleCheckout}
      />

      {/* Receipt Modal */}
      <ReceiptDialog
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        onNewTransaction={() => setReceiptData(null)}
        saleData={receiptData}
      />

      {/* Shift Open/Close Modal */}
      <ShiftDialog
        mode={shiftModalMode}
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        activeShift={activeShift}
        onSuccess={fetchData}
      />

      {/* Held Sales Dialog */}
      <HeldSalesDialog
        open={isHeldOpen}
        onClose={() => setIsHeldOpen(false)}
        onResume={(heldCart) => setCart(heldCart)}
      />
    </div>
  );
}
