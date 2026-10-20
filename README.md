# ApoTech - Sistem POS dan Manajemen Apotek Terintegrasi

ApoTech adalah sistem Point of Sale (POS) dan Enterprise Resource Planning (ERP) ritel farmasi berbasis web yang dirancang untuk mendukung operasional harian apotek secara menyeluruh, akurat, dan sesuai dengan standar regulasi kefarmasian di Indonesia.

Aplikasi ini mengimplementasikan pemisahan hak akses berbasis peran (Role-Based Access Control), manajemen inventaris berbasis tanggal kedaluwarsa (First Expired, First Out / FEFO), transaksi multi-satuan dengan konversi otomatis, pencatatan mutasi kartu stok permanen (immutable), integrasi pembelian Pedagang Besar Farmasi (PBF), pelacakan hutang usaha, serta laporan keuangan laba rugi berbasis Harga Pokok Penjualan (HPP) riil.

---

## 1. Spesifikasi Teknologi

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Bahasa Pemrograman**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Database & Otentikasi**: Supabase PostgreSQL dengan Row Level Security (RLS) dan Remote Procedure Call (RPC) atomik
- **Konektor Supabase**: `@supabase/ssr` (Server Actions, Server Components, Route Handlers, dan Client Components)
- **Komponen & Visualisasi**: Radix UI Primitives, Recharts, Lucide Icons
- **Manajemen Formulir & Validasi**: React Hook Form, Zod
- **Data Fetching**: TanStack React Query

---

## 2. Fitur Utama Sistem

### 2.1. Modul Point of Sale (POS)
- **Alur FEFO Otomatis**: Pengurangan stok obat saat kasir menyelesaikan transaksi dilakukan melalui fungsi database atomik `checkout_sale`, yang secara otomatis memprioritaskan batch dengan tanggal kedaluwarsa paling dekat.
- **Pencarian Cepat**: Pencarian produk instan berdasarkan nama dagang, nama zat aktif (generik), kode SKU, atau pemindaian barcode.
- **Multi-Satuan Dinamis**: Pasien dapat membeli obat dalam satuan terkecil (Tablet, Kapsul), satuan menengah (Strip), maupun kemasan besar (Box/Botol) dengan perhitungan harga dan stok dasar secara otomatis.
- **Validasi Resep Dokter**: Input wajib untuk nama dokter dan nomor resep pada transaksi obat keras, psikotropika, dan narkotika sesuai regulasi kefarmasian.
- **Dukungan Pembayaran Fleksibel**: Transaksi dapat diselesaikan dengan Tunai (otomatis menghitung uang kembalian), QRIS, Transfer Bank, dan Kartu Debit.
- **Cetak Struk Termal**: Pratinjau dan fungsi cetak langsung untuk printer thermal ukuran 58mm dan 80mm.
- **Penangguhan Transaksi (Hold)**: Fitur menahan keranjang belanja sementara jika pasien ingin mengambil barang tambahan, dan melanjutkannya kembali tanpa kehilangan data.
- **Pintasan Keyboard (Shortcuts)**:
  - `[F2]`: Fokus pencarian produk
  - `[F4]`: Buka modal pembayaran
  - `[F8]`: Menahan transaksi (Hold)
  - `[Esc]`: Menutup dialog atau membatalkan operasi

### 2.2. Manajemen Inventaris dan Pengawasan Obat
- **Klasifikasi Golongan Obat**: Pengelompokan sediaan farmasi sesuai regulasi BPOM: Obat Bebas, Obat Bebas Terbatas, Obat Keras, Psikotropika, Narkotika, Alat Kesehatan, dan Suplemen.
- **Pengawasan Batch dan Kedaluwarsa**: Pemantauan masa simpan obat dengan indikator peringatan dini (kritis <30 hari, peringatan 30-60 hari, dan perhatian 60-90 hari).
- **Kartu Stok Permanen (Immutable)**: Seluruh pergerakan barang (penjualan, pembelian, void, opname, dan penyesuaian) tercatat secara permanen di tabel mutasi stok sebagai rekam jejak audit yang tidak dapat dimanipulasi.
- **Stock Opname**: Pencatatan perhitungan fisik stok berkala di rak penyimpanan dan penyesuaian otomatis terhadap selisih sistem.
- **Penyesuaian Stok (Stock Adjustment)**: Koreksi stok manual untuk obat rusak, pecah, atau kedaluwarsa dengan kewajiban mencantumkan alasan.

