// Rupiah formatter & date utilities for Indonesian locale
// All money values are stored as integer (Rupiah, no decimals)

/**
 * Format integer Rupiah to display string
 * @example formatRupiah(12500) → "Rp 12.500"
 * @example formatRupiah(0) → "Rp 0"
 * @example formatRupiah(-5000) → "-Rp 5.000"
 */
export function formatRupiah(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${isNegative ? '-' : ''}Rp ${formatted}`;
}

/**
 * Parse Rupiah string back to integer
 * @example parseRupiah("Rp 12.500") → 12500
 * @example parseRupiah("12500") → 12500
 */
export function parseRupiah(value: string): number {
  const cleaned = value.replace(/[^\d-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format number with Indonesian locale (thousands separator)
 * @example formatNumber(1500) → "1.500"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}

/**
 * Format date to Indonesian locale
 * @example formatDate(new Date()) → "20 Okt 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Short date format
 * @example formatDateShort("2026-10-20") → "20/10/2026"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Full Indonesian date with day name
 * @example formatDateIndonesian(new Date()) → "Selasa, 20 Oktober 2026"
 */
export function formatDateIndonesian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Format date with time
 * @example formatDateTime(new Date()) → "20 Okt 2026, 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Format time only
 * @example formatTime(new Date()) → "14:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 */
export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate ceiling for discount percentage (benefits pharmacy)
 * @example ceilDiscount(15750, 10) → 1575 (10% of 15750)
 * @example ceilDiscount(15001, 10) → 1501 (ceil of 1500.1)
 */
export function ceilDiscount(amount: number, percentage: number): number {
  return Math.ceil((amount * percentage) / 100);
}

/**
 * Calculate discount amount (flat or percentage)
 */
export function calculateDiscount(
  subtotal: number,
  discountType: 'nominal' | 'percent',
  discountValue: number
): number {
  if (discountType === 'nominal') {
    return Math.min(discountValue, subtotal);
  }
  return ceilDiscount(subtotal, discountValue);
}
