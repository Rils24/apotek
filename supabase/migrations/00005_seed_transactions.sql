-- ==========================================================
-- ApoTech POS - Sample Transaction & Operational Data Seed
-- Populates:
-- 1. Cashier Shifts (1 closed shift yesterday, 1 open shift today)
-- 2. Sales & Sale Items & Payments (12 realistic sales across 3 days)
-- 3. Purchases & Payables (2 PBF invoices: 1 paid, 1 accounts payable/tempo)
-- 4. Cash Flow Transactions (Operational expenses: Listrik, ATK, Kebersihan)
-- 5. Stock Movements (Ledger entries for Stock Card visualization)
-- ==========================================================

DO $$
DECLARE
  v_cashier_id UUID;
  v_owner_id UUID;
  v_shift_closed_id UUID := gen_random_uuid();
  v_shift_open_id UUID := gen_random_uuid();
  
  -- Sale IDs
  s1 UUID := gen_random_uuid();
  s2 UUID := gen_random_uuid();
  s3 UUID := gen_random_uuid();
  s4 UUID := gen_random_uuid();
  s5 UUID := gen_random_uuid();
  s6 UUID := gen_random_uuid();
  s7 UUID := gen_random_uuid();
  s8 UUID := gen_random_uuid();
  s9 UUID := gen_random_uuid();
  s10 UUID := gen_random_uuid();
  s11 UUID := gen_random_uuid();
  s12 UUID := gen_random_uuid();

  -- Purchase IDs
  po1 UUID := gen_random_uuid();
  po2 UUID := gen_random_uuid();

  -- Supplier IDs
  v_sup_kf UUID := 'b1000000-0000-0000-0000-000000000001';
  v_sup_klb UUID := 'b1000000-0000-0000-0000-000000000002';

  -- Expense Category IDs
  v_cat_listrik UUID;
  v_cat_atk UUID;
  v_cat_lain UUID;

