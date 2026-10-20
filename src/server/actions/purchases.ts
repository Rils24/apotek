'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PurchaseStatus, PurchasePaymentMethod } from '@/lib/types/database';

export async function getSuppliers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
  return data;
}

export async function createSupplier(data: {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms_days?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (!data.name.trim()) {
    return { error: 'Nama supplier / PBF wajib diisi' };
  }

  const { error } = await supabase.from('suppliers').insert({
    name: data.name.trim(),
    contact_person: data.contact_person || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    payment_terms_days: data.payment_terms_days || 30,
  });

  if (error) {
    return { error: 'Gagal menambah supplier: ' + error.message };
  }

  revalidatePath('/suppliers');
  return { success: true };
}

export async function updateSupplier(id: string, data: {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms_days?: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('suppliers')
    .update({
      name: data.name.trim(),
      contact_person: data.contact_person || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      payment_terms_days: data.payment_terms_days || 30,
    })
    .eq('id', id);

  if (error) {
    return { error: 'Gagal memperbarui supplier: ' + error.message };
  }

  revalidatePath('/suppliers');
  return { success: true };
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('suppliers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { error: 'Gagal menghapus supplier: ' + error.message };
  }

  revalidatePath('/suppliers');
  return { success: true };
}

export async function getPurchases(params?: {
  status?: string;
  supplierId?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('purchases')
    .select(`
      id,
      purchase_number,
      supplier_id,
      purchase_date,
      due_date,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      paid_amount,
      status,
      invoice_number,
      notes,
      created_at,
      supplier:suppliers(name)
    `)
    .order('purchase_date', { ascending: false });

  if (params?.status) {
    query = query.eq('status', params.status as any);
  }

  if (params?.supplierId) {
    query = query.eq('supplier_id', params.supplierId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
  return data;
}

export async function getPurchaseById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(*),
      items:purchase_items(
        *,
        product:products(name, sku, drug_class)
      ),
      payments:purchase_payments(
        *,
        created_by_profile:profiles(full_name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching purchase detail:', error);
    return null;
  }
  return data;
}

export async function createPurchaseOrder(data: {
  supplier_id: string;
  purchase_date: string;
  due_date?: string;
  invoice_number?: string;
  notes?: string;
  items: {
    product_id: string;
    product_unit_id?: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
  }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (!data.supplier_id) return { error: 'Pilih supplier / PBF' };
  if (!data.items || data.items.length === 0) {
    return { error: 'Daftar item pesanan tidak boleh kosong' };
  }

  // Generate purchase number
  const { data: poNumber } = await supabase.rpc('generate_purchase_number', {
    purchase_date: data.purchase_date,
  });

  const subtotal = data.items.reduce(
    (sum, it) => sum + (it.quantity * it.unit_price - (it.discount_amount || 0)),
    0
  );

  // Insert purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      purchase_number: poNumber || `PO-${Date.now()}`,
      supplier_id: data.supplier_id,
      purchase_date: data.purchase_date,
      due_date: data.due_date || null,
      subtotal,
      total_amount: subtotal,
      paid_amount: 0,
      status: 'draft',
      invoice_number: data.invoice_number || null,
      notes: data.notes || null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (purchaseError || !purchase) {
    return { error: 'Gagal membuat purchase order: ' + purchaseError?.message };
  }

  // Insert items
  const itemsToInsert = data.items.map((it) => ({
    purchase_id: purchase.id,
    product_id: it.product_id,
    product_unit_id: it.product_unit_id || null,
    batch_number: it.batch_number.trim(),
    expiry_date: it.expiry_date,
    quantity: it.quantity,
    unit_price: it.unit_price,
    discount_amount: it.discount_amount || 0,
    total_price: it.quantity * it.unit_price - (it.discount_amount || 0),
  }));

  await supabase.from('purchase_items').insert(itemsToInsert);

  revalidatePath('/purchases');
  return { success: true, purchaseId: purchase.id };
}

export async function receivePurchaseAction(purchaseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const purchase = await getPurchaseById(purchaseId);
  if (!purchase) return { error: 'Pesanan tidak ditemukan' };
  if (purchase.status !== 'draft') {
    return { error: 'Pesanan sudah diterima sebelumnya' };
  }

  // Map items to receive payload
  const receivePayload = (purchase.items || []).map((it: any) => ({
    product_id: it.product_id,
    product_unit_id: it.product_unit_id,
    batch_number: it.batch_number,
    expiry_date: it.expiry_date,
    quantity: it.quantity,
    conversion_factor: 1, // base unit
    unit_price: it.unit_price,
    buy_price_base: it.unit_price,
  }));

  const { error } = await supabase.rpc('receive_purchase', {
    p_purchase_id: purchaseId,
    p_items: receivePayload,
    p_received_by: user.id,
  });

  if (error) {
    return { error: 'Gagal menerima pesanan barang: ' + error.message };
  }

  revalidatePath('/purchases');
  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath('/inventory/batches');
  revalidatePath('/products');
  return { success: true };
}

export async function payPurchaseAction(data: {
  purchaseId: string;
  amount: number;
  paymentMethod: PurchasePaymentMethod;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (data.amount <= 0) {
    return { error: 'Nominal pembayaran harus lebih besar dari 0' };
  }

  const purchase = await getPurchaseById(data.purchaseId);
  if (!purchase) return { error: 'Faktur pembelian tidak ditemukan' };

  const newPaidAmount = (purchase.paid_amount || 0) + data.amount;
  const newStatus: PurchaseStatus =
    newPaidAmount >= purchase.total_amount ? 'paid' : 'partial';

  // Insert payment
  const { error: paymentError } = await supabase.from('purchase_payments').insert({
    purchase_id: data.purchaseId,
    amount: data.amount,
    payment_method: data.paymentMethod,
    notes: data.notes || null,
    created_by: user.id,
  });

  if (paymentError) {
    return { error: 'Gagal mencatat pembayaran: ' + paymentError.message };
  }

  // Update purchase status
  await supabase
    .from('purchases')
    .update({
      paid_amount: newPaidAmount,
      status: newStatus,
    })
    .eq('id', data.purchaseId);

  // Write cash transaction for financial ledger
  await supabase.from('cash_transactions').insert({
    type: 'expense',
    amount: data.amount,
    description: `Pelunasan PO ${purchase.purchase_number} (${purchase.supplier?.name})`,
    created_by: user.id,
  });

  revalidatePath('/purchases');
  revalidatePath(`/purchases/${data.purchaseId}`);
  revalidatePath('/finance/payables');
  return { success: true };
}
