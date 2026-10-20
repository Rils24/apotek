'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PaymentMethod } from '@/lib/types/database';

export async function getActiveShift() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('cashier_id', user.id)
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    console.error('Error getting active shift:', error);
    return null;
  }
  return data;
}

export async function openShift(openingCash: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (openingCash < 0) {
    return { error: 'Modal kas awal tidak boleh negatif' };
  }

  // Check if there is already an open shift
  const existing = await getActiveShift();
  if (existing) {
    return { error: 'Shift kasir sudah dibuka sebelumnya' };
  }

  const { data, error } = await supabase
    .from('shifts')
    .insert({
      cashier_id: user.id,
      opening_cash: openingCash,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    return { error: 'Gagal membuka shift: ' + error.message };
  }

  revalidatePath('/pos');
  return { success: true, shift: data };
}

export async function closeShiftAction(shiftId: string, closingCash: number, notes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (closingCash < 0) {
    return { error: 'Uang fisik penutupan tidak boleh negatif' };
  }

  const { data, error } = await supabase.rpc('close_shift', {
    p_shift_id: shiftId,
    p_closing_cash: closingCash,
    p_notes: notes || null,
  });

  if (error) {
    return { error: 'Gagal menutup shift: ' + error.message };
  }

  revalidatePath('/pos');
  revalidatePath('/dashboard');
  return { success: true, result: data?.[0] };
}

export interface CheckoutItemPayload {
  product_id: string;
  product_unit_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  product_name: string;
  unit_name: string;
  conversion_factor: number;
}

export interface CheckoutPaymentPayload {
  payment_method: PaymentMethod;
  amount: number;
  change_amount: number;
}

export async function checkoutSaleAction(params: {
  shiftId: string;
  items: CheckoutItemPayload[];
  payments: CheckoutPaymentPayload[];
  discountAmount?: number;
  taxAmount?: number;
  prescriptionDoctor?: string | null;
  prescriptionNumber?: string | null;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (!params.shiftId) {
    return { error: 'Shift kasir belum dibuka. Silakan buka shift terlebih dahulu.' };
  }

  if (!params.items || params.items.length === 0) {
    return { error: 'Keranjang belanja kosong' };
  }

  if (!params.payments || params.payments.length === 0) {
    return { error: 'Metode pembayaran wajib ditentukan' };
  }

  try {
    const { data: saleId, error } = await supabase.rpc('checkout_sale', {
      p_shift_id: params.shiftId,
      p_cashier_id: user.id,
      p_items: params.items,
      p_payments: params.payments,
      p_discount_amount: params.discountAmount || 0,
      p_tax_amount: params.taxAmount || 0,
      p_prescription_doctor: params.prescriptionDoctor || null,
      p_prescription_number: params.prescriptionNumber || null,
      p_notes: params.notes || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/pos');
    revalidatePath('/transactions');
    return { success: true, saleId };
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan sistem saat checkout' };
  }
}

export async function voidSaleAction(saleId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Hanya pemilik apotek yang memiliki otorisasi untuk membatalkan (void) transaksi' };
  }

  if (!reason || reason.trim().length < 5) {
    return { error: 'Alasan pembatalan (void) wajib diisi dengan jelas (minimal 5 karakter)' };
  }

  const { error } = await supabase.rpc('void_sale', {
    p_sale_id: saleId,
    p_voided_by: user.id,
    p_reason: reason.trim(),
  });

  if (error) {
    return { error: 'Gagal membatalkan transaksi: ' + error.message };
  }

  revalidatePath('/transactions');
  revalidatePath('/pos');
  revalidatePath('/reports/sales');
  return { success: true };
}

export async function holdSaleAction(label: string, cartData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data, error } = await supabase
    .from('held_sales')
    .insert({
      cashier_id: user.id,
      label: label.trim() || 'Pesanan Tertahan',
      cart_data: cartData,
    })
    .select()
    .single();

  if (error) {
    return { error: 'Gagal menahan transaksi: ' + error.message };
  }

  return { success: true, heldSale: data };
}

export async function getHeldSalesAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('held_sales')
    .select('*')
    .eq('cashier_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting held sales:', error);
    return [];
  }
  return data;
}

export async function deleteHeldSaleAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('held_sales').delete().eq('id', id);
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function getSales(params?: {
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  status?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('sales')
    .select(`
      id,
      sale_number,
      shift_id,
      cashier_id,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      status,
      prescription_doctor,
      prescription_number,
      notes,
      void_reason,
      voided_at,
      created_at,
      cashier:profiles!sales_cashier_id_fkey(full_name),
      payments:sale_payments(amount, payment_method, change_amount)
    `)
    .order('created_at', { ascending: false });

  if (params?.startDate) {
    query = query.gte('created_at', `${params.startDate}T00:00:00Z`);
  }

  if (params?.endDate) {
    query = query.lte('created_at', `${params.endDate}T23:59:59Z`);
  }

  if (params?.status) {
    query = query.eq('status', params.status as any);
  }

  if (params?.search) {
    query = query.ilike('sale_number', `%${params.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
  return data;
}

export async function getSaleById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      cashier:profiles!sales_cashier_id_fkey(full_name),
      voided_by_profile:profiles!sales_voided_by_fkey(full_name),
      items:sale_items(
        id,
        product_id,
        product_name_snapshot,
        unit_name_snapshot,
        quantity,
        unit_price,
        discount_amount,
        subtotal
      ),
      payments:sale_payments(
        id,
        amount,
        payment_method,
        change_amount
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching sale detail:', error);
    return null;
  }
  return data;
}
