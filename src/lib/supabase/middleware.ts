import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // If Supabase is not configured, allow access for standalone local demo mode
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('your-project-id') ||
    !supabaseUrl.startsWith('http')
  ) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
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
    });

    // Validates the session against Supabase auth servers
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup');

    const isProtectedRoute =
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/onboarding');

    // If user is not logged in and accessing protected routes, redirect to /login
    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // If user is already logged in and accessing auth routes, redirect to /dashboard
    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (e) {
    console.error('Supabase middleware error:', e);
    return supabaseResponse;
  }
}
