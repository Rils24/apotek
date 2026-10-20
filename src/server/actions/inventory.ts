'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getBatches(productId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('product_batches')
    .select(`
      id,
      product_id,
      batch_number,
      expiry_date,
      buy_price,
      current_stock,
      is_active,
      created_at,
      product:products(name, sku, drug_class)
    `)
    .order('expiry_date', { ascending: true });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching batches:', error);
    return [];
  }
  return data;
}

export async function addBatch(data: {
  product_id: string;
  batch_number: string;
  expiry_date: string;
  buy_price: number;
  initial_stock: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Hanya pemilik apotek yang dapat menambah batch stok' };
  }

  if (!data.batch_number || !data.expiry_date || data.initial_stock < 0) {
    return { error: 'Nomor batch, tanggal kadaluarsa, dan stok wajib valid' };
  }

  // Insert batch
  const { data: newBatch, error: batchError } = await supabase
    .from('product_batches')
    .insert({
      product_id: data.product_id,
      batch_number: data.batch_number,
      expiry_date: data.expiry_date,
      buy_price: data.buy_price,
      current_stock: data.initial_stock,
    })
    .select('id')
    .single();

  if (batchError || !newBatch) {
    return { error: 'Gagal menambah batch: ' + batchError?.message };
  }

  // If initial stock > 0, record movement
  if (data.initial_stock > 0) {
    await supabase.from('stock_movements').insert({
      product_id: data.product_id,
      batch_id: newBatch.id,
      movement_type: 'adjustment',
      quantity: data.initial_stock,
      stock_before: 0,
      stock_after: data.initial_stock,
      notes: 'Saldo awal batch',
      performed_by: user.id,
    });
  }

  revalidatePath('/inventory/batches');
  revalidatePath(`/products/${data.product_id}`);
  revalidatePath('/pos');
  return { success: true };
}

export async function adjustStock(data: {
  product_id: string;
  batch_id: string;
  new_quantity: number;
  reason: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (!data.reason || data.reason.trim().length < 3) {
    return { error: 'Alasan penyesuaian stok wajib diisi (minimal 3 karakter)' };
  }

  const { error } = await supabase.rpc('stock_adjustment', {
    p_product_id: data.product_id,
    p_batch_id: data.batch_id,
    p_new_quantity: data.new_quantity,
    p_reason: data.reason.trim(),
    p_performed_by: user.id,
  });

  if (error) {
    return { error: 'Gagal menyesuaikan stok: ' + error.message };
  }

  revalidatePath('/inventory/adjustments');
  revalidatePath('/inventory/batches');
  revalidatePath('/pos');
  return { success: true };
}

export async function submitStockOpname(
  items: { product_id: string; batch_id: string; physical_count: number }[],
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (!items || items.length === 0) {
    return { error: 'Pilih minimal satu item untuk opname' };
  }

  const { data: adjustedCount, error } = await supabase.rpc('stock_opname', {
    p_items: items,
    p_performed_by: user.id,
    p_notes: notes || 'Stok Opname Rutin',
  });

  if (error) {
    return { error: 'Gagal memproses opname: ' + error.message };
  }

  revalidatePath('/inventory/opname');
  revalidatePath('/inventory/batches');
  revalidatePath('/pos');
  return { success: true, count: adjustedCount };
}

export async function getStockCard(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      id,
      product_id,
      batch_id,
      movement_type,
      quantity,
      stock_before,
      stock_after,
      reference_type,
      reference_id,
      notes,
      created_at,
      performed_by_profile:profiles(full_name),
      batch:product_batches(batch_number, expiry_date)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stock card:', error);
    return [];
  }
  return data;
}

export async function getInventoryAlerts() {
  const supabase = await createClient();

  // Low stock products
  const { data: allProducts } = await supabase
    .from('v_products_with_stock')
    .select('id, name, sku, stock_minimum, total_stock, drug_class')
    .order('name');

  const lowStock = (allProducts || []).filter(
    (p) => (p.total_stock || 0) <= p.stock_minimum
  );

  // Expiring soon batches (within 90 days)
  const today = new Date();
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(today.getDate() + 90);

  const { data: expiringBatches } = await supabase
    .from('product_batches')
    .select(`
      id,
      batch_number,
      expiry_date,
      current_stock,
      product:products(id, name, drug_class)
    `)
    .eq('is_active', true)
    .gt('current_stock', 0)
    .lte('expiry_date', ninetyDaysLater.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  return {
    lowStock,
    expiringBatches: expiringBatches || [],
  };
}
