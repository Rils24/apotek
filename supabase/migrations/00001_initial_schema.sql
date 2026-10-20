-- =============================================
-- ApoTech POS - Initial Schema Migration
-- Phase 1: Core tables (profiles, categories, settings, audit_logs, expense_categories)
-- Phase 2: Products & Inventory tables
-- Phase 3: Sales & Shifts tables
-- Phase 4: Purchases & Suppliers tables
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- =============================================
-- ENUM TYPES
-- =============================================

CREATE TYPE user_role AS ENUM ('owner', 'cashier');
CREATE TYPE drug_class AS ENUM ('bebas', 'bebas_terbatas', 'keras', 'psikotropika', 'narkotika', 'alkes', 'suplemen');
CREATE TYPE movement_type AS ENUM ('sale', 'purchase', 'adjustment', 'opname', 'void');
CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'transfer', 'debit');
CREATE TYPE purchase_payment_method AS ENUM ('cash', 'transfer', 'giro');
CREATE TYPE sale_status AS ENUM ('completed', 'voided');
CREATE TYPE shift_status AS ENUM ('open', 'closed');
CREATE TYPE purchase_status AS ENUM ('draft', 'received', 'partial', 'paid', 'cancelled');
CREATE TYPE cash_flow_type AS ENUM ('income', 'expense');

-- =============================================
-- 1. PROFILES (linked to auth.users)
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role := 'cashier';
  v_role_text text;
  v_name text;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_role_text := NEW.raw_user_meta_data->>'role';

  IF v_role_text = 'owner' THEN
    v_role := 'owner'::public.user_role;
  ELSE
    v_role := 'cashier'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(v_name, 'Pengguna Apotek'),
    v_role,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (NEW.id, COALESCE(NEW.email, 'Pengguna'), 'cashier'::public.user_role, TRUE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. SETTINGS (key-value store)
-- =============================================

CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default settings
INSERT INTO public.settings (key, value) VALUES
  ('pharmacy', '{"name": "Apotek Sehat Farma", "address": "Jl. Kesehatan No. 123, Jakarta", "phone": "021-1234567", "license_number": "", "pharmacist_name": "", "pharmacist_license": ""}'),
  ('receipt', '{"header": "Apotek Sehat Farma", "footer": "Terima kasih atas kunjungan Anda", "width": "80mm", "show_logo": false}'),
  ('tax', '{"enabled": false, "rate": 11, "name": "PPN"}'),
  ('expiry_warning', '{"critical_days": 30, "warning_days": 60, "notice_days": 90}'),
  ('stock_warning', '{"enabled": true}');

-- =============================================
-- 3. CATEGORIES
-- =============================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_categories_active ON public.categories (sort_order) WHERE deleted_at IS NULL;

-- =============================================
-- 4. EXPENSE CATEGORIES
-- =============================================

CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type cash_flow_type NOT NULL DEFAULT 'expense',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Default expense categories
INSERT INTO public.expense_categories (name, type, is_system) VALUES
  ('Penjualan', 'income', TRUE),
  ('Gaji Karyawan', 'expense', TRUE),
  ('Listrik', 'expense', FALSE),
  ('Air', 'expense', FALSE),
  ('Sewa Tempat', 'expense', FALSE),
  ('Telepon & Internet', 'expense', FALSE),
  ('Perlengkapan', 'expense', FALSE),
  ('Transportasi', 'expense', FALSE),
  ('Lain-lain', 'expense', FALSE);

-- =============================================
-- 5. PRODUCTS
-- =============================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  active_ingredients TEXT,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  dosage_form TEXT,
  manufacturer TEXT,
  drug_class drug_class NOT NULL DEFAULT 'bebas',
  shelf_location TEXT,
  stock_minimum INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_stock_minimum CHECK (stock_minimum >= 0)
);

-- Indexes for fast search
CREATE INDEX idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_generic_trgm ON public.products USING GIN (generic_name gin_trgm_ops);
CREATE INDEX idx_products_barcode ON public.products (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_sku ON public.products (sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_category ON public.products (category_id);
CREATE INDEX idx_products_active ON public.products (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_drug_class ON public.products (drug_class);

-- =============================================
-- 6. PRODUCT UNITS (multi-unit conversion)
-- =============================================

CREATE TABLE public.product_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  conversion_factor INTEGER NOT NULL DEFAULT 1,
  sell_price INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_conversion_factor CHECK (conversion_factor > 0),
  CONSTRAINT chk_sell_price CHECK (sell_price >= 0)
);

CREATE INDEX idx_product_units_product ON public.product_units (product_id);

-- Ensure only one default unit per product
CREATE UNIQUE INDEX idx_product_units_default 
  ON public.product_units (product_id) WHERE is_default = TRUE;

-- =============================================
-- 7. PRODUCT BATCHES
-- =============================================

CREATE TABLE public.product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  buy_price INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_batch_stock CHECK (current_stock >= 0),
  CONSTRAINT chk_buy_price CHECK (buy_price >= 0)
);

CREATE INDEX idx_batches_product_expiry ON public.product_batches (product_id, expiry_date);
CREATE INDEX idx_batches_product_active ON public.product_batches (product_id, is_active) WHERE current_stock > 0;
CREATE INDEX idx_batches_expiry ON public.product_batches (expiry_date) WHERE is_active = TRUE;

-- =============================================
-- 8. STOCK MOVEMENTS (immutable ledger)
-- =============================================

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  batch_id UUID REFERENCES public.product_batches(id),
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL, -- positive = in, negative = out
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_product_date ON public.stock_movements (product_id, created_at DESC);
CREATE INDEX idx_movements_batch ON public.stock_movements (batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_movements_reference ON public.stock_movements (reference_type, reference_id);

-- =============================================
-- 9. SUPPLIERS
-- =============================================

CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_suppliers_active ON public.suppliers (name) WHERE deleted_at IS NULL AND is_active = TRUE;

-- =============================================
-- 10. PURCHASES
-- =============================================

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  status purchase_status NOT NULL DEFAULT 'draft',
  invoice_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_purchase_amounts CHECK (
    subtotal >= 0 AND discount_amount >= 0 AND 
    tax_amount >= 0 AND total_amount >= 0 AND paid_amount >= 0
  )
);

CREATE INDEX idx_purchases_status ON public.purchases (status);
CREATE INDEX idx_purchases_supplier ON public.purchases (supplier_id);
CREATE INDEX idx_purchases_date ON public.purchases (purchase_date DESC);

-- =============================================
-- 11. PURCHASE ITEMS
-- =============================================

CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_unit_id UUID REFERENCES public.product_units(id),
  batch_id UUID REFERENCES public.product_batches(id),
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_purchase_item_qty CHECK (quantity > 0),
  CONSTRAINT chk_purchase_item_price CHECK (unit_price >= 0)
);

