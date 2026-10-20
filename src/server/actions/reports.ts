'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSalesReport(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('sales')
    .select(`
      id,
      sale_number,
      created_at,
      total_amount,
      discount_amount,
      status,
      cashier:profiles!sales_cashier_id_fkey(full_name),
      items:sale_items(
        product_name_snapshot,
        quantity,
        unit_name_snapshot,
        subtotal
      ),
      payments:sale_payments(
        payment_method,
        amount
      )
    `)
    .order('created_at', { ascending: false });

  if (startDate) query = query.gte('created_at', `${startDate}T00:00:00Z`);
  if (endDate) query = query.lte('created_at', `${endDate}T23:59:59Z`);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching sales report:', error);
    return [];
  }
  return data;
}

export async function getStockValueReport() {
  const supabase = await createClient();

  // All active batches with buy_price
  const { data: batches } = await supabase
    .from('product_batches')
    .select(`
      id,
      current_stock,
      buy_price,
      expiry_date,
      product:products(
        id,
        name,
        drug_class,
        category:categories(name)
      )
    `)
    .eq('is_active', true)
    .gt('current_stock', 0);

  const totalInventoryValue = (batches || []).reduce(
    (sum, b) => sum + (b.current_stock * b.buy_price),
    0
  );

  const totalStockUnits = (batches || []).reduce(
    (sum, b) => sum + b.current_stock,
    0
  );

  return {
    totalInventoryValue,
    totalStockUnits,
    batchCount: batches?.length || 0,
    batches: batches || [],
  };
}

export async function getNarcoticsReport(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('sale_items')
    .select(`
      id,
      product_name_snapshot,
      quantity,
      unit_name_snapshot,
      created_at,
      product:products(drug_class),
      batch:product_batches(batch_number, expiry_date),
      sale:sales(
        sale_number,
        prescription_doctor,
        prescription_number,
        status,
        cashier:profiles!sales_cashier_id_fkey(full_name)
      )
    `)
    .order('created_at', { ascending: false });

  if (startDate) query = query.gte('created_at', `${startDate}T00:00:00Z`);
  if (endDate) query = query.lte('created_at', `${endDate}T23:59:59Z`);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching narcotics report:', error);
    return [];
  }

  // Filter only keras, psikotropika, or narkotika
  return (data || []).filter((item: any) => {
    const dc = item.product?.drug_class;
    return dc === 'narkotika' || dc === 'psikotropika' || dc === 'keras';
  });
}
