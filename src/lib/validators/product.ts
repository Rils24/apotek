import { z } from 'zod';

export const productUnitSchema = z.object({
  id: z.string().optional(),
  unit_name: z.string().min(1, 'Nama satuan wajib diisi'),
  conversion_factor: z.number().int().positive('Faktor konversi minimal 1'),
  sell_price: z.number().int().min(0, 'Harga jual tidak boleh negatif'),
  is_default: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  generic_name: z.string().optional().nullable(),
  active_ingredients: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  dosage_form: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  drug_class: z.enum([
    'bebas',
    'bebas_terbatas',
    'keras',
    'psikotropika',
    'narkotika',
    'alkes',
    'suplemen',
  ]),
  shelf_location: z.string().optional().nullable(),
  stock_minimum: z.number().int().min(0, 'Stok minimum tidak boleh negatif').default(10),
  is_active: z.boolean().default(true),
  units: z
    .array(productUnitSchema)
    .min(1, 'Minimal harus memiliki satu satuan (satuan dasar/terkecil)'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductUnitValues = z.infer<typeof productUnitSchema>;
