// Application constants

export const APP_NAME = 'ApoTech';
export const APP_DESCRIPTION = 'Sistem POS & Manajemen Apotek';

// User Roles
export const ROLES = {
  OWNER: 'owner',
  CASHIER: 'cashier',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// Drug classifications
export const DRUG_CLASSES = {
  bebas: 'Obat Bebas',
  bebas_terbatas: 'Obat Bebas Terbatas',
  keras: 'Obat Keras',
  psikotropika: 'Psikotropika',
  narkotika: 'Narkotika',
  alkes: 'Alat Kesehatan',
  suplemen: 'Suplemen',
} as const;

export type DrugClass = keyof typeof DRUG_CLASSES;

// Dosage forms
export const DOSAGE_FORMS = [
  'Tablet',
  'Kapsul',
  'Kaplet',
  'Sirup',
  'Suspensi',
  'Emulsi',
  'Salep',
  'Krim',
  'Gel',
  'Tetes Mata',
  'Tetes Telinga',
  'Tetes Hidung',
  'Inhaler',
  'Injeksi',
  'Suppositoria',
  'Ovula',
  'Serbuk',
  'Granul',
  'Patch',
  'Lainnya',
] as const;

// Common product units
export const COMMON_UNITS = [
  'Tablet',
  'Kapsul',
  'Kaplet',
  'Strip',
  'Blister',
  'Box',
  'Botol',
  'Tube',
  'Sachet',
  'Ampul',
  'Vial',
  'Butir',
  'Lembar',
  'Pasang',
  'Buah',
  'Pot',
] as const;

// Payment methods
export const PAYMENT_METHODS = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
  debit: 'Kartu Debit',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

// Stock movement types
export const MOVEMENT_TYPES = {
  sale: 'Penjualan',
  purchase: 'Pembelian',
  adjustment: 'Penyesuaian',
  opname: 'Stok Opname',
  void: 'Void',
} as const;

export type MovementType = keyof typeof MOVEMENT_TYPES;

// Purchase statuses
export const PURCHASE_STATUSES = {
  draft: 'Draft',
  received: 'Diterima',
  partial: 'Bayar Sebagian',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
} as const;

// Sale statuses
export const SALE_STATUSES = {
  completed: 'Selesai',
  voided: 'Dibatalkan',
} as const;

// Shift statuses
export const SHIFT_STATUSES = {
  open: 'Berjalan',
  closed: 'Ditutup',
} as const;

// Cash flow types
export const CASH_FLOW_TYPES = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
} as const;

// Quick cash denominations for POS
export const QUICK_CASH_AMOUNTS = [
  5_000,
  10_000,
  20_000,
  50_000,
  100_000,
  200_000,
  500_000,
] as const;

// Keyboard shortcuts
export const SHORTCUTS = {
  SEARCH: 'F2',
  PAY: 'F4',
  HOLD: 'F8',
  CANCEL: 'Escape',
  CONFIRM: 'Enter',
} as const;

// Sidebar navigation
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['owner', 'cashier'],
  },
  {
    label: 'POS / Kasir',
    href: '/pos',
    icon: 'Monitor',
    roles: ['owner', 'cashier'],
  },
  {
    label: 'Produk',
    href: '/products',
    icon: 'Package',
    roles: ['owner', 'cashier'],
  },
  {
    label: 'Inventori',
    href: '/inventory',
    icon: 'Warehouse',
    roles: ['owner'],
    children: [
      { label: 'Batch & Kedaluwarsa', href: '/inventory/batches', icon: 'Layers', roles: ['owner'] },
      { label: 'Stok Opname', href: '/inventory/opname', icon: 'ClipboardCheck', roles: ['owner'] },
      { label: 'Penyesuaian Stok', href: '/inventory/adjustments', icon: 'ArrowLeftRight', roles: ['owner'] },
      { label: 'Kartu Stok', href: '/inventory/stock-card', icon: 'FileText', roles: ['owner'] },
    ],
  },
  {
    label: 'Pembelian',
    href: '/purchases',
    icon: 'ShoppingCart',
    roles: ['owner'],
  },
  {
    label: 'Supplier',
    href: '/suppliers',
    icon: 'Truck',
    roles: ['owner'],
  },
  {
    label: 'Keuangan',
    href: '/finance',
    icon: 'Wallet',
    roles: ['owner'],
    children: [
      { label: 'Arus Kas', href: '/finance/cash-flow', icon: 'ArrowUpDown', roles: ['owner'] },
      { label: 'Laba Rugi', href: '/finance/profit-loss', icon: 'TrendingUp', roles: ['owner'] },
      { label: 'Hutang Usaha', href: '/finance/payables', icon: 'CreditCard', roles: ['owner'] },
    ],
  },
  {
    label: 'Laporan',
    href: '/reports',
    icon: 'BarChart3',
    roles: ['owner'],
    children: [
      { label: 'Penjualan', href: '/reports/sales', icon: 'Receipt', roles: ['owner'] },
      { label: 'Stok & Persediaan', href: '/reports/stock', icon: 'PackageSearch', roles: ['owner'] },
      { label: 'Kedaluwarsa', href: '/reports/expiry', icon: 'Calendar', roles: ['owner'] },
      { label: 'Obat Khusus', href: '/reports/narcotics', icon: 'ShieldAlert', roles: ['owner'] },
    ],
  },
  {
    label: 'Riwayat Transaksi',
    href: '/transactions',
    icon: 'History',
    roles: ['owner', 'cashier'],
  },
  {
    label: 'Pengaturan',
    href: '/settings',
    icon: 'Settings',
    roles: ['owner'],
    children: [
      { label: 'Profil Apotek', href: '/settings/pharmacy', icon: 'Building2', roles: ['owner'] },
      { label: 'Manajemen User', href: '/settings/users', icon: 'Users', roles: ['owner'] },
      { label: 'Struk & PPN', href: '/settings/receipt', icon: 'Printer', roles: ['owner'] },
    ],
  },
  {
    label: 'Audit Log',
    href: '/audit-log',
    icon: 'ScrollText',
    roles: ['owner'],
  },
];

// Expiry warning thresholds (days)
export const EXPIRY_THRESHOLDS = {
  CRITICAL: 30,
  WARNING: 60,
  NOTICE: 90,
} as const;
