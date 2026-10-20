-- =============================================
-- ApoTech POS - Seed Data
-- ~50 common pharmacy products with batches, suppliers, categories
-- =============================================

-- Categories
INSERT INTO public.categories (id, name, description, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Obat Resep', 'Obat yang memerlukan resep dokter', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Obat Bebas', 'Obat OTC tanpa resep', 2),
  ('a1000000-0000-0000-0000-000000000003', 'Obat Bebas Terbatas', 'Obat dengan peringatan khusus', 3),
  ('a1000000-0000-0000-0000-000000000004', 'Vitamin & Suplemen', 'Multivitamin dan suplemen kesehatan', 4),
  ('a1000000-0000-0000-0000-000000000005', 'Alat Kesehatan', 'Peralatan medis dan kesehatan', 5),
  ('a1000000-0000-0000-0000-000000000006', 'Obat Herbal', 'Produk herbal dan tradisional', 6),
  ('a1000000-0000-0000-0000-000000000007', 'Perawatan Kulit', 'Produk dermatologi dan perawatan', 7),
  ('a1000000-0000-0000-0000-000000000008', 'P3K', 'Pertolongan pertama pada kecelakaan', 8);

-- Suppliers
INSERT INTO public.suppliers (id, name, contact_person, phone, address, payment_terms_days) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'PT Kimia Farma Tbk', 'Budi Santoso', '021-4287-3800', 'Jl. Veteran No.9, Jakarta Pusat', 30),
  ('b1000000-0000-0000-0000-000000000002', 'PT Kalbe Farma Tbk', 'Siti Rahayu', '021-4287-5000', 'Jl. Let. Jend. Suprapto Kav.4, Jakarta', 30),
  ('b1000000-0000-0000-0000-000000000003', 'PT Sanbe Farma', 'Ahmad Wijaya', '022-7806-8000', 'Jl. Industri Cimareme No.8, Bandung', 45),
  ('b1000000-0000-0000-0000-000000000004', 'PT Dexa Medica', 'Rina Puspita', '0254-572-877', 'Jl. Letnan Sutopo No.17, Tangerang', 30),
  ('b1000000-0000-0000-0000-000000000005', 'PT Tempo Scan Pacific Tbk', 'Hendra Koe', '021-7530-2888', 'Jl. HR Rasuna Said Kav.3-4, Jakarta', 45);

-- =============================================
-- PRODUCTS (50 common pharmacy items)
-- =============================================

