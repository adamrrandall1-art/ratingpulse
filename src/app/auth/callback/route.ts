import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  let next = requestUrl.searchParams.get('next') || '/dashboard';

  // If this is a password recovery event, immediately direct to /reset-password
  if (type === 'recovery' || next.includes('reset-password')) {
    next = '/reset-password';
  }

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component write handler
            }
          },
        },
      });

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Trigger welcome onboarding email in background
        if (data?.user?.email && type !== 'recovery') {
          try {
            const { sendWelcomeEmail } = await import('@/lib/email/templates/welcome');
            sendWelcomeEmail({
              to: data.user.email,
              name: data.user.user_metadata?.full_name,
              userId: data.user.id,
            }).catch((emailErr) => console.warn('[Welcome email dispatch error]:', emailErr));
          } catch {
            // ignore
          }
        }

        return NextResponse.redirect(new URL(next, request.url));
      }
    }
  }

  // Fallback for direct recovery link without code query
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/reset-password', request.url));
  }

  // Return the user to login with error if oauth failed
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
