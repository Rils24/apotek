import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/features/layout/app-shell';
import type { UserRole } from '@/lib/types/database';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login?error=account_disabled');
  }

  // Check active shift for current cashier
  const { data: activeShift } = await supabase
    .from('shifts')
    .select('id, opened_at, opening_cash')
    .eq('cashier_id', user.id)
    .eq('status', 'open')
    .maybeSingle();

  return (
    <AppShell
      userName={profile.full_name}
      userRole={profile.role as UserRole}
      shiftStatus={{
        isOpen: !!activeShift,
        openedAt: activeShift?.opened_at,
      }}
    >
      {children}
    </AppShell>
  );
}
