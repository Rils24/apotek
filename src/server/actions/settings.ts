'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSettings(key: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data.value;
}

export async function updateSettings(key: string, value: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat mengubah pengaturan sistem' };
  }

  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { error: 'Gagal menyimpan pengaturan: ' + error.message };
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'settings',
    new_values: { key, value },
  });

  revalidatePath('/settings/pharmacy');
  revalidatePath('/settings/receipt');
  return { success: true };
}

export async function getAuditLogs(limit = 100) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address,
      created_at,
      user:profiles(full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data;
}
