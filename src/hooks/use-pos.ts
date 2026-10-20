'use client';

import { useState, useCallback } from 'react';
import type { DrugClass } from '@/lib/types/database';

export interface CartUnit {
  id: string;
  unit_name: string;
  conversion_factor: number;
  sell_price: number;
}

export interface CartItem {
  productId: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  drugClass: DrugClass;
  selectedUnit: CartUnit;
  availableUnits: CartUnit[];
  quantity: number;
  discountAmount: number;
  maxBaseStock: number;
}

export function usePos() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactionDiscount, setTransactionDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionNo, setPrescriptionNo] = useState('');
  const [notes, setNotes] = useState('');

  const addToCart = useCallback((product: {
    id: string;
    name: string;
    sku?: string | null;
    barcode?: string | null;
    drug_class: DrugClass;
    total_stock: number;
    units: CartUnit[];
    defaultUnit?: CartUnit;
  }) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      const chosenUnit = product.defaultUnit || product.units[0];

      if (existingIdx > -1) {
        // Increase quantity of existing item
        const existing = prev[existingIdx];
        const newQty = existing.quantity + 1;
        const totalBaseRequired = newQty * existing.selectedUnit.conversion_factor;

        if (totalBaseRequired > existing.maxBaseStock) {
          return prev; // stock limit reached
        }

        const updated = [...prev];
        updated[existingIdx] = { ...existing, quantity: newQty };
        return updated;
      }

      // Add new item
      if (chosenUnit.conversion_factor > product.total_stock) {
        return prev; // Not enough stock for even 1 unit
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          drugClass: product.drug_class,
          selectedUnit: chosenUnit,
          availableUnits: product.units,
          quantity: 1,
          discountAmount: 0,
          maxBaseStock: product.total_stock,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const totalBaseRequired = quantity * item.selectedUnit.conversion_factor;
          if (totalBaseRequired > item.maxBaseStock) {
            return item; // cannot exceed stock
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, []);

  const changeUnit = useCallback((productId: string, unitId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const nextUnit = item.availableUnits.find((u) => u.id === unitId);
          if (!nextUnit) return item;

          // Check if current quantity in new unit fits available stock
          let newQty = item.quantity;
          if (newQty * nextUnit.conversion_factor > item.maxBaseStock) {
            newQty = Math.floor(item.maxBaseStock / nextUnit.conversion_factor);
            if (newQty < 1) newQty = 1;
          }

          return {
            ...item,
            selectedUnit: nextUnit,
            quantity: newQty,
          };
        }
        return item;
      })
    );
  }, []);

  const updateItemDiscount = useCallback((productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const maxDiscount = item.quantity * item.selectedUnit.sell_price;
          return {
            ...item,
            discountAmount: Math.min(Math.max(0, discount), maxDiscount),
          };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setTransactionDiscount(0);
    setTaxAmount(0);
    setDoctorName('');
    setPrescriptionNo('');
    setNotes('');
  }, []);

  // Check if cart contains controlled substances
  const hasControlledDrugs = cart.some(
    (item) =>
      item.drugClass === 'keras' ||
      item.drugClass === 'psikotropika' ||
      item.drugClass === 'narkotika'
  );

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.selectedUnit.sell_price - item.discountAmount,
    0
  );

  const grandTotal = Math.max(0, subtotal - transactionDiscount + taxAmount);

  return {
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
  };
}
