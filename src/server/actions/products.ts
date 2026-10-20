'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { productFormSchema, type ProductFormValues } from '@/lib/validators/product';

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
}

export async function createCategory(name: string, description?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { error } = await supabase.from('categories').insert({
    name,
    description: description || null,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'Nama kategori sudah digunakan' };
    }
    return { error: 'Gagal membuat kategori: ' + error.message };
  }

  revalidatePath('/products');
  return { success: true };
}

export async function getProducts(params?: {
  search?: string;
  categoryId?: string;
  drugClass?: string;
  inStockOnly?: boolean;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('v_products_with_stock')
    .select(`
      id,
      name,
      generic_name,
      active_ingredients,
      sku,
      barcode,
      category_id,
      dosage_form,
      manufacturer,
      drug_class,
      shelf_location,
      stock_minimum,
      is_active,
      created_at,
      total_stock,
      nearest_expiry
    `)
    .order('name', { ascending: true });

  if (params?.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  if (params?.drugClass) {
    query = query.eq('drug_class', params.drugClass as any);
  }

  if (params?.search && params.search.trim()) {
    const s = params.search.trim();
    query = query.or(
      `name.ilike.%${s}%,generic_name.ilike.%${s}%,sku.ilike.%${s}%,barcode.ilike.%${s}%`
    );
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Get units for products
  const productIds = products.map((p) => p.id);
  const { data: units } = await supabase
    .from('product_units')
    .select('*')
    .in('product_id', productIds)
    .order('sort_order', { ascending: true });

  // Map units to products
  return products.map((product) => {
    const pUnits = units?.filter((u) => u.product_id === product.id) || [];
    const defaultUnit = pUnits.find((u) => u.is_default) || pUnits[0];
    return {
      ...product,
      units: pUnits,
      defaultUnit,
    };
  });
}

export async function getProductById(id: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      units:product_units(*),
      batches:product_batches(*)
    `)
    .eq('id', id)
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

export async function createProduct(rawData: ProductFormValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  // Role check: Only owner can create products
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Hanya pemilik apotek yang dapat menambah produk' };
  }

  const validated = productFormSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { units, ...productData } = validated.data;

  // Insert product
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      generic_name: productData.generic_name || null,
      active_ingredients: productData.active_ingredients || null,
      sku: productData.sku || null,
      barcode: productData.barcode || null,
      category_id: productData.category_id || null,
      dosage_form: productData.dosage_form || null,
      manufacturer: productData.manufacturer || null,
      drug_class: productData.drug_class,
      shelf_location: productData.shelf_location || null,
      stock_minimum: productData.stock_minimum,
      is_active: productData.is_active,
    })
    .select('id')
    .single();

  if (productError || !newProduct) {
    if (productError?.code === '23505') {
      if (productError.message.includes('sku')) return { error: 'SKU sudah dipakai' };
      if (productError.message.includes('barcode')) return { error: 'Barcode sudah dipakai' };
    }
    return { error: 'Gagal membuat produk: ' + productError?.message };
  }

  // Insert product units
  const unitsToInsert = units.map((u, idx) => ({
    product_id: newProduct.id,
    unit_name: u.unit_name,
    conversion_factor: u.conversion_factor,
    sell_price: u.sell_price,
    is_default: idx === 0 ? true : u.is_default,
    sort_order: idx + 1,
  }));

  const { error: unitsError } = await supabase
    .from('product_units')
    .insert(unitsToInsert);

  if (unitsError) {
    console.error('Error inserting units:', unitsError);
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'product',
    entity_id: newProduct.id,
    new_values: { name: productData.name, units_count: units.length },
  });

  revalidatePath('/products');
  revalidatePath('/pos');
  return { success: true, productId: newProduct.id };
}

export async function updateProduct(id: string, rawData: ProductFormValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Hanya pemilik apotek yang dapat mengubah produk' };
  }

  const validated = productFormSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { units, ...productData } = validated.data;

  // Update product fields
  const { error: updateError } = await supabase
    .from('products')
    .update({
      name: productData.name,
      generic_name: productData.generic_name || null,
      active_ingredients: productData.active_ingredients || null,
      sku: productData.sku || null,
      barcode: productData.barcode || null,
      category_id: productData.category_id || null,
      dosage_form: productData.dosage_form || null,
      manufacturer: productData.manufacturer || null,
      drug_class: productData.drug_class,
      shelf_location: productData.shelf_location || null,
      stock_minimum: productData.stock_minimum,
      is_active: productData.is_active,
    })
    .eq('id', id);

  if (updateError) {
    return { error: 'Gagal memperbarui produk: ' + updateError.message };
  }

  // Replace units: delete existing and re-insert
  await supabase.from('product_units').delete().eq('product_id', id);

  const unitsToInsert = units.map((u, idx) => ({
    product_id: id,
    unit_name: u.unit_name,
    conversion_factor: u.conversion_factor,
    sell_price: u.sell_price,
    is_default: idx === 0 ? true : u.is_default,
    sort_order: idx + 1,
  }));

  await supabase.from('product_units').insert(unitsToInsert);

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'product',
    entity_id: id,
    new_values: { name: productData.name },
  });

  revalidatePath('/products');
  revalidatePath(`/products/${id}`);
  revalidatePath('/pos');
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Hanya pemilik apotek yang dapat menghapus produk' };
  }

  // Soft delete
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { error: 'Gagal menghapus produk: ' + error.message };
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'delete',
    entity_type: 'product',
    entity_id: id,
  });

  revalidatePath('/products');
  revalidatePath('/pos');
  return { success: true };
}