### 2.3. Pengadaan dan Hutang Usaha (PBF)
- **Pesanan Pembelian (Purchase Order)**: Pembuatan dokumen pesanan resmi ke Pedagang Besar Farmasi (PBF).
- **Penerimaan Barang**: Penerimaan barang fisik otomatis menghasilkan nomor batch baru, menetapkan tanggal kedaluwarsa, memperbarui harga beli (HPP), dan menambah kuantitas stok di sistem.
- **Buku Hutang Usaha (Accounts Payable)**: Manajemen faktur tempo supplier dengan pelacakan tanggal jatuh tempo, sisa tagihan, dan riwayat pembayaran cicilan/pelunasan.

### 2.4. Keuangan dan Analisis Bisnis
- **Laporan Laba Rugi (P&L)**: Perhitungan pendapatan kotor, Harga Pokok Penjualan (HPP) riil dari batch yang terjual, laba kotor, beban operasional apotek, dan margin laba bersih.
- **Buku Arus Kas (Cash Flow)**: Pencatatan penerimaan dan pengeluaran operasional di luar transaksi penjualan (beban listrik, sewa, ATK struk, kebersihan, dan gaji).
- **Valuasi Aset Persediaan**: Perhitungan total nilai aset persediaan obat berdasarkan kuantitas stok dikalikan harga beli dasar.

### 2.5. Pelaporan Regulasi Farmasi
- **Laporan Narkotika dan Psikotropika**: Format register pelayanan obat golongan narkotika dan psikotropika yang disesuaikan dengan kebutuhan pelaporan SIPNAP Kementerian Kesehatan RI (memuat nomor resep, dokter peresep, dan tanggal penyerahan).
- **Laporan Obat Kedaluwarsa**: Deteksi dini obat yang telah melewati tanggal batas edar atau mendekati kedaluwarsa untuk keperluan retur ke distributor.

### 2.6. Keamanan dan Hak Akses Pengguna (RBAC)
- **Role Kasir**:
  - Melayani transaksi POS dan pembayaran.
  - Membuka dan menutup shift kasir.
  - Melihat ketersediaan stok obat.
  - Mencetak ulang nota transaksi shift berjalan.
  - **Proteksi HPP**: Harga Pokok Penjualan (HPP), harga beli PBF, margin keuntungan, dan laporan keuangan disembunyikan sepenuhnya dari kasir.
- **Role Pemilik (Owner)**:
  - Akses penuh ke seluruh konfigurasi sistem.
  - Manajemen master data obat, satuan, dan harga.
  - Pengadaan barang dan hutang usaha.
  - Laporan keuangan, audit log, dan profil apotek (SIA, SIPA, APA).
  - Otorisasi pembatalan transaksi (Void) dengan pencatatan alasan wajib.
  - Pengelolaan akun kasir (tambah kasir, aktivasi/nonaktifkan akun, reset kata sandi).

---

## 3. Struktur Direktori Proyek

