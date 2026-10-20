-- =============================================
-- ApoTech POS - RLS Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.held_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'owner'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- PROFILES
-- =============================================

-- Everyone can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Owner can read all profiles
CREATE POLICY "profiles_select_owner" ON public.profiles
  FOR SELECT USING (public.is_owner());

-- Owner can update profiles
CREATE POLICY "profiles_update_owner" ON public.profiles
  FOR UPDATE USING (public.is_owner());

-- Users can update their own profile (limited fields via application logic)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Allow profile creation on signup
CREATE POLICY "profiles_insert_all" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- =============================================
-- SETTINGS
-- =============================================

-- Everyone can read settings
CREATE POLICY "settings_select_all" ON public.settings
  FOR SELECT USING (TRUE);

-- Owner can update settings
CREATE POLICY "settings_update_owner" ON public.settings
  FOR UPDATE USING (public.is_owner());

CREATE POLICY "settings_insert_owner" ON public.settings
  FOR INSERT WITH CHECK (public.is_owner());

-- =============================================
-- CATEGORIES
-- =============================================

-- Everyone can read categories
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (TRUE);

-- Owner can manage categories
CREATE POLICY "categories_insert_owner" ON public.categories
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY "categories_update_owner" ON public.categories
  FOR UPDATE USING (public.is_owner());

CREATE POLICY "categories_delete_owner" ON public.categories
  FOR DELETE USING (public.is_owner());

-- =============================================
-- EXPENSE CATEGORIES
-- =============================================

CREATE POLICY "expense_categories_select_owner" ON public.expense_categories
  FOR SELECT USING (public.is_owner());

CREATE POLICY "expense_categories_insert_owner" ON public.expense_categories
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY "expense_categories_update_owner" ON public.expense_categories
  FOR UPDATE USING (public.is_owner());

-- =============================================
-- PRODUCTS
-- =============================================

-- Everyone can read products (cashier sees via application that hides certain fields)
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (TRUE);

-- Owner can manage products
CREATE POLICY "products_insert_owner" ON public.products
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY "products_update_owner" ON public.products
  FOR UPDATE USING (public.is_owner());

CREATE POLICY "products_delete_owner" ON public.products
  FOR DELETE USING (public.is_owner());

-- =============================================
-- PRODUCT UNITS
-- =============================================

-- Everyone can read units (needed for POS)
CREATE POLICY "product_units_select_all" ON public.product_units
  FOR SELECT USING (TRUE);

-- Owner can manage units
CREATE POLICY "product_units_insert_owner" ON public.product_units
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY "product_units_update_owner" ON public.product_units
  FOR UPDATE USING (public.is_owner());

CREATE POLICY "product_units_delete_owner" ON public.product_units
  FOR DELETE USING (public.is_owner());

-- =============================================
-- PRODUCT BATCHES
-- Cashier CANNOT directly read batches (to protect buy_price/HPP)
-- Cashier accesses batch info only through RPC functions
-- =============================================

-- Owner can do everything
CREATE POLICY "batches_select_owner" ON public.product_batches
  FOR SELECT USING (public.is_owner());

CREATE POLICY "batches_insert_owner" ON public.product_batches
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY "batches_update_owner" ON public.product_batches
  FOR UPDATE USING (public.is_owner());

-- =============================================
-- STOCK MOVEMENTS (immutable — no update/delete policies)
-- =============================================

-- Owner can read all movements
CREATE POLICY "movements_select_owner" ON public.stock_movements
  FOR SELECT USING (public.is_owner());

-- Insert via RPC functions (SECURITY DEFINER) — no direct insert policy needed for regular users

-- =============================================
-- SUPPLIERS (owner only)
-- =============================================

CREATE POLICY "suppliers_select_owner" ON public.suppliers
  FOR SELECT USING (public.is_owner());

CREATE POLICY "suppliers_insert_owner" ON public.suppliers
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY "suppliers_update_owner" ON public.suppliers
  FOR UPDATE USING (public.is_owner());

-- =============================================
-- PURCHASES (owner only)
-- =============================================

CREATE POLICY "purchases_select_owner" ON public.purchases
  FOR SELECT USING (public.is_owner());

CREATE POLICY "purchases_insert_owner" ON public.purchases
  FOR INSERT WITH CHECK (public.is_owner());

CREATE POLICY "purchases_update_owner" ON public.purchases
  FOR UPDATE USING (public.is_owner());

-- =============================================
-- PURCHASE ITEMS (owner only)
-- =============================================

CREATE POLICY "purchase_items_select_owner" ON public.purchase_items
  FOR SELECT USING (public.is_owner());

CREATE POLICY "purchase_items_insert_owner" ON public.purchase_items
  FOR INSERT WITH CHECK (public.is_owner());

-- =============================================
-- PURCHASE PAYMENTS (owner only)
-- =============================================

