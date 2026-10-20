'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email atau password salah' };
    }
    return { error: 'Gagal masuk. Silakan coba lagi.' };
  }

  // Check if user is active
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, role')
      .eq('id', user.id)
      .single();

    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return { error: 'Akun Anda telah dinonaktifkan. Hubungi pemilik apotek.' };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'login',
      entity_type: 'auth',
    });
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'logout',
      entity_type: 'auth',
    });
  }

  await supabase.auth.signOut();
  redirect('/login');
}

export async function createCashierAccount(formData: FormData) {
  const supabase = await createClient();
  
  // Verify caller is owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Hanya pemilik yang dapat membuat akun kasir' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  if (!email || !password || !fullName) {
    return { error: 'Semua field wajib diisi' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' };
  }

  const adminClient = createAdminClient();
  const { data: newUser, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'cashier',
    },
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      return { error: 'Email sudah terdaftar' };
    }
    return { error: 'Gagal membuat akun: ' + error.message };
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'user',
    entity_id: newUser.user.id,
    new_values: { email, full_name: fullName, role: 'cashier' },
  });

  revalidatePath('/settings/users');
  return { success: true };
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Akses ditolak' };
  }

  // Don't allow disabling yourself
  if (userId === user.id) {
    return { error: 'Tidak dapat menonaktifkan akun sendiri' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) {
    return { error: 'Gagal mengubah status user' };
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'user',
    entity_id: userId,
    new_values: { is_active: isActive },
  });

  revalidatePath('/settings/users');
  return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tidak terautentikasi' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return { error: 'Akses ditolak' };
  }

  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter' };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { error: 'Gagal mereset password: ' + error.message };
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'user',
    entity_id: userId,
    new_values: { password_reset: true },
  });

  return { success: true };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email!,
    fullName: profile.full_name,
    role: profile.role as 'owner' | 'cashier',
    isActive: profile.is_active,
  };
}

export async function getUsers() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') return [];

  const adminClient = createAdminClient();
  const { data: authUsers } = await adminClient.auth.admin.listUsers();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (!profiles) return [];

  return profiles.map((p) => {
    const authUser = authUsers?.users.find((u) => u.id === p.id);
    return {
      id: p.id,
      email: authUser?.email || 'N/A',
      fullName: p.full_name,
      role: p.role as 'owner' | 'cashier',
      isActive: p.is_active,
      createdAt: p.created_at,
    };
  });
}
