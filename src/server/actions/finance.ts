'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CashFlowType } from '@/lib/types/database';

export async function getExpenseCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('Error fetching expense categories:', error);
    return [];
  }
  return data;
}

export async function getCashTransactions(params?: {
  startDate?: string;
  endDate?: string;
  type?: CashFlowType;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('cash_transactions')
    .select(`
      id,
      type,
      amount,
      description,
      transaction_date,
      created_at,
      category:expense_categories(name),
      created_by_profile:profiles(full_name)
    `)
    .order('transaction_date', { ascending: false });

  if (params?.type) {
    query = query.eq('type', params.type);
  }

  if (params?.startDate) {
    query = query.gte('transaction_date', params.startDate);
  }

  if (params?.endDate) {
    query = query.lte('transaction_date', params.endDate);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching cash transactions:', error);
    return [];
  }
  return data;
}

export async function createCashTransaction(data: {
  type: CashFlowType;
  expense_category_id?: string;
  amount: number;
  description: string;
  transaction_date?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  if (data.amount <= 0) {
    return { error: 'Nominal transaksi harus lebih dari 0' };
  }

  if (!data.description.trim()) {
    return { error: 'Deskripsi transaksi wajib diisi' };
  }

  const { error } = await supabase.from('cash_transactions').insert({
    type: data.type,
    expense_category_id: data.expense_category_id || null,
    amount: data.amount,
    description: data.description.trim(),
    transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
    created_by: user.id,
  });

  if (error) {
    return { error: 'Gagal mencatat transaksi kas: ' + error.message };
  }

  revalidatePath('/finance/cash-flow');
  revalidatePath('/finance/profit-loss');
  return { success: true };
}

export async function getProfitLoss(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  // Completed sales
  let salesQuery = supabase
    .from('sales')
    .select('id, subtotal, discount_amount, tax_amount, total_amount')
    .eq('status', 'completed');

  if (startDate) salesQuery = salesQuery.gte('created_at', `${startDate}T00:00:00Z`);
  if (endDate) salesQuery = salesQuery.lte('created_at', `${endDate}T23:59:59Z`);

  const { data: sales } = await salesQuery;

  // HPP from sale_items
  let itemsQuery = supabase
    .from('sale_items')
    .select('hpp, subtotal');

  const { data: items } = await itemsQuery;

  const totalRevenue = (sales || []).reduce((sum, s) => sum + s.total_amount, 0);
  const totalHpp = (items || []).reduce((sum, it) => sum + (it.hpp || 0), 0);
  const grossProfit = totalRevenue - totalHpp;

  // Operational expenses
  let expQuery = supabase
    .from('cash_transactions')
    .select('amount, type, expense_categories(name)')
    .eq('type', 'expense');

  if (startDate) expQuery = expQuery.gte('transaction_date', startDate);
  if (endDate) expQuery = expQuery.lte('transaction_date', endDate);

  const { data: expenses } = await expQuery;

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  return {
    totalRevenue,
    totalHpp,
    grossProfit,
    grossMarginPercent: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0,
    totalExpenses,
    netProfit,
    netMarginPercent: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
    expensesList: expenses || [],
  };
}