BEGIN
  -- 1. Identify users
  SELECT id INTO v_cashier_id FROM public.profiles WHERE role = 'cashier' LIMIT 1;
  SELECT id INTO v_owner_id FROM public.profiles WHERE role = 'owner' LIMIT 1;

  IF v_cashier_id IS NULL THEN
    SELECT id INTO v_cashier_id FROM public.profiles LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    v_owner_id := v_cashier_id;
  END IF;

  IF v_cashier_id IS NULL THEN
    RAISE EXCEPTION 'Belum ada user di profiles. Harap buat user terlebih dahulu di Authentication!';
  END IF;

  -- 2. Identify Expense Categories
  SELECT id INTO v_cat_listrik FROM public.expense_categories WHERE name = 'Listrik' LIMIT 1;
  SELECT id INTO v_cat_atk FROM public.expense_categories WHERE name = 'Perlengkapan' LIMIT 1;
  SELECT id INTO v_cat_lain FROM public.expense_categories WHERE name = 'Lain-lain' LIMIT 1;

  -- ==========================================================
  -- SHIFTS
  -- ==========================================================
  -- Past Shift (Yesterday - Closed)
  INSERT INTO public.shifts (
    id, cashier_id, opened_at, closed_at, opening_cash, 
    closing_cash, system_cash, difference, status, notes
  ) VALUES (
    v_shift_closed_id,
    v_cashier_id,
    NOW() - INTERVAL '1 day' - INTERVAL '8 hours',
    NOW() - INTERVAL '1 day',
    200000,
    785000,
    785000,
    0,
    'closed',
    'Shift kasir kemarin berjalan lancar. Kas fisik klop.'
  ) ON CONFLICT DO NOTHING;

  -- Close any existing open shift for this cashier first
  UPDATE public.shifts 
  SET status = 'closed', closed_at = NOW() 
  WHERE cashier_id = v_cashier_id AND status = 'open';

  -- Current Shift (Today - Active Open)
  INSERT INTO public.shifts (
    id, cashier_id, opened_at, opening_cash, status, notes
  ) VALUES (
    v_shift_open_id,
    v_cashier_id,
    NOW() - INTERVAL '3 hours',
    300000,
    'open',
    'Shift kasir pagi hari ini.'
  ) ON CONFLICT DO NOTHING;

  -- ==========================================================
  -- SALES (12 Transactions across 3 days)
  -- ==========================================================

  -- 1. TRX-001 (2 days ago, Non-resep, Cash)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s1, 'TRX-20261018-0001', v_shift_closed_id, v_cashier_id, 32000, 0, 0, 32000, 'completed', NOW() - INTERVAL '2 days' + INTERVAL '9 hours');
  
  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s1, 'c1000000-0000-0000-0000-000000000021', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000021' LIMIT 1), 'Promag Tablet', 'Strip', 2, 20, 8500, 17000, 7000, NOW() - INTERVAL '2 days' + INTERVAL '9 hours'),
    (s1, 'c1000000-0000-0000-0000-000000000022', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000022' LIMIT 1), 'Bodrex Tablet', 'Strip', 3, 12, 5000, 15000, 6000, NOW() - INTERVAL '2 days' + INTERVAL '9 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s1, 50000, 'cash', 18000, NOW() - INTERVAL '2 days' + INTERVAL '9 hours');


  -- 2. TRX-002 (2 days ago, Resep dr. Hendra, QRIS)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, prescription_doctor, prescription_number, created_at)
  VALUES (s2, 'TRX-20261018-0002', v_shift_closed_id, v_cashier_id, 44000, 2000, 0, 42000, 'completed', 'dr. Hendra Pratama, Sp.PD', 'RXP-2026-001', NOW() - INTERVAL '2 days' + INTERVAL '11 hours');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, discount_amount, subtotal, hpp, created_at)
  VALUES 
    (s2, 'c1000000-0000-0000-0000-000000000001', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000001' LIMIT 1), 'Amoxicillin 500mg', 'Strip', 2, 20, 14000, 0, 28000, 15000, NOW() - INTERVAL '2 days' + INTERVAL '11 hours'),
    (s2, 'c1000000-0000-0000-0000-000000000011', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000011' LIMIT 1), 'Paracetamol 500mg', 'Strip', 2, 20, 8000, 2000, 16000, 5000, NOW() - INTERVAL '2 days' + INTERVAL '11 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s2, 42000, 'qris', 0, NOW() - INTERVAL '2 days' + INTERVAL '11 hours');


  -- 3. TRX-003 (2 days ago, Suplemen, Debit BCA)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s3, 'TRX-20261018-0003', v_shift_closed_id, v_cashier_id, 65000, 0, 0, 65000, 'completed', NOW() - INTERVAL '2 days' + INTERVAL '15 hours');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s3, 'c1000000-0000-0000-0000-000000000031', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000031' LIMIT 1), 'Vitamin C 500mg', 'Strip', 3, 30, 15000, 45000, 15000, NOW() - INTERVAL '2 days' + INTERVAL '15 hours'),
    (s3, 'c1000000-0000-0000-0000-000000000024', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000024' LIMIT 1), 'Tolak Angin Cair', 'Sachet', 5, 5, 4000, 20000, 15000, NOW() - INTERVAL '2 days' + INTERVAL '15 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s3, 65000, 'debit', 0, NOW() - INTERVAL '2 days' + INTERVAL '15 hours');


  -- 4. TRX-004 (Yesterday, Non-resep, Cash)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s4, 'TRX-20261019-0001', v_shift_closed_id, v_cashier_id, 55000, 0, 0, 55000, 'completed', NOW() - INTERVAL '1 day' + INTERVAL '9 hours');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s4, 'c1000000-0000-0000-0000-000000000025', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000025' LIMIT 1), 'Entrostop Tablet', 'Strip', 2, 24, 12000, 24000, 12000, NOW() - INTERVAL '1 day' + INTERVAL '9 hours'),
    (s4, 'c1000000-0000-0000-0000-000000000026', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000026' LIMIT 1), 'Betadine Solution 30ml', 'Botol', 1, 1, 31000, 31000, 18000, NOW() - INTERVAL '1 day' + INTERVAL '9 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s4, 60000, 'cash', 5000, NOW() - INTERVAL '1 day' + INTERVAL '9 hours');


  -- 5. TRX-005 (Yesterday, Resep dr. Anita Sp.A, Transfer)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, prescription_doctor, prescription_number, created_at)
  VALUES (s5, 'TRX-20261019-0002', v_shift_closed_id, v_cashier_id, 71000, 0, 0, 71000, 'completed', 'dr. Anita Wijaya, Sp.A', 'RXP-2026-002', NOW() - INTERVAL '1 day' + INTERVAL '11 hours');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s5, 'c1000000-0000-0000-0000-000000000002', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000002' LIMIT 1), 'Cefadroxil 500mg', 'Strip', 2, 20, 23000, 46000, 30000, NOW() - INTERVAL '1 day' + INTERVAL '11 hours'),
    (s5, 'c1000000-0000-0000-0000-000000000019', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000019' LIMIT 1), 'Cetirizine 10mg', 'Strip', 2, 20, 12500, 25000, 10000, NOW() - INTERVAL '1 day' + INTERVAL '11 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s5, 71000, 'transfer', 0, NOW() - INTERVAL '1 day' + INTERVAL '11 hours');


  -- 6. TRX-006 (Yesterday, Hipertensi Rutin, QRIS)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s6, 'TRX-20261019-0003', v_shift_closed_id, v_cashier_id, 51000, 0, 0, 51000, 'completed', NOW() - INTERVAL '1 day' + INTERVAL '14 hours');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s6, 'c1000000-0000-0000-0000-000000000005', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000005' LIMIT 1), 'Amlodipine 5mg', 'Strip', 3, 30, 9500, 28500, 14000, NOW() - INTERVAL '1 day' + INTERVAL '14 hours'),
    (s6, 'c1000000-0000-0000-0000-000000000004', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000004' LIMIT 1), 'Metformin 500mg', 'Strip', 3, 30, 7500, 22500, 12000, NOW() - INTERVAL '1 day' + INTERVAL '14 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s6, 51000, 'qris', 0, NOW() - INTERVAL '1 day' + INTERVAL '14 hours');


  -- 7. TRX-007 (Yesterday, Alkes, Cash)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s7, 'TRX-20261019-0004', v_shift_closed_id, v_cashier_id, 35000, 0, 0, 35000, 'completed', NOW() - INTERVAL '1 day' + INTERVAL '16 hours');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s7, 'c1000000-0000-0000-0000-000000000048', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000048' LIMIT 1), 'Masker Medis 3 Ply', 'Box', 1, 50, 35000, 35000, 20000, NOW() - INTERVAL '1 day' + INTERVAL '16 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s7, 50000, 'cash', 15000, NOW() - INTERVAL '1 day' + INTERVAL '16 hours');


  -- 8. TRX-008 (Yesterday, VOIDED SALE - Pembatalan Transaksi oleh Pemilik)
  INSERT INTO public.sales (
    id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, 
    status, voided_by, void_reason, voided_at, created_at
  ) VALUES (
    s8, 'TRX-20261019-0005', v_shift_closed_id, v_cashier_id, 45000, 0, 0, 45000, 
    'voided', v_owner_id, 'Pelanggan salah memilih obat, minta dibatalkan sebelum pembayaran diproses.',
    NOW() - INTERVAL '1 day' + INTERVAL '18 hours' + INTERVAL '10 minutes',
    NOW() - INTERVAL '1 day' + INTERVAL '18 hours'
  );

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s8, 'c1000000-0000-0000-0000-000000000033', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000033' LIMIT 1), 'Neurobion Forte', 'Strip', 1, 10, 45000, 45000, 20000, NOW() - INTERVAL '1 day' + INTERVAL '18 hours');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s8, 45000, 'cash', 0, NOW() - INTERVAL '1 day' + INTERVAL '18 hours');


  -- 9. TRX-009 (Today, Suplemen Daya Tahan Tubuh, QRIS)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s9, 'TRX-20261020-0001', v_shift_open_id, v_cashier_id, 85000, 5000, 0, 80000, 'completed', NOW() - INTERVAL '2 hours' + INTERVAL '15 minutes');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, discount_amount, subtotal, hpp, created_at)
  VALUES 
    (s9, 'c1000000-0000-0000-0000-000000000039', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000039' LIMIT 1), 'Imboost Force', 'Strip', 1, 10, 45000, 5000, 40000, 25000, NOW() - INTERVAL '2 hours' + INTERVAL '15 minutes'),
    (s9, 'c1000000-0000-0000-0000-000000000024', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000024' LIMIT 1), 'Tolak Angin Cair', 'Sachet', 10, 10, 4000, 0, 40000, 30000, NOW() - INTERVAL '2 hours' + INTERVAL '15 minutes');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s9, 80000, 'qris', 0, NOW() - INTERVAL '2 hours' + INTERVAL '15 minutes');


  -- 10. TRX-010 (Today, Resep dr. Bambang / RXP-084, Cash)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, prescription_doctor, prescription_number, created_at)
  VALUES (s10, 'TRX-20261020-0002', v_shift_open_id, v_cashier_id, 45000, 0, 0, 45000, 'completed', 'dr. Bambang Irawan, Sp.JP', 'RXP-2026-003', NOW() - INTERVAL '1 hour' + INTERVAL '30 minutes');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s10, 'c1000000-0000-0000-0000-000000000009', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000009' LIMIT 1), 'Simvastatin 20mg', 'Strip', 2, 20, 15000, 30000, 14000, NOW() - INTERVAL '1 hour' + INTERVAL '30 minutes'),
    (s10, 'c1000000-0000-0000-0000-000000000006', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000006' LIMIT 1), 'Captopril 25mg', 'Strip', 2, 20, 7500, 15000, 7000, NOW() - INTERVAL '1 hour' + INTERVAL '30 minutes');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s10, 50000, 'cash', 5000, NOW() - INTERVAL '1 hour' + INTERVAL '30 minutes');


  -- 11. TRX-011 (Today, Topikal & P3K, Debit BCA)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s11, 'TRX-20261020-0003', v_shift_open_id, v_cashier_id, 52000, 0, 0, 52000, 'completed', NOW() - INTERVAL '45 minutes');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s11, 'c1000000-0000-0000-0000-000000000041', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000041' LIMIT 1), 'Bioplacenton Gel', 'Tube', 1, 1, 28000, 28000, 15000, NOW() - INTERVAL '45 minutes'),
    (s11, 'c1000000-0000-0000-0000-000000000030', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000030' LIMIT 1), 'Kasa Steril 16x16', 'Pcs', 3, 3, 4000, 12000, 6000, NOW() - INTERVAL '45 minutes'),
    (s11, 'c1000000-0000-0000-0000-000000000029', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000029' LIMIT 1), 'Hansaplast Standard', 'Strip', 6, 6, 2000, 12000, 6000, NOW() - INTERVAL '45 minutes');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s11, 52000, 'debit', 0, NOW() - INTERVAL '45 minutes');


  -- 12. TRX-012 (Today - Baru saja, Batuk & Flu, Cash)
  INSERT INTO public.sales (id, sale_number, shift_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, status, created_at)
  VALUES (s12, 'TRX-20261020-0004', v_shift_open_id, v_cashier_id, 37000, 0, 0, 37000, 'completed', NOW() - INTERVAL '10 minutes');

  INSERT INTO public.sale_items (sale_id, product_id, batch_id, product_name_snapshot, unit_name_snapshot, quantity, quantity_base, unit_price, subtotal, hpp, created_at)
  VALUES 
    (s12, 'c1000000-0000-0000-0000-000000000028', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000028' LIMIT 1), 'OBH Combi Batuk', 'Botol', 1, 1, 25000, 25000, 15000, NOW() - INTERVAL '10 minutes'),
    (s12, 'c1000000-0000-0000-0000-000000000016', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000016' LIMIT 1), 'CTM 4mg', 'Strip', 3, 30, 4000, 12000, 3000, NOW() - INTERVAL '10 minutes');

  INSERT INTO public.sale_payments (sale_id, amount, payment_method, change_amount, created_at)
  VALUES (s12, 50000, 'cash', 13000, NOW() - INTERVAL '10 minutes');


  -- ==========================================================
  -- PURCHASES / FAKTUR PBF (Hutang Usaha & Pembelian)
  -- ==========================================================
  
  -- PO 1: Kimia Farma (Status: Received, LUNAS / Paid)
  INSERT INTO public.purchases (
    id, purchase_number, supplier_id, invoice_number, purchase_date, due_date, 
    subtotal, discount_amount, tax_amount, total_amount, paid_amount, status, notes, created_by, created_at
  ) VALUES (
    po1, 'PO-20261015-001', v_sup_kf, 'INV-KF-98214', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days',
    1850000, 50000, 0, 1800000, 1800000, 'received', 'Faktur pengadaan antibiotik & analgesik bulanan.', v_owner_id, NOW() - INTERVAL '5 days'
  );

  INSERT INTO public.purchase_items (purchase_id, product_id, batch_number, expiry_date, quantity, unit_price, total_price)
  VALUES 
    (po1, 'c1000000-0000-0000-0000-000000000001', 'AMX-2026-X1', CURRENT_DATE + INTERVAL '24 months', 10, 110000, 1100000),
    (po1, 'c1000000-0000-0000-0000-000000000011', 'PCM-2026-X1', CURRENT_DATE + INTERVAL '30 months', 15, 50000, 750000);

  INSERT INTO public.purchase_payments (purchase_id, payment_date, amount, payment_method, notes, created_by)
  VALUES 
    (po1, CURRENT_DATE - INTERVAL '3 days', 1800000, 'transfer', 'Pelunasan transfer BCA INV-KF-98214', v_owner_id);

  -- PO 2: Kalbe Farma (Status: Received, BELUM LUNAS / Hutang Jatuh Tempo 28 hari lagi)
  INSERT INTO public.purchases (
    id, purchase_number, supplier_id, invoice_number, purchase_date, due_date, 
    subtotal, discount_amount, tax_amount, total_amount, paid_amount, status, notes, created_by, created_at
  ) VALUES (
    po2, 'PO-20261018-001', v_sup_klb, 'INV-KLB-1149', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '28 days',
    3500000, 100000, 0, 3400000, 1000000, 'received', 'Faktur multivitamin & obat maag tempo 30 hari.', v_owner_id, NOW() - INTERVAL '2 days'
  );

  INSERT INTO public.purchase_items (purchase_id, product_id, batch_number, expiry_date, quantity, unit_price, total_price)
  VALUES 
    (po2, 'c1000000-0000-0000-0000-000000000021', 'PRO-2026-K1', CURRENT_DATE + INTERVAL '24 months', 20, 70000, 1400000),
    (po2, 'c1000000-0000-0000-0000-000000000039', 'IMB-2026-K1', CURRENT_DATE + INTERVAL '18 months', 10, 210000, 2100000);

  INSERT INTO public.purchase_payments (purchase_id, payment_date, amount, payment_method, notes, created_by)
  VALUES 
    (po2, CURRENT_DATE - INTERVAL '1 day', 1000000, 'transfer', 'Uang muka transfer BCA INV-KLB-1149', v_owner_id);


  -- ==========================================================
  -- OPERATIONAL CASH EXPENSES (Arus Kas Keluar)
  -- ==========================================================
  IF v_cat_listrik IS NOT NULL THEN
    INSERT INTO public.cash_transactions (type, expense_category_id, amount, description, transaction_date, created_by)
    VALUES ('expense', v_cat_listrik, 420000, 'Bayar Listrik PLN Apotek Oktober 2026', CURRENT_DATE - INTERVAL '2 days', v_owner_id);
  END IF;

  IF v_cat_atk IS NOT NULL THEN
    INSERT INTO public.cash_transactions (type, expense_category_id, amount, description, transaction_date, created_by)
    VALUES ('expense', v_cat_atk, 85000, 'Beli 10 Roll Kertas Thermal Struk 80mm & Tinta', CURRENT_DATE - INTERVAL '1 day', v_owner_id);
  END IF;

  IF v_cat_lain IS NOT NULL THEN
    INSERT INTO public.cash_transactions (type, expense_category_id, amount, description, transaction_date, created_by)
    VALUES ('expense', v_cat_lain, 45000, 'Air Minum Galon & Perlengkapan Kebersihan Apotek', CURRENT_DATE, v_owner_id);
  END IF;

  -- ==========================================================
  -- STOCK MOVEMENTS (Ledger Kartu Stok)
  -- ==========================================================
  INSERT INTO public.stock_movements (product_id, batch_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, notes, performed_by, created_at)
  VALUES
    ('c1000000-0000-0000-0000-000000000001', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000001' LIMIT 1), 'sale', -20, 250, 230, 'sale', s2, 'Penjualan Resep TRX-20261018-0002', v_cashier_id, NOW() - INTERVAL '2 days'),
    ('c1000000-0000-0000-0000-000000000021', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000021' LIMIT 1), 'sale', -20, 400, 380, 'sale', s1, 'Penjualan TRX-20261018-0001', v_cashier_id, NOW() - INTERVAL '2 days'),
    ('c1000000-0000-0000-0000-000000000031', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000031' LIMIT 1), 'sale', -30, 580, 550, 'sale', s3, 'Penjualan TRX-20261018-0003', v_cashier_id, NOW() - INTERVAL '2 days'),
    ('c1000000-0000-0000-0000-000000000025', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000025' LIMIT 1), 'sale', -24, 150, 126, 'sale', s4, 'Penjualan TRX-20261019-0001', v_cashier_id, NOW() - INTERVAL '1 day'),
    ('c1000000-0000-0000-0000-000000000005', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000005' LIMIT 1), 'sale', -30, 300, 270, 'sale', s6, 'Penjualan TRX-20261019-0003', v_cashier_id, NOW() - INTERVAL '1 day'),
    ('c1000000-0000-0000-0000-000000000039', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000039' LIMIT 1), 'sale', -10, 60, 50, 'sale', s9, 'Penjualan TRX-20261020-0001', v_cashier_id, NOW() - INTERVAL '2 hours'),
    ('c1000000-0000-0000-0000-000000000028', (SELECT id FROM public.product_batches WHERE product_id = 'c1000000-0000-0000-0000-000000000028' LIMIT 1), 'sale', -1, 60, 59, 'sale', s12, 'Penjualan TRX-20261020-0004', v_cashier_id, NOW() - INTERVAL '10 minutes');

END $$;