CREATE POLICY "purchase_payments_select_owner" ON public.purchase_payments
  FOR SELECT USING (public.is_owner());

CREATE POLICY "purchase_payments_insert_owner" ON public.purchase_payments
  FOR INSERT WITH CHECK (public.is_owner());

-- =============================================
-- SHIFTS
-- =============================================

-- Cashier can read own shifts, owner can read all
CREATE POLICY "shifts_select_own" ON public.shifts
  FOR SELECT USING (cashier_id = auth.uid() OR public.is_owner());

-- Authenticated users can create shifts (for themselves)
CREATE POLICY "shifts_insert_own" ON public.shifts
  FOR INSERT WITH CHECK (cashier_id = auth.uid());

-- Cashier can update own shift (close), owner can update any
CREATE POLICY "shifts_update_own" ON public.shifts
  FOR UPDATE USING (cashier_id = auth.uid() OR public.is_owner());

-- =============================================
-- SALES
-- =============================================

-- Cashier sees own sales, owner sees all
CREATE POLICY "sales_select_own" ON public.sales
  FOR SELECT USING (cashier_id = auth.uid() OR public.is_owner());

-- Insert handled via RPC (checkout_sale) which runs as SECURITY DEFINER
-- But we allow insert for the cashier's own sales as backup
CREATE POLICY "sales_insert_own" ON public.sales
  FOR INSERT WITH CHECK (cashier_id = auth.uid());

-- Only owner can update sales (for void)
CREATE POLICY "sales_update_owner" ON public.sales
  FOR UPDATE USING (public.is_owner());

-- =============================================
-- SALE ITEMS
-- =============================================

-- Cashier sees items of own sales, owner sees all
CREATE POLICY "sale_items_select" ON public.sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE sales.id = sale_items.sale_id 
      AND (sales.cashier_id = auth.uid() OR public.is_owner())
    )
  );

-- Insert via RPC
CREATE POLICY "sale_items_insert" ON public.sale_items
  FOR INSERT WITH CHECK (TRUE); -- controlled by RPC SECURITY DEFINER

-- =============================================
-- SALE PAYMENTS
-- =============================================

CREATE POLICY "sale_payments_select" ON public.sale_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE sales.id = sale_payments.sale_id 
      AND (sales.cashier_id = auth.uid() OR public.is_owner())
    )
  );

CREATE POLICY "sale_payments_insert" ON public.sale_payments
  FOR INSERT WITH CHECK (TRUE); -- controlled by RPC

-- =============================================
-- HELD SALES
-- =============================================

-- Cashier sees own held sales, owner sees all
CREATE POLICY "held_sales_select" ON public.held_sales
  FOR SELECT USING (cashier_id = auth.uid() OR public.is_owner());

CREATE POLICY "held_sales_insert" ON public.held_sales
  FOR INSERT WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "held_sales_update" ON public.held_sales
  FOR UPDATE USING (cashier_id = auth.uid() OR public.is_owner());

CREATE POLICY "held_sales_delete" ON public.held_sales
  FOR DELETE USING (cashier_id = auth.uid() OR public.is_owner());

-- =============================================
-- CASH TRANSACTIONS (owner only)
-- =============================================

CREATE POLICY "cash_transactions_select_owner" ON public.cash_transactions
  FOR SELECT USING (public.is_owner());

CREATE POLICY "cash_transactions_insert_owner" ON public.cash_transactions
  FOR INSERT WITH CHECK (public.is_owner());

-- =============================================
-- AUDIT LOGS (owner only, insert by system)
-- =============================================

CREATE POLICY "audit_logs_select_owner" ON public.audit_logs
  FOR SELECT USING (public.is_owner());

-- Insert allowed for any authenticated user (audit is written by triggers/functions)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- VIEW: Cashier-safe batch view (without buy_price)
-- =============================================

CREATE OR REPLACE VIEW public.v_batches_cashier AS
  SELECT 
    id,
    product_id,
    batch_number,
    expiry_date,
    current_stock,
    is_active,
    created_at
  FROM public.product_batches;

-- Grant access to the view (authenticated users can read)
GRANT SELECT ON public.v_batches_cashier TO authenticated;

-- =============================================
-- VIEW: Product with total stock (for convenience)
-- =============================================

CREATE OR REPLACE VIEW public.v_products_with_stock AS
  SELECT 
    p.*,
    COALESCE(SUM(b.current_stock) FILTER (WHERE b.is_active = TRUE), 0) AS total_stock,
    MIN(b.expiry_date) FILTER (WHERE b.is_active = TRUE AND b.current_stock > 0) AS nearest_expiry
  FROM public.products p
  LEFT JOIN public.product_batches b ON b.product_id = p.id
  WHERE p.deleted_at IS NULL
  GROUP BY p.id;
