-- =============================================
-- ApoTech POS - RPC Functions
-- All business-critical operations as atomic Postgres functions
-- =============================================

-- =============================================
-- 1. GENERATE SALE NUMBER
-- Thread-safe sequential numbering: INV-YYYYMMDD-NNNN
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_sale_number(sale_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  seq_val INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'INV-' || to_char(sale_date, 'YYYYMMDD') || '-';
  
  -- Advisory lock to prevent race condition
  PERFORM pg_advisory_xact_lock(hashtext(prefix));
  
  SELECT COALESCE(MAX(
    CAST(substring(sale_number FROM '\d{4}$') AS INTEGER)
  ), 0) + 1
  INTO seq_val
  FROM public.sales
  WHERE sale_number LIKE prefix || '%';
  
  RETURN prefix || lpad(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. GENERATE PURCHASE NUMBER
-- PO-YYYYMMDD-NNNN
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_purchase_number(purchase_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  seq_val INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'PO-' || to_char(purchase_date, 'YYYYMMDD') || '-';
  
  PERFORM pg_advisory_xact_lock(hashtext(prefix));
  
  SELECT COALESCE(MAX(
    CAST(substring(purchase_number FROM '\d{4}$') AS INTEGER)
  ), 0) + 1
  INTO seq_val
  FROM public.purchases
  WHERE purchase_number LIKE prefix || '%';
  
  RETURN prefix || lpad(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. CHECKOUT SALE (main POS transaction)
-- Atomic: validate stock → FEFO batch selection → deduct stock → write records
-- =============================================

-- Type for cart items input
CREATE TYPE public.checkout_item AS (
  product_id UUID,
  product_unit_id UUID,
  quantity INTEGER,          -- in selected unit
  unit_price INTEGER,
  discount_amount INTEGER,
  product_name TEXT,
  unit_name TEXT,
  conversion_factor INTEGER  -- to convert to base unit
);

-- Type for payment input
CREATE TYPE public.checkout_payment AS (
  payment_method payment_method,
  amount INTEGER,
  change_amount INTEGER
);

CREATE OR REPLACE FUNCTION public.checkout_sale(
  p_shift_id UUID,
  p_cashier_id UUID,
  p_items checkout_item[],
  p_payments checkout_payment[],
  p_discount_amount INTEGER DEFAULT 0,
  p_tax_amount INTEGER DEFAULT 0,
  p_prescription_doctor TEXT DEFAULT NULL,
  p_prescription_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sale_id UUID;
  v_sale_number TEXT;
  v_item checkout_item;
  v_payment checkout_payment;
  v_subtotal INTEGER := 0;
  v_total INTEGER := 0;
  v_qty_base INTEGER;
  v_remaining INTEGER;
  v_take INTEGER;
  v_item_subtotal INTEGER;
  v_item_hpp INTEGER;
  v_batch RECORD;
BEGIN
  -- Generate sale number
  v_sale_number := public.generate_sale_number(CURRENT_DATE);
  
  -- Calculate subtotal from items
  FOREACH v_item IN ARRAY p_items LOOP
    v_item_subtotal := (v_item.quantity * v_item.unit_price) - v_item.discount_amount;
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;
  
  -- Calculate total
  v_total := v_subtotal - p_discount_amount + p_tax_amount;
  
  IF v_total < 0 THEN
    RAISE EXCEPTION 'Total transaksi tidak boleh negatif';
  END IF;
  
  -- Create sale record
  INSERT INTO public.sales (
    id, sale_number, shift_id, cashier_id, subtotal, 
    discount_amount, tax_amount, total_amount, status,
    prescription_doctor, prescription_number, notes
  ) VALUES (
    gen_random_uuid(), v_sale_number, p_shift_id, p_cashier_id, v_subtotal,
    p_discount_amount, p_tax_amount, v_total, 'completed',
    p_prescription_doctor, p_prescription_number, p_notes
  ) RETURNING id INTO v_sale_id;
  
  -- Process each item with FEFO
  FOREACH v_item IN ARRAY p_items LOOP
    -- Convert to base unit quantity
    v_qty_base := v_item.quantity * v_item.conversion_factor;
    v_remaining := v_qty_base;
    v_item_subtotal := (v_item.quantity * v_item.unit_price) - v_item.discount_amount;
    v_item_hpp := 0;
    
    -- FEFO: get batches ordered by expiry date (earliest first)
    FOR v_batch IN
      SELECT id, current_stock, buy_price, expiry_date
      FROM public.product_batches
      WHERE product_id = v_item.product_id
        AND is_active = TRUE
        AND expiry_date > CURRENT_DATE  -- reject expired
        AND current_stock > 0
      ORDER BY expiry_date ASC
      FOR UPDATE  -- lock rows to prevent concurrent modification
    LOOP
      EXIT WHEN v_remaining <= 0;
      
      -- How much to take from this batch
      v_take := LEAST(v_remaining, v_batch.current_stock);
      
      -- Record stock movement
      INSERT INTO public.stock_movements (
        product_id, batch_id, movement_type, quantity,
        stock_before, stock_after, reference_type, reference_id,
        performed_by
      ) VALUES (
        v_item.product_id, v_batch.id, 'sale', -v_take,
        v_batch.current_stock, v_batch.current_stock - v_take,
        'sale', v_sale_id, p_cashier_id
      );
      
      -- Update batch stock
      UPDATE public.product_batches
      SET current_stock = current_stock - v_take
      WHERE id = v_batch.id;
      
      -- Calculate HPP for this portion
      v_item_hpp := v_item_hpp + (v_take * v_batch.buy_price);
      
      -- Record sale item per batch
      INSERT INTO public.sale_items (
        sale_id, product_id, product_unit_id, batch_id,
        product_name_snapshot, unit_name_snapshot,
        quantity, quantity_base, unit_price, discount_amount,
        subtotal, hpp
      ) VALUES (
        v_sale_id, v_item.product_id, v_item.product_unit_id, v_batch.id,
        v_item.product_name, v_item.unit_name,
        v_item.quantity, v_take,
        v_item.unit_price, 
        CASE WHEN v_remaining = v_qty_base THEN v_item.discount_amount ELSE 0 END,
        CASE WHEN v_remaining = v_qty_base THEN v_item_subtotal ELSE 0 END,
        v_take * v_batch.buy_price
      );
      
      v_remaining := v_remaining - v_take;
    END LOOP;
    
    -- If not enough stock, raise error (rollback entire transaction)
    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Stok tidak cukup untuk produk: %. Kurang % unit.', 
        v_item.product_name, v_remaining;
    END IF;
  END LOOP;
  
  -- Record payments
  FOREACH v_payment IN ARRAY p_payments LOOP
    INSERT INTO public.sale_payments (
      sale_id, amount, payment_method, change_amount
    ) VALUES (
      v_sale_id, v_payment.amount, v_payment.payment_method, v_payment.change_amount
    );
  END LOOP;
  
  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. VOID SALE
-- Restore stock to original batches, mark as voided
-- =============================================

CREATE OR REPLACE FUNCTION public.void_sale(
  p_sale_id UUID,
  p_voided_by UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sale RECORD;
  v_item RECORD;
  v_batch RECORD;
BEGIN
  -- Get and lock the sale
  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan';
  END IF;
  
  IF v_sale.status = 'voided' THEN
    RAISE EXCEPTION 'Transaksi sudah dibatalkan sebelumnya';
  END IF;
  
  -- Restore stock for each item
  FOR v_item IN
    SELECT * FROM public.sale_items WHERE sale_id = p_sale_id
  LOOP
    -- Get current batch stock
    SELECT current_stock INTO v_batch 
    FROM public.product_batches WHERE id = v_item.batch_id FOR UPDATE;
    
    -- Restore stock
    UPDATE public.product_batches
    SET current_stock = current_stock + v_item.quantity_base
    WHERE id = v_item.batch_id;
    
    -- Record stock movement (positive = stock returned)
    INSERT INTO public.stock_movements (
      product_id, batch_id, movement_type, quantity,
      stock_before, stock_after, reference_type, reference_id,
      notes, performed_by
    ) VALUES (
      v_item.product_id, v_item.batch_id, 'void', v_item.quantity_base,
      v_batch.current_stock, v_batch.current_stock + v_item.quantity_base,
      'sale', p_sale_id,
      'Void: ' || p_reason, p_voided_by
    );
  END LOOP;
  
  -- Mark sale as voided
  UPDATE public.sales
  SET 
    status = 'voided',
    voided_by = p_voided_by,
    void_reason = p_reason,
    voided_at = NOW()
  WHERE id = p_sale_id;
  
  -- Audit log
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values
  ) VALUES (
    p_voided_by, 'void', 'sale', p_sale_id,
    jsonb_build_object('status', 'completed'),
    jsonb_build_object('status', 'voided', 'reason', p_reason)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. STOCK ADJUSTMENT
-- Single batch adjustment with reason
-- =============================================

CREATE OR REPLACE FUNCTION public.stock_adjustment(
  p_product_id UUID,
  p_batch_id UUID,
  p_new_quantity INTEGER,
  p_reason TEXT,
  p_performed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_batch RECORD;
  v_difference INTEGER;
BEGIN
  SELECT * INTO v_batch FROM public.product_batches 
  WHERE id = p_batch_id AND product_id = p_product_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch tidak ditemukan';
  END IF;
  
  v_difference := p_new_quantity - v_batch.current_stock;
  
  IF v_difference = 0 THEN
    RETURN TRUE; -- no change needed
  END IF;
  
  -- Update batch
  UPDATE public.product_batches
  SET current_stock = p_new_quantity
  WHERE id = p_batch_id;
  
  -- Record movement
  INSERT INTO public.stock_movements (
    product_id, batch_id, movement_type, quantity,
    stock_before, stock_after, reference_type,
    notes, performed_by
  ) VALUES (
    p_product_id, p_batch_id, 'adjustment', v_difference,
    v_batch.current_stock, p_new_quantity, 'adjustment',
    p_reason, p_performed_by
  );
  
  -- Audit log
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values
  ) VALUES (
    p_performed_by, 'stock_adjust', 'product_batch', p_batch_id,
    jsonb_build_object('stock', v_batch.current_stock),
    jsonb_build_object('stock', p_new_quantity, 'reason', p_reason, 'difference', v_difference)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. STOCK OPNAME (Bulk adjustment)
-- =============================================

CREATE TYPE public.opname_item AS (
  product_id UUID,
  batch_id UUID,
  physical_count INTEGER
);

CREATE OR REPLACE FUNCTION public.stock_opname(
  p_items opname_item[],
  p_performed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_item opname_item;
  v_batch RECORD;
  v_difference INTEGER;
  v_adjusted INTEGER := 0;
BEGIN
  FOREACH v_item IN ARRAY p_items LOOP
    SELECT * INTO v_batch FROM public.product_batches 
    WHERE id = v_item.batch_id AND product_id = v_item.product_id FOR UPDATE;
    
    IF NOT FOUND THEN
      CONTINUE; -- skip invalid batches
    END IF;
    
    v_difference := v_item.physical_count - v_batch.current_stock;
    
    IF v_difference = 0 THEN
      CONTINUE; -- no change
    END IF;
    
    -- Update batch
    UPDATE public.product_batches
    SET current_stock = v_item.physical_count
    WHERE id = v_item.batch_id;
    
    -- Record movement
    INSERT INTO public.stock_movements (
      product_id, batch_id, movement_type, quantity,
      stock_before, stock_after, reference_type,
      notes, performed_by
    ) VALUES (
      v_item.product_id, v_item.batch_id, 'opname', v_difference,
      v_batch.current_stock, v_item.physical_count, 'opname',
      COALESCE(p_notes, 'Stok Opname'), p_performed_by
    );
    
    v_adjusted := v_adjusted + 1;
  END LOOP;
  
  -- Audit log
  IF v_adjusted > 0 THEN
    INSERT INTO public.audit_logs (
      user_id, action, entity_type, entity_id,
      new_values
    ) VALUES (
      p_performed_by, 'stock_opname', 'stock_opname', gen_random_uuid(),
      jsonb_build_object('items_adjusted', v_adjusted, 'notes', p_notes)
    );
  END IF;
  
  RETURN v_adjusted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. RECEIVE PURCHASE
-- Create/update batches, add stock, record movements
-- =============================================

CREATE TYPE public.receive_item AS (
  product_id UUID,
  product_unit_id UUID,
  batch_number TEXT,
  expiry_date DATE,
  quantity INTEGER,        -- in purchase unit
  conversion_factor INTEGER, -- to base unit
  unit_price INTEGER,      -- per purchase unit
  buy_price_base INTEGER   -- per base unit (calculated)
);

CREATE OR REPLACE FUNCTION public.receive_purchase(
  p_purchase_id UUID,
  p_items receive_item[],
  p_received_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_item receive_item;
  v_batch_id UUID;
  v_qty_base INTEGER;
  v_existing_batch RECORD;
BEGIN
  -- Verify purchase exists and is in draft status
  IF NOT EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE id = p_purchase_id AND status = 'draft'
  ) THEN
    RAISE EXCEPTION 'Pembelian tidak ditemukan atau sudah diproses';
  END IF;
  
  FOREACH v_item IN ARRAY p_items LOOP
    v_qty_base := v_item.quantity * v_item.conversion_factor;
    
    -- Check if batch already exists for this product
    SELECT * INTO v_existing_batch FROM public.product_batches
    WHERE product_id = v_item.product_id 
      AND batch_number = v_item.batch_number
      AND expiry_date = v_item.expiry_date
    FOR UPDATE;
    
    IF FOUND THEN
      -- Update existing batch
      v_batch_id := v_existing_batch.id;
      
      UPDATE public.product_batches
      SET 
        current_stock = current_stock + v_qty_base,
        buy_price = v_item.buy_price_base,
        is_active = TRUE
      WHERE id = v_batch_id;
      
      -- Record movement
      INSERT INTO public.stock_movements (
        product_id, batch_id, movement_type, quantity,
        stock_before, stock_after, reference_type, reference_id,
        performed_by
      ) VALUES (
        v_item.product_id, v_batch_id, 'purchase', v_qty_base,
        v_existing_batch.current_stock, v_existing_batch.current_stock + v_qty_base,
        'purchase', p_purchase_id, p_received_by
      );
    ELSE
      -- Create new batch
      INSERT INTO public.product_batches (
        product_id, batch_number, expiry_date, buy_price, current_stock
      ) VALUES (
        v_item.product_id, v_item.batch_number, v_item.expiry_date,
        v_item.buy_price_base, v_qty_base
      ) RETURNING id INTO v_batch_id;
      
      -- Record movement
      INSERT INTO public.stock_movements (
        product_id, batch_id, movement_type, quantity,
        stock_before, stock_after, reference_type, reference_id,
        performed_by
      ) VALUES (
        v_item.product_id, v_batch_id, 'purchase', v_qty_base,
        0, v_qty_base, 'purchase', p_purchase_id, p_received_by
      );
    END IF;
    
    -- Update purchase item with batch_id
    UPDATE public.purchase_items
    SET batch_id = v_batch_id
    WHERE purchase_id = p_purchase_id AND product_id = v_item.product_id
      AND batch_number = v_item.batch_number;
  END LOOP;
  
  -- Update purchase status
  UPDATE public.purchases
  SET status = 'received'
  WHERE id = p_purchase_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. CLOSE SHIFT
-- Calculate system cash and difference
-- =============================================

CREATE OR REPLACE FUNCTION public.close_shift(
  p_shift_id UUID,
  p_closing_cash INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(system_cash INTEGER, difference INTEGER) AS $$
DECLARE
  v_shift RECORD;
  v_system_cash INTEGER;
  v_difference INTEGER;
  v_cash_sales INTEGER;
BEGIN
  -- Get and lock shift
  SELECT * INTO v_shift FROM public.shifts WHERE id = p_shift_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift tidak ditemukan';
  END IF;
  
  IF v_shift.status = 'closed' THEN
    RAISE EXCEPTION 'Shift sudah ditutup';
  END IF;
  
  -- Calculate cash sales during this shift
  SELECT COALESCE(SUM(sp.amount - sp.change_amount), 0)
  INTO v_cash_sales
  FROM public.sale_payments sp
  JOIN public.sales s ON s.id = sp.sale_id
  WHERE s.shift_id = p_shift_id
    AND s.status = 'completed'
    AND sp.payment_method = 'cash';
  
  -- System cash = opening + cash sales
  v_system_cash := v_shift.opening_cash + v_cash_sales;
  v_difference := p_closing_cash - v_system_cash;
  
  -- Update shift
  UPDATE public.shifts
  SET 
    status = 'closed',
    closing_cash = p_closing_cash,
    system_cash = v_system_cash,
    difference = v_difference,
    closed_at = NOW(),
    notes = p_notes
  WHERE id = p_shift_id;
  
  RETURN QUERY SELECT v_system_cash, v_difference;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 9. AUDIT LOG HELPER
-- Convenience function to write audit logs
-- =============================================

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values, ip_address
  ) VALUES (
    p_user_id, p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_ip_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. GET PRODUCT STOCK (for POS, includes FEFO info)
-- Returns available stock per product without exposing buy_price
-- =============================================

CREATE OR REPLACE FUNCTION public.get_product_stock(p_product_id UUID)
RETURNS TABLE(
  total_stock BIGINT,
  batch_count BIGINT,
  nearest_expiry DATE,
  has_expiring_soon BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(b.current_stock), 0)::BIGINT,
    COUNT(b.id)::BIGINT,
    MIN(b.expiry_date),
    EXISTS(
      SELECT 1 FROM public.product_batches b2
      WHERE b2.product_id = p_product_id
        AND b2.is_active = TRUE
        AND b2.current_stock > 0
        AND b2.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    )
  FROM public.product_batches b
  WHERE b.product_id = p_product_id
    AND b.is_active = TRUE
    AND b.current_stock > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
