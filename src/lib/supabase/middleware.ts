import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/login'];

// Routes restricted to owner only
const OWNER_ONLY_ROUTES = [
  '/inventory',
  '/purchases',
  '/suppliers',
  '/finance',
  '/reports',
  '/settings',
  '/audit-log',
];

// Routes accessible by cashier
const CASHIER_ROUTES = ['/dashboard', '/pos', '/products', '/transactions'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - IMPORTANT: Do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If already logged in, redirect to dashboard
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Not authenticated → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Get user role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  // No profile or inactive → sign out and redirect
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'account_disabled');
    return NextResponse.redirect(url);
  }

  // Root redirect
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = profile.role === 'cashier' ? '/pos' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Cashier trying to access owner-only routes → redirect to POS
  if (profile.role === 'cashier') {
    const isOwnerRoute = OWNER_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (isOwnerRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/pos';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