CREATE INDEX idx_purchase_items_purchase ON public.purchase_items (purchase_id);

-- =============================================
-- 12. PURCHASE PAYMENTS
-- =============================================

CREATE TABLE public.purchase_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_method purchase_payment_method NOT NULL DEFAULT 'cash',
  notes TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_purchase_payment_amount CHECK (amount > 0)
);

CREATE INDEX idx_purchase_payments_purchase ON public.purchase_payments (purchase_id);

-- =============================================
-- 13. SHIFTS
-- =============================================

CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID NOT NULL REFERENCES public.profiles(id),
  opening_cash INTEGER NOT NULL DEFAULT 0,
  closing_cash INTEGER,
  system_cash INTEGER,
  difference INTEGER,
  status shift_status NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT,

  CONSTRAINT chk_opening_cash CHECK (opening_cash >= 0)
);

CREATE INDEX idx_shifts_cashier_status ON public.shifts (cashier_id, status);
CREATE INDEX idx_shifts_opened ON public.shifts (opened_at DESC);

-- Only one open shift per cashier
CREATE UNIQUE INDEX idx_shifts_one_open 
  ON public.shifts (cashier_id) WHERE status = 'open';

-- =============================================
-- 14. SALES
-- =============================================

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE,
  shift_id UUID REFERENCES public.shifts(id),
  cashier_id UUID NOT NULL REFERENCES public.profiles(id),
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status sale_status NOT NULL DEFAULT 'completed',
  prescription_doctor TEXT,
  prescription_number TEXT,
  notes TEXT,
  voided_by UUID REFERENCES public.profiles(id),
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_sale_amounts CHECK (
    subtotal >= 0 AND discount_amount >= 0 AND 
    tax_amount >= 0 AND total_amount >= 0
  )
);

CREATE INDEX idx_sales_number ON public.sales (sale_number);
CREATE INDEX idx_sales_shift ON public.sales (shift_id);
CREATE INDEX idx_sales_cashier_date ON public.sales (cashier_id, created_at DESC);
CREATE INDEX idx_sales_date ON public.sales (created_at DESC);
CREATE INDEX idx_sales_status ON public.sales (status);

-- =============================================
-- 15. SALE ITEMS (with price snapshot)
-- =============================================

CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_unit_id UUID REFERENCES public.product_units(id),
  batch_id UUID NOT NULL REFERENCES public.product_batches(id),
  product_name_snapshot TEXT NOT NULL,
  unit_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  quantity_base INTEGER NOT NULL,  -- in smallest unit
  unit_price INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL,
  hpp INTEGER NOT NULL DEFAULT 0,  -- cost of goods from batch buy_price
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_sale_item_qty CHECK (quantity > 0),
  CONSTRAINT chk_sale_item_qty_base CHECK (quantity_base > 0),
  CONSTRAINT chk_sale_item_price CHECK (unit_price >= 0),
  CONSTRAINT chk_sale_item_hpp CHECK (hpp >= 0)
);

CREATE INDEX idx_sale_items_sale ON public.sale_items (sale_id);
CREATE INDEX idx_sale_items_product ON public.sale_items (product_id);

-- =============================================
-- 16. SALE PAYMENTS
-- =============================================

CREATE TABLE public.sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  change_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_sale_payment_amount CHECK (amount > 0)
);

CREATE INDEX idx_sale_payments_sale ON public.sale_payments (sale_id);

-- =============================================
-- 17. HELD SALES
-- =============================================

CREATE TABLE public.held_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID NOT NULL REFERENCES public.profiles(id),
  label TEXT NOT NULL DEFAULT 'Transaksi Tertahan',
  cart_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_held_sales_cashier ON public.held_sales (cashier_id);

-- =============================================
-- 18. CASH TRANSACTIONS
-- =============================================

CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type cash_flow_type NOT NULL,
  expense_category_id UUID REFERENCES public.expense_categories(id),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_cash_amount CHECK (amount > 0)
);

CREATE INDEX idx_cash_transactions_date ON public.cash_transactions (transaction_date DESC);
CREATE INDEX idx_cash_transactions_type ON public.cash_transactions (type);

-- =============================================
-- 19. AUDIT LOGS
-- =============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_date ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs (user_id);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.product_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