```
Apotek/
├── public/                 # Aset statis
├── src/
│   ├── app/
│   │   ├── (app)/          # Rute terlindungi (Dashboard, POS, Produk, dll)
│   │   │   ├── audit-log/
│   │   │   ├── dashboard/
│   │   │   ├── finance/    # Arus Kas, Laba Rugi, Hutang Usaha
│   │   │   ├── inventory/  # Batch, Kartu Stok, Opname, Penyesuaian
│   │   │   ├── pos/        # Layar Penjualan Kasir
│   │   │   ├── products/   # Master Data Produk & Multi-Satuan
│   │   │   ├── purchases/  # Pembelian PBF & Faktur
│   │   │   ├── reports/    # Laporan Penjualan, Stok, Expiry, SIPNAP
│   │   │   ├── settings/   # Identitas Apotek, Format Struk, Pengguna
│   │   │   ├── suppliers/  # Master Data Distributor / PBF
│   │   │   └── transactions/# Riwayat Transaksi & Void
│   │   ├── (auth)/         # Halaman Otentikasi (Login)
│   │   ├── globals.css     # Design System & Styling Dasar
│   │   └── layout.tsx      # Root Layout dengan Providers
│   ├── components/
│   │   ├── features/       # Komponen fungsional POS, Layout, Dashboard
│   │   ├── providers/      # React Query Provider
│   │   └── ui/             # Komponen antarmuka (Button, Dialog, Table, dll)
│   ├── hooks/              # Custom React Hooks (usePos, dll)
│   ├── lib/
│   │   ├── constants.ts    # Konstanta sistem & enum farmasi
│   │   ├── format.ts       # Pemformatan Rupiah, Angka, Tanggal id-ID
│   │   ├── supabase/       # Client, Server, Admin, dan Middleware
│   │   ├── types/          # Definisi TypeScript Database
│   │   └── validators/     # Skema validasi Zod
│   ├── middleware.ts       # Verifikasi sesi & proteksi rute RBAC
│   └── server/
│       └── actions/        # Server Actions (Auth, Sales, Inventory, dll)
└── supabase/
    └── migrations/         # Skrip SQL skema, RLS, RPC, dan data awal
```

---

## 4. Persyaratan Sistem

- Node.js versi 18.18.0 atau lebih baru (disarankan Node.js 20 LTS)
- NPM versi 9.0.0 atau lebih baru
- Akun dan Project PostgreSQL Supabase aktif

---

## 5. Panduan Instalasi dan Menjalankan

### Langkah 1: Kloning Repositori
```bash
git clone https://github.com/Rils24/apotek.git
cd apotek
```

### Langkah 2: Instalasi Dependensi
```bash
npm install
```

### Langkah 3: Konfigurasi Environment Variables
Salin file template `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Buka `.env.local` dan lengkapi konfigurasi berikut dari menu **Project Settings > API** di dashboard Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1Ni...
```

### Langkah 4: Menjalankan Migrasi Database
Buka menu **SQL Editor** pada dashboard project Supabase Anda, kemudian eksekusi file migrasi di folder `supabase/migrations/` secara berurutan:
1. `00001_initial_schema.sql`: Definisi tabel, relasi, tipe enum, dan trigger.
2. `00002_rls_policies.sql`: Kebijakan Row Level Security untuk pemisahan data per role.
3. `00003_rpc_functions.sql`: Fungsi transaksi atomik (checkout FEFO, void sale, receive purchase, close shift).
4. `00004_seed_data.sql`: 50 master obat standar farmasi Indonesia, multi-satuan, supplier, dan data batch awal.
5. *(Opsional)* `00005_seed_transactions.sql`: Data simulasi operasional (12 transaksi penjualan, shift kasir, faktur tempo PBF, pengeluaran kas, dan kartu stok).

### Langkah 5: Membuat Akun Pengguna Awal
Di dashboard Supabase, buka menu **Authentication > Users**, lalu buat akun berikut:
- **Akun Pemilik**:
  - Email: `pemilik@apotech.com`
  - Kata Sandi: `password123`
  - Centang opsi Auto Confirm User.
  - Jalankan query berikut di SQL Editor untuk menetapkan role pemilik:
    ```sql
    UPDATE public.profiles SET role = 'owner' WHERE id = (SELECT id FROM auth.users WHERE email = 'pemilik@apotech.com');
    ```
- **Akun Kasir**:
  - Email: `kasir@apotech.com`
  - Kata Sandi: `password123`
  - Centang opsi Auto Confirm User (akun baru otomatis memiliki role `cashier`).

### Langkah 6: Menjalankan Server Development
```bash
npm run dev
```
Akses aplikasi melalui browser pada alamat `http://localhost:3000`.

---

## 6. Verifikasi Kompilasi Produksi (Production Build)

Aplikasi telah divalidasi dan lolos kompilasi produksi Next.js secara optimal:
```bash
npm run build
```
Seluruh 28 rute terverifikasi bebas dari kesalahan TypeScript maupun render error.

---

## 7. Lisensi

Hak cipta dilindungi undang-undang. Sistem ini dikembangkan untuk keperluan operasional ritel farmasi dan portofolio profesional.
