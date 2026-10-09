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
      if (!error && data?.user) {
        // Welcome email check: only dispatch once upon initial account creation
        if (data.user.email && type !== 'recovery') {
          try {
            // Check if profile already exists in Supabase
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id, email, welcome_email_sent, created_at')
              .eq('id', data.user.id)
              .maybeSingle();

            const isExistingUser = Boolean(existingProfile?.id);
            const userCreatedAt = data.user.created_at ? new Date(data.user.created_at).getTime() : 0;
            const isBrandNewAuth = Date.now() - userCreatedAt < 120000; // Created within last 2 minutes

            if (!isExistingUser && isBrandNewAuth) {
              // Brand new user registration: create initial profile and dispatch welcome email once
              await supabase.from('profiles').upsert(
                {
                  id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.user_metadata?.full_name || '',
                  business_name: data.user.user_metadata?.business_name || null,
                  welcome_email_sent: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              );

              await supabase.from('business_settings').upsert(
                {
                  user_id: data.user.id,
                },
                { onConflict: 'user_id' }
              );

              const { sendWelcomeEmail } = await import('@/lib/email/templates/welcome');
              sendWelcomeEmail({
                to: data.user.email,
                name: data.user.user_metadata?.full_name,
                userId: data.user.id,
              }).catch((emailErr) => console.warn('[Welcome email dispatch error]:', emailErr));
            } else if (isExistingUser && !existingProfile?.welcome_email_sent) {
              // Existing user returning: ensure flag is marked true so email is never sent on recurring sign-ins
              await supabase
                .from('profiles')
                .update({ welcome_email_sent: true })
                .eq('id', data.user.id);
            }
          } catch (profileCheckErr) {
            console.warn('[Auth callback profile check exception]:', profileCheckErr);
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
