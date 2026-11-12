import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ADMIN_EMAILS = [
  'arandall79@gmail.com',
  process.env.ADMIN_ALERT_EMAIL?.toLowerCase(),
].filter(Boolean) as string[];

export interface SubscriptionAccessResult {
  hasActiveAccess: boolean;
  status: string; // 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid' | 'no_subscription' | 'admin'
  reason?: string;
}

/**
 * Validates whether a user has active subscription or 14-day free trial access.
 * Checks the `subscriptions` table in Supabase via service role client,
 * handles both profile UUID and Clerk user_id aliases, and safeguards
 * founder/admin accounts from being locked out.
 */
export async function checkSubscriptionAccess(
  userId: string | null | undefined,
  options?: {
    userEmail?: string | null;
    isDemoMode?: boolean;
    supabaseClient?: any;
  }
): Promise<SubscriptionAccessResult> {
  // 1. Demo mode always has active access
  if (options?.isDemoMode) {
    return { hasActiveAccess: true, status: 'trialing' };
  }

  // 2. Deny if no userId provided
  if (!userId) {
    return { hasActiveAccess: false, status: 'no_user', reason: 'User ID missing' };
  }

  // 3. Founder / Admin bypass check (ensures owner/developer is not locked out)
  const email = (options?.userEmail || '').trim().toLowerCase();
  if (email && ADMIN_EMAILS.includes(email)) {
    return { hasActiveAccess: true, status: 'admin' };
  }

  const supabaseAdmin = options?.supabaseClient || getSupabaseAdmin();
  if (!supabaseAdmin) {
    // If Supabase admin credentials are not configured in environment, allow through in simulation
    return { hasActiveAccess: true, status: 'trialing' };
  }

  // 4. Resolve both UUID (profile.id) and Clerk ID (clerkUserId)
  const candidateIds: string[] = [userId];
  let profileEmail: string | null = email || null;
  let profilePlanStatus: string | null = null;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id, clerk_user_id, email, notification_email, plan_status')
      .or(isUuid ? `id.eq.${userId},clerk_user_id.eq.${userId}` : `clerk_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    if (prof) {
      if (prof.id && !candidateIds.includes(prof.id)) candidateIds.push(prof.id);
      if (prof.clerk_user_id && !candidateIds.includes(prof.clerk_user_id)) candidateIds.push(prof.clerk_user_id);
      if (prof.email) profileEmail = prof.email.trim().toLowerCase();
      if (prof.notification_email && !profileEmail) profileEmail = prof.notification_email.trim().toLowerCase();
      if (prof.plan_status) profilePlanStatus = String(prof.plan_status).toLowerCase();
    }
  } catch (err) {
    console.warn('[checkSubscriptionAccess] Profile lookup warning:', err);
  }

  // Admin email check after profile resolution
  if (profileEmail && ADMIN_EMAILS.includes(profileEmail)) {
    return { hasActiveAccess: true, status: 'admin' };
  }

  // 5. Query subscriptions table using all candidate user IDs
  try {
    const { data: subs, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('status, current_period_end, created_at')
      .in('user_id', candidateIds)
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      console.warn('[checkSubscriptionAccess] Subscriptions query warning:', subError.message);
    }

    const sub = subs && subs.length > 0 ? subs[0] : null;

    if (sub && sub.status) {
      const statusLower = String(sub.status).toLowerCase();
      const hasActive = ['active', 'trialing'].includes(statusLower);
      return {
        hasActiveAccess: hasActive,
        status: statusLower,
        reason: hasActive ? undefined : `Subscription status is ${statusLower}`,
      };
    }
  } catch (err) {
    console.warn('[checkSubscriptionAccess] Subscription check error:', err);
  }

  // 6. Check profiles.plan_status fallback (if webhook or setup updated profiles table)
  if (profilePlanStatus) {
    if (['active', 'trialing', 'pro', 'admin', 'lifetime'].includes(profilePlanStatus)) {
      return { hasActiveAccess: true, status: profilePlanStatus };
    }
    if (['canceled', 'past_due', 'unpaid'].includes(profilePlanStatus)) {
      return {
        hasActiveAccess: false,
        status: profilePlanStatus,
        reason: `Profile plan status is ${profilePlanStatus}`,
      };
    }
  }

  // 7. No active subscription or trial found
  return {
    hasActiveAccess: false,
    status: 'no_subscription',
    reason: 'An active subscription or 14-day free trial is required to send review invites.',
  };
}