-- 1-10: Obat Resep Umum
INSERT INTO public.products (id, name, generic_name, active_ingredients, sku, barcode, category_id, dosage_form, manufacturer, drug_class, shelf_location, stock_minimum) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Amoxicillin 500mg', 'Amoxicillin', 'Amoxicillin trihydrate 500mg', 'AMX-500', '8992801001001', 'a1000000-0000-0000-0000-000000000001', 'Kapsul', 'Kimia Farma', 'keras', 'A-01-01', 50),
  ('c1000000-0000-0000-0000-000000000002', 'Cefadroxil 500mg', 'Cefadroxil', 'Cefadroxil monohydrate 500mg', 'CFD-500', '8992801001002', 'a1000000-0000-0000-0000-000000000001', 'Kapsul', 'Sanbe Farma', 'keras', 'A-01-02', 30),
  ('c1000000-0000-0000-0000-000000000003', 'Ciprofloxacin 500mg', 'Ciprofloxacin', 'Ciprofloxacin HCl 500mg', 'CIP-500', '8992801001003', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Kimia Farma', 'keras', 'A-01-03', 30),
  ('c1000000-0000-0000-0000-000000000004', 'Metformin 500mg', 'Metformin', 'Metformin HCl 500mg', 'MET-500', '8992801001004', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Dexa Medica', 'keras', 'A-02-01', 100),
  ('c1000000-0000-0000-0000-000000000005', 'Amlodipine 5mg', 'Amlodipine', 'Amlodipine besylate 5mg', 'AML-005', '8992801001005', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Dexa Medica', 'keras', 'A-02-02', 100),
  ('c1000000-0000-0000-0000-000000000006', 'Captopril 25mg', 'Captopril', 'Captopril 25mg', 'CPT-025', '8992801001006', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Kimia Farma', 'keras', 'A-02-03', 100),
  ('c1000000-0000-0000-0000-000000000007', 'Omeprazole 20mg', 'Omeprazole', 'Omeprazole 20mg', 'OMP-020', '8992801001007', 'a1000000-0000-0000-0000-000000000001', 'Kapsul', 'Kalbe Farma', 'keras', 'A-03-01', 50),
  ('c1000000-0000-0000-0000-000000000008', 'Lansoprazole 30mg', 'Lansoprazole', 'Lansoprazole 30mg', 'LNS-030', '8992801001008', 'a1000000-0000-0000-0000-000000000001', 'Kapsul', 'Kalbe Farma', 'keras', 'A-03-02', 30),
  ('c1000000-0000-0000-0000-000000000009', 'Simvastatin 20mg', 'Simvastatin', 'Simvastatin 20mg', 'SIM-020', '8992801001009', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Dexa Medica', 'keras', 'A-03-03', 50),
  ('c1000000-0000-0000-0000-000000000010', 'Losartan 50mg', 'Losartan', 'Losartan potassium 50mg', 'LOS-050', '8992801001010', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Sanbe Farma', 'keras', 'A-04-01', 50),

-- 11-20: Obat Bebas Terbatas
  ('c1000000-0000-0000-0000-000000000011', 'Paracetamol 500mg', 'Paracetamol', 'Paracetamol 500mg', 'PCM-500', '8992801002001', 'a1000000-0000-0000-0000-000000000003', 'Tablet', 'Kimia Farma', 'bebas_terbatas', 'B-01-01', 200),
  ('c1000000-0000-0000-0000-000000000012', 'Ibuprofen 400mg', 'Ibuprofen', 'Ibuprofen 400mg', 'IBU-400', '8992801002002', 'a1000000-0000-0000-0000-000000000003', 'Tablet', 'Tempo Scan', 'bebas_terbatas', 'B-01-02', 100),
  ('c1000000-0000-0000-0000-000000000013', 'Mefenamic Acid 500mg', 'Asam Mefenamat', 'Asam Mefenamat 500mg', 'MEF-500', '8992801002003', 'a1000000-0000-0000-0000-000000000003', 'Kapsul', 'Kimia Farma', 'bebas_terbatas', 'B-01-03', 50),
  ('c1000000-0000-0000-0000-000000000014', 'Antacida DOEN', 'Antasida', 'Al(OH)3 200mg + Mg(OH)2 200mg', 'ANT-DOE', '8992801002004', 'a1000000-0000-0000-0000-000000000003', 'Tablet', 'Kimia Farma', 'bebas_terbatas', 'B-02-01', 100),
  ('c1000000-0000-0000-0000-000000000015', 'Ranitidine 150mg', 'Ranitidine', 'Ranitidine HCl 150mg', 'RAN-150', '8992801002005', 'a1000000-0000-0000-0000-000000000003', 'Tablet', 'Sanbe Farma', 'bebas_terbatas', 'B-02-02', 50),
  ('c1000000-0000-0000-0000-000000000016', 'CTM 4mg', 'Chlorpheniramine', 'Chlorpheniramine maleate 4mg', 'CTM-004', '8992801002006', 'a1000000-0000-0000-0000-000000000003', 'Tablet', 'Kimia Farma', 'bebas_terbatas', 'B-02-03', 200),
  ('c1000000-0000-0000-0000-000000000017', 'Dexamethasone 0.5mg', 'Dexamethasone', 'Dexamethasone 0.5mg', 'DEX-050', '8992801002007', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Kimia Farma', 'keras', 'B-03-01', 50),
  ('c1000000-0000-0000-0000-000000000018', 'Prednisone 5mg', 'Prednisone', 'Prednisone 5mg', 'PRD-005', '8992801002008', 'a1000000-0000-0000-0000-000000000001', 'Tablet', 'Kimia Farma', 'keras', 'B-03-02', 30),
  ('c1000000-0000-0000-0000-000000000019', 'Cetirizine 10mg', 'Cetirizine', 'Cetirizine diHCl 10mg', 'CET-010', '8992801002009', 'a1000000-0000-0000-0000-000000000003', 'Tablet', 'Kalbe Farma', 'bebas_terbatas', 'B-03-03', 50),
  ('c1000000-0000-0000-0000-000000000020', 'Loratadine 10mg', 'Loratadine', 'Loratadine 10mg', 'LOR-010', '8992801002010', 'a1000000-0000-0000-0000-000000000003', 'Tablet', 'Dexa Medica', 'bebas_terbatas', 'B-04-01', 50),

-- 21-30: Obat Bebas
  ('c1000000-0000-0000-0000-000000000021', 'Promag Tablet', 'Antasida', 'Al(OH)3 + Mg(OH)2 + Simethicone', 'PRO-TAB', '8992801003001', 'a1000000-0000-0000-0000-000000000002', 'Tablet', 'Kalbe Farma', 'bebas', 'C-01-01', 100),
  ('c1000000-0000-0000-0000-000000000022', 'Bodrex Tablet', 'Paracetamol + Caffeine', 'Paracetamol 600mg + Caffeine 50mg', 'BOD-TAB', '8992801003002', 'a1000000-0000-0000-0000-000000000002', 'Tablet', 'Tempo Scan', 'bebas', 'C-01-02', 100),
  ('c1000000-0000-0000-0000-000000000023', 'Komix Obat Batuk', 'Dextromethorphan', 'DMP + GG', 'KMX-SAC', '8992801003003', 'a1000000-0000-0000-0000-000000000002', 'Sirup', 'Kalbe Farma', 'bebas', 'C-01-03', 50),
  ('c1000000-0000-0000-0000-000000000024', 'Tolak Angin Cair', 'Herbal', 'Jahe, Mint, Adas, Madu', 'TAC-SAC', '8992801003004', 'a1000000-0000-0000-0000-000000000006', 'Sirup', 'Sido Muncul', 'bebas', 'C-02-01', 100),
  ('c1000000-0000-0000-0000-000000000025', 'Entrostop Tablet', 'Attapulgite', 'Attapulgite 650mg', 'ENT-TAB', '8992801003005', 'a1000000-0000-0000-0000-000000000002', 'Tablet', 'Kalbe Farma', 'bebas', 'C-02-02', 50),
  ('c1000000-0000-0000-0000-000000000026', 'Betadine Solution 30ml', 'Povidone Iodine', 'Povidone Iodine 10%', 'BTD-030', '8992801003006', 'a1000000-0000-0000-0000-000000000008', 'Sirup', 'Tempo Scan', 'bebas', 'C-02-03', 20),
  ('c1000000-0000-0000-0000-000000000027', 'Diapet Kapsul', 'Attapulgite', 'Attapulgite + Pectin', 'DPT-KAP', '8992801003007', 'a1000000-0000-0000-0000-000000000002', 'Kapsul', 'Tempo Scan', 'bebas', 'C-03-01', 30),
  ('c1000000-0000-0000-0000-000000000028', 'OBH Combi Batuk', 'OBH', 'Succus Liquiritiae + NH4Cl + Paracetamol', 'OBH-SYR', '8992801003008', 'a1000000-0000-0000-0000-000000000002', 'Sirup', 'Kalbe Farma', 'bebas', 'C-03-02', 30),
  ('c1000000-0000-0000-0000-000000000029', 'Hansaplast Standard', 'Plester', 'Plester luka standard', 'HNS-STD', '8992801003009', 'a1000000-0000-0000-0000-000000000008', 'Lainnya', 'Beiersdorf', 'alkes', 'C-03-03', 50),
  ('c1000000-0000-0000-0000-000000000030', 'Kasa Steril 16x16', 'Kasa', 'Kasa steril', 'KAS-016', '8992801003010', 'a1000000-0000-0000-0000-000000000005', 'Lainnya', 'OneMed', 'alkes', 'C-04-01', 30),

-- 31-40: Vitamin & Suplemen
  ('c1000000-0000-0000-0000-000000000031', 'Vitamin C 500mg', 'Ascorbic Acid', 'Ascorbic Acid 500mg', 'VTC-500', '8992801004001', 'a1000000-0000-0000-0000-000000000004', 'Tablet', 'Kimia Farma', 'bebas', 'D-01-01', 100),
  ('c1000000-0000-0000-0000-000000000032', 'Vitamin B Complex', 'Vitamin B Complex', 'B1, B2, B6, B12', 'VTB-CMP', '8992801004002', 'a1000000-0000-0000-0000-000000000004', 'Tablet', 'Kimia Farma', 'bebas', 'D-01-02', 100),
  ('c1000000-0000-0000-0000-000000000033', 'Neurobion Forte', 'Vitamin B1 B6 B12', 'B1 100mg + B6 200mg + B12 200mcg', 'NRB-FOR', '8992801004003', 'a1000000-0000-0000-0000-000000000004', 'Tablet', 'Merck', 'bebas_terbatas', 'D-01-03', 50),
  ('c1000000-0000-0000-0000-000000000034', 'Calcium Lactate 500mg', 'Calcium Lactate', 'Calcium Lactate 500mg', 'CAL-500', '8992801004004', 'a1000000-0000-0000-0000-000000000004', 'Tablet', 'Kimia Farma', 'bebas', 'D-02-01', 100),
  ('c1000000-0000-0000-0000-000000000035', 'Blackmores Vitamin D3 1000IU', 'Cholecalciferol', 'Vitamin D3 1000IU', 'BLK-D3K', '8992801004005', 'a1000000-0000-0000-0000-000000000004', 'Kapsul', 'Blackmores', 'suplemen', 'D-02-02', 20),
  ('c1000000-0000-0000-0000-000000000036', 'Enervon-C Tablet', 'Multivitamin', 'Vit C + B Complex', 'ENV-CTB', '8992801004006', 'a1000000-0000-0000-0000-000000000004', 'Tablet', 'Darya-Varia', 'bebas', 'D-02-03', 50),
  ('c1000000-0000-0000-0000-000000000037', 'Sangobion Kapsul', 'Fe + Folic Acid', 'Ferrous gluconate + Folic acid', 'SGB-KAP', '8992801004007', 'a1000000-0000-0000-0000-000000000004', 'Kapsul', 'Merck', 'bebas', 'D-03-01', 30),
  ('c1000000-0000-0000-0000-000000000038', 'Zinc 20mg Tablet', 'Zinc', 'Zinc Sulfate 20mg', 'ZNC-020', '8992801004008', 'a1000000-0000-0000-0000-000000000004', 'Tablet', 'Kimia Farma', 'bebas', 'D-03-02', 100),
  ('c1000000-0000-0000-0000-000000000039', 'Imboost Force', 'Echinacea + Zinc', 'Echinacea purpurea + Zinc picolinate', 'IMB-FOR', '8992801004009', 'a1000000-0000-0000-0000-000000000004', 'Kaplet', 'Tempo Scan', 'suplemen', 'D-03-03', 30),
  ('c1000000-0000-0000-0000-000000000040', 'Hemaviton Stamina Plus', 'Multivitamin + Ginseng', 'Vit B + Ginseng + Royal Jelly', 'HMV-STP', '8992801004010', 'a1000000-0000-0000-0000-000000000004', 'Kapsul', 'Tempo Scan', 'suplemen', 'D-04-01', 20),

-- 41-50: Obat Topikal & Lainnya
  ('c1000000-0000-0000-0000-000000000041', 'Bioplacenton Gel', 'Neomycin + Placenta Extract', 'Neomycin sulfate + Placenta extract', 'BPL-GEL', '8992801005001', 'a1000000-0000-0000-0000-000000000007', 'Gel', 'Kalbe Farma', 'bebas_terbatas', 'E-01-01', 20),
  ('c1000000-0000-0000-0000-000000000042', 'Thrombophob Gel', 'Heparin', 'Heparinoid 20.000IU', 'TRP-GEL', '8992801005002', 'a1000000-0000-0000-0000-000000000007', 'Gel', 'Tempo Scan', 'bebas_terbatas', 'E-01-02', 15),
  ('c1000000-0000-0000-0000-000000000043', 'Voltaren Emulgel', 'Diclofenac', 'Diclofenac diethylamine 1%', 'VLT-GEL', '8992801005003', 'a1000000-0000-0000-0000-000000000007', 'Gel', 'Novartis', 'bebas_terbatas', 'E-01-03', 15),
  ('c1000000-0000-0000-0000-000000000044', 'Miconazole Cream 2%', 'Miconazole', 'Miconazole nitrate 2%', 'MCZ-CRM', '8992801005004', 'a1000000-0000-0000-0000-000000000007', 'Krim', 'Kimia Farma', 'keras', 'E-02-01', 15),
  ('c1000000-0000-0000-0000-000000000045', 'Ketoconazole Cream 2%', 'Ketoconazole', 'Ketoconazole 2%', 'KTZ-CRM', '8992801005005', 'a1000000-0000-0000-0000-000000000007', 'Krim', 'Kimia Farma', 'keras', 'E-02-02', 15),
  ('c1000000-0000-0000-0000-000000000046', 'Insto Tetes Mata', 'Tetrahydrozoline', 'Tetrahydrozoline HCl 0.05%', 'INS-TTS', '8992801005006', 'a1000000-0000-0000-0000-000000000002', 'Tetes Mata', 'Tempo Scan', 'bebas', 'E-02-03', 20),
  ('c1000000-0000-0000-0000-000000000047', 'Cendo Xitrol TM', 'Dexamethasone + Neomycin + Polymyxin B', 'Dex 1mg + Neo 3.5mg + Pol 6000IU', 'CDX-TM5', '8992801005007', 'a1000000-0000-0000-0000-000000000001', 'Tetes Mata', 'Cendo', 'keras', 'E-03-01', 10),
  ('c1000000-0000-0000-0000-000000000048', 'Masker Medis 3 Ply', 'Masker', 'Masker medis 3 lapis', 'MSK-3PL', '8992801005008', 'a1000000-0000-0000-0000-000000000005', 'Lainnya', 'OneMed', 'alkes', 'E-03-02', 100),
  ('c1000000-0000-0000-0000-000000000049', 'Sarung Tangan Latex M', 'Sarung Tangan', 'Sarung tangan latex ukuran M', 'STG-LTM', '8992801005009', 'a1000000-0000-0000-0000-000000000005', 'Lainnya', 'OneMed', 'alkes', 'E-03-03', 50),
  ('c1000000-0000-0000-0000-000000000050', 'Alkohol 70% 100ml', 'Ethanol', 'Ethanol 70%', 'ALK-100', '8992801005010', 'a1000000-0000-0000-0000-000000000008', 'Sirup', 'OneMed', 'bebas', 'E-04-01', 30);

-- =============================================
-- PRODUCT UNITS (multi-unit conversions)
-- =============================================

-- Amoxicillin: Kapsul (1), Strip (10), Box (100)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Kapsul', 1, 1500, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000001', 'Strip', 10, 14000, FALSE, 2),
  ('c1000000-0000-0000-0000-000000000001', 'Box', 100, 130000, FALSE, 3);

-- Cefadroxil: Kapsul (1), Strip (10), Box (50)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'Kapsul', 1, 2500, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Strip', 10, 23000, FALSE, 2);

-- Ciprofloxacin: Tablet (1), Strip (10)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'Tablet', 1, 2000, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000003', 'Strip', 10, 18000, FALSE, 2);

-- Metformin: Tablet (1), Strip (10), Box (100)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000004', 'Tablet', 1, 800, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000004', 'Strip', 10, 7500, FALSE, 2),
  ('c1000000-0000-0000-0000-000000000004', 'Box', 100, 70000, FALSE, 3);

-- Amlodipine: Tablet (1), Strip (10)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000005', 'Tablet', 1, 1200, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000005', 'Strip', 10, 11000, FALSE, 2);

-- Paracetamol: Tablet (1), Strip (10), Box (100)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000011', 'Tablet', 1, 500, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000011', 'Strip', 10, 4500, FALSE, 2),
  ('c1000000-0000-0000-0000-000000000011', 'Box', 100, 42000, FALSE, 3);

-- Ibuprofen: Tablet (1), Strip (10)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000012', 'Tablet', 1, 1000, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000012', 'Strip', 10, 9000, FALSE, 2);

-- Vitamin C: Tablet (1), Strip (10), Botol (100)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000031', 'Tablet', 1, 500, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000031', 'Strip', 10, 4500, FALSE, 2),
  ('c1000000-0000-0000-0000-000000000031', 'Botol', 100, 40000, FALSE, 3);

-- Promag: Tablet (1), Strip (10)
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000021', 'Tablet', 1, 700, TRUE, 1),
  ('c1000000-0000-0000-0000-000000000021', 'Strip', 10, 6500, FALSE, 2);

-- Remaining products with default single unit
INSERT INTO public.product_units (product_id, unit_name, conversion_factor, sell_price, is_default, sort_order)
SELECT id, 
  CASE dosage_form 
    WHEN 'Tablet' THEN 'Tablet'
    WHEN 'Kapsul' THEN 'Kapsul'
    WHEN 'Kaplet' THEN 'Kaplet'
    WHEN 'Sirup' THEN 'Botol'
    WHEN 'Krim' THEN 'Tube'
    WHEN 'Gel' THEN 'Tube'
    WHEN 'Salep' THEN 'Tube'
    WHEN 'Tetes Mata' THEN 'Botol'
    WHEN 'Tetes Telinga' THEN 'Botol'
    ELSE 'Buah'
  END,
  1,
  CASE 
    WHEN drug_class = 'alkes' THEN 15000
    WHEN drug_class = 'suplemen' THEN 25000
    ELSE 5000
  END,
  TRUE,
  1
FROM public.products
WHERE id NOT IN (
  SELECT DISTINCT product_id FROM public.product_units
);

-- =============================================
-- PRODUCT BATCHES (with varying expiry dates)
-- =============================================

-- Use dates relative to now. These batches have various expiry dates for testing.
INSERT INTO public.product_batches (product_id, batch_number, expiry_date, buy_price, current_stock) VALUES
  -- Amoxicillin batches
  ('c1000000-0000-0000-0000-000000000001', 'AMX-2025-A', CURRENT_DATE + INTERVAL '6 months', 800, 200),
  ('c1000000-0000-0000-0000-000000000001', 'AMX-2025-B', CURRENT_DATE + INTERVAL '12 months', 850, 300),
  ('c1000000-0000-0000-0000-000000000001', 'AMX-2024-Z', CURRENT_DATE + INTERVAL '15 days', 750, 50),  -- expiring soon!

  -- Cefadroxil
  ('c1000000-0000-0000-0000-000000000002', 'CFD-2025-A', CURRENT_DATE + INTERVAL '10 months', 1500, 150),
  
  -- Ciprofloxacin
  ('c1000000-0000-0000-0000-000000000003', 'CIP-2025-A', CURRENT_DATE + INTERVAL '8 months', 1200, 100),
  
  -- Metformin
  ('c1000000-0000-0000-0000-000000000004', 'MET-2025-A', CURRENT_DATE + INTERVAL '18 months', 400, 500),
  ('c1000000-0000-0000-0000-000000000004', 'MET-2025-B', CURRENT_DATE + INTERVAL '24 months', 420, 300),
  
  -- Amlodipine
  ('c1000000-0000-0000-0000-000000000005', 'AML-2025-A', CURRENT_DATE + INTERVAL '14 months', 700, 300),
  
  -- Captopril
  ('c1000000-0000-0000-0000-000000000006', 'CPT-2025-A', CURRENT_DATE + INTERVAL '9 months', 500, 200),
  
  -- Omeprazole
  ('c1000000-0000-0000-0000-000000000007', 'OMP-2025-A', CURRENT_DATE + INTERVAL '7 months', 1500, 100),
  
  -- Lansoprazole
  ('c1000000-0000-0000-0000-000000000008', 'LNS-2025-A', CURRENT_DATE + INTERVAL '11 months', 2000, 80),
  
  -- Simvastatin
  ('c1000000-0000-0000-0000-000000000009', 'SIM-2025-A', CURRENT_DATE + INTERVAL '16 months', 1000, 200),
  
  -- Losartan
  ('c1000000-0000-0000-0000-000000000010', 'LOS-2025-A', CURRENT_DATE + INTERVAL '13 months', 1200, 150),

  -- Paracetamol (high volume)
  ('c1000000-0000-0000-0000-000000000011', 'PCM-2025-A', CURRENT_DATE + INTERVAL '20 months', 250, 1000),
  ('c1000000-0000-0000-0000-000000000011', 'PCM-2025-B', CURRENT_DATE + INTERVAL '24 months', 260, 500),
  ('c1000000-0000-0000-0000-000000000011', 'PCM-2024-Z', CURRENT_DATE + INTERVAL '25 days', 240, 100), -- expiring soon!
  
  -- Ibuprofen
  ('c1000000-0000-0000-0000-000000000012', 'IBU-2025-A', CURRENT_DATE + INTERVAL '15 months', 600, 300),
  
  -- Mefenamic Acid
  ('c1000000-0000-0000-0000-000000000013', 'MEF-2025-A', CURRENT_DATE + INTERVAL '12 months', 700, 200),
  
  -- Antacida
  ('c1000000-0000-0000-0000-000000000014', 'ANT-2025-A', CURRENT_DATE + INTERVAL '18 months', 200, 500),
  
  -- CTM
  ('c1000000-0000-0000-0000-000000000016', 'CTM-2025-A', CURRENT_DATE + INTERVAL '22 months', 100, 1000),
  
  -- Cetirizine
  ('c1000000-0000-0000-0000-000000000019', 'CET-2025-A', CURRENT_DATE + INTERVAL '14 months', 500, 200),
  
  -- Promag
  ('c1000000-0000-0000-0000-000000000021', 'PRO-2025-A', CURRENT_DATE + INTERVAL '16 months', 350, 400),
  
  -- Bodrex
  ('c1000000-0000-0000-0000-000000000022', 'BOD-2025-A', CURRENT_DATE + INTERVAL '20 months', 300, 300),
  
  -- Vitamin C
  ('c1000000-0000-0000-0000-000000000031', 'VTC-2025-A', CURRENT_DATE + INTERVAL '24 months', 200, 500),
  ('c1000000-0000-0000-0000-000000000031', 'VTC-2024-Z', CURRENT_DATE + INTERVAL '20 days', 180, 80), -- expiring soon!
  
  -- Vitamin B Complex
  ('c1000000-0000-0000-0000-000000000032', 'VTB-2025-A', CURRENT_DATE + INTERVAL '18 months', 150, 400),
  
  -- Remaining products get one standard batch
  ('c1000000-0000-0000-0000-000000000015', 'RAN-2025-A', CURRENT_DATE + INTERVAL '10 months', 800, 150),
  ('c1000000-0000-0000-0000-000000000017', 'DEX-2025-A', CURRENT_DATE + INTERVAL '14 months', 300, 200),
  ('c1000000-0000-0000-0000-000000000018', 'PRD-2025-A', CURRENT_DATE + INTERVAL '12 months', 350, 100),
  ('c1000000-0000-0000-0000-000000000020', 'LOR-2025-A', CURRENT_DATE + INTERVAL '16 months', 600, 200),
  ('c1000000-0000-0000-0000-000000000023', 'KMX-2025-A', CURRENT_DATE + INTERVAL '18 months', 2500, 100),
  ('c1000000-0000-0000-0000-000000000024', 'TAC-2025-A', CURRENT_DATE + INTERVAL '12 months', 3000, 200),
  ('c1000000-0000-0000-0000-000000000025', 'ENT-2025-A', CURRENT_DATE + INTERVAL '20 months', 1000, 150),
  ('c1000000-0000-0000-0000-000000000026', 'BTD-2025-A', CURRENT_DATE + INTERVAL '24 months', 8000, 50),
  ('c1000000-0000-0000-0000-000000000027', 'DPT-2025-A', CURRENT_DATE + INTERVAL '15 months', 1500, 80),
  ('c1000000-0000-0000-0000-000000000028', 'OBH-2025-A', CURRENT_DATE + INTERVAL '18 months', 5000, 60),
  ('c1000000-0000-0000-0000-000000000029', 'HNS-2025-A', CURRENT_DATE + INTERVAL '36 months', 800, 200),
  ('c1000000-0000-0000-0000-000000000030', 'KAS-2025-A', CURRENT_DATE + INTERVAL '36 months', 3000, 100),
  ('c1000000-0000-0000-0000-000000000033', 'NRB-2025-A', CURRENT_DATE + INTERVAL '18 months', 2000, 150),
  ('c1000000-0000-0000-0000-000000000034', 'CAL-2025-A', CURRENT_DATE + INTERVAL '24 months', 150, 300),
  ('c1000000-0000-0000-0000-000000000035', 'BLK-2025-A', CURRENT_DATE + INTERVAL '20 months', 15000, 40),
  ('c1000000-0000-0000-0000-000000000036', 'ENV-2025-A', CURRENT_DATE + INTERVAL '18 months', 600, 200),
  ('c1000000-0000-0000-0000-000000000037', 'SGB-2025-A', CURRENT_DATE + INTERVAL '16 months', 1500, 100),
  ('c1000000-0000-0000-0000-000000000038', 'ZNC-2025-A', CURRENT_DATE + INTERVAL '22 months', 300, 400),
  ('c1000000-0000-0000-0000-000000000039', 'IMB-2025-A', CURRENT_DATE + INTERVAL '14 months', 4000, 60),
  ('c1000000-0000-0000-0000-000000000040', 'HMV-2025-A', CURRENT_DATE + INTERVAL '12 months', 3500, 50),
  ('c1000000-0000-0000-0000-000000000041', 'BPL-2025-A', CURRENT_DATE + INTERVAL '18 months', 5000, 40),
  ('c1000000-0000-0000-0000-000000000042', 'TRP-2025-A', CURRENT_DATE + INTERVAL '20 months', 12000, 30),
  ('c1000000-0000-0000-0000-000000000043', 'VLT-2025-A', CURRENT_DATE + INTERVAL '16 months', 15000, 25),
  ('c1000000-0000-0000-0000-000000000044', 'MCZ-2025-A', CURRENT_DATE + INTERVAL '14 months', 4000, 40),
  ('c1000000-0000-0000-0000-000000000045', 'KTZ-2025-A', CURRENT_DATE + INTERVAL '12 months', 5000, 35),
  ('c1000000-0000-0000-0000-000000000046', 'INS-2025-A', CURRENT_DATE + INTERVAL '18 months', 6000, 60),
  ('c1000000-0000-0000-0000-000000000047', 'CDX-2025-A', CURRENT_DATE + INTERVAL '10 months', 18000, 20),
  ('c1000000-0000-0000-0000-000000000048', 'MSK-2025-A', CURRENT_DATE + INTERVAL '36 months', 2000, 500),
  ('c1000000-0000-0000-0000-000000000049', 'STG-2025-A', CURRENT_DATE + INTERVAL '36 months', 5000, 200),
  ('c1000000-0000-0000-0000-000000000050', 'ALK-2025-A', CURRENT_DATE + INTERVAL '24 months', 5000, 100);
