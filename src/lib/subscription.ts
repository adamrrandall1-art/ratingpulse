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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SubscriptionAccessResult {
  hasActiveAccess: boolean;
  status: string; // 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid' | 'no_subscription' | 'admin'
  reason?: string;
}

/**
 * Validates whether a user has active subscription or 14-day free trial access.
 * Checks BOTH `profiles` table (where Stripe webhook writes plan_status) and
 * `subscriptions` table in Supabase via service role client.
 * Handles both profile UUID and Clerk user_id aliases safely without querying
 * Postgres UUID columns with non-UUID strings.
 * Safeguards founder/admin accounts from being locked out.
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
    if (email && ADMIN_EMAILS.includes(email)) {
      return { hasActiveAccess: true, status: 'admin' };
    }
    return {
      hasActiveAccess: false,
      status: 'no_subscription',
      reason: 'Active subscription or 14-day free trial required to send invites.',
    };
  }

  // 4. Resolve profile safely without passing non-UUID strings to UUID columns
  let profile: any = null;
  const isInputUuid = UUID_REGEX.test(userId);

  try {
    if (isInputUuid) {
      const { data: pById } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (pById) profile = pById;
    }

    if (!profile) {
      const { data: pByClerk } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', userId)
        .maybeSingle();
      if (pByClerk) profile = pByClerk;
    }

    if (!profile && email) {
      const { data: pByEmail } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (pByEmail) profile = pByEmail;
    }

    if (!profile && email) {
      const { data: pByNotifEmail } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('notification_email', email)
        .maybeSingle();
      if (pByNotifEmail) profile = pByNotifEmail;
    }
  } catch (err) {
    console.warn('[checkSubscriptionAccess] Profile lookup warning:', err);
  }

  // Admin email check after profile resolution
  const resolvedEmail = (profile?.email || profile?.notification_email || email || '').trim().toLowerCase();
  if (resolvedEmail && ADMIN_EMAILS.includes(resolvedEmail)) {
    return { hasActiveAccess: true, status: 'admin' };
  }

  // 5. Query `subscriptions` table using ONLY valid UUIDs or Stripe customer/subscription IDs
  let sub: any = null;
  try {
    const validCandidateUuids: string[] = [];
    if (profile?.id && UUID_REGEX.test(profile.id)) {
      validCandidateUuids.push(profile.id);
    }
    if (isInputUuid && !validCandidateUuids.includes(userId)) {
      validCandidateUuids.push(userId);
    }

    // Try by valid UUIDs
    if (validCandidateUuids.length > 0) {
      const { data: subsByUuid, error: uuidErr } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .in('user_id', validCandidateUuids)
        .order('created_at', { ascending: false })
        .limit(1);

      if (uuidErr) {
        console.warn('[checkSubscriptionAccess] Subscriptions query warning:', uuidErr.message);
      } else if (subsByUuid && subsByUuid.length > 0) {
        sub = subsByUuid[0];
      }
    }

    // Try by stripe_customer_id if available
    const stripeCustId = profile?.stripe_customer_id;
    if (!sub && stripeCustId) {
      const { data: subsByCust, error: custErr } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('stripe_customer_id', stripeCustId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!custErr && subsByCust && subsByCust.length > 0) {
        sub = subsByCust[0];
      }
    }

    // Try by stripe_subscription_id if available
    const stripeSubId = profile?.stripe_subscription_id;
    if (!sub && stripeSubId) {
      const { data: subsBySubId, error: subIdErr } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!subIdErr && subsBySubId && subsBySubId.length > 0) {
        sub = subsBySubId[0];
      }
    }
  } catch (err) {
    console.warn('[checkSubscriptionAccess] Subscription check error:', err);
  }

  // 6. Evaluate access across BOTH subscriptions and profiles tables
  const subStatus = sub?.status ? String(sub.status).toLowerCase().trim() : null;
  const subIsActive = subStatus ? ['active', 'trialing'].includes(subStatus) : false;

  const profilePlanStatus = profile?.plan_status ? String(profile.plan_status).toLowerCase().trim() : null;
  const profileIsActive = profilePlanStatus ? ['active', 'trialing', 'pro'].includes(profilePlanStatus) : false;
  const profileIsPro = Boolean(profile?.is_pro);
  const profileTrialValid = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at).getTime() > Date.now()
    : false;

  // Case A: Active or trialing in `subscriptions` table
  if (subIsActive && subStatus) {
    // If profiles.plan_status is out of sync, sync it to match the active subscription
    if (profile?.id && profile.plan_status !== subStatus) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ plan_status: subStatus, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
      } catch {}
    }
    return {
      hasActiveAccess: true,
      status: subStatus,
    };
  }

  // Case B: Active, trialing, or pro in `profiles` table (e.g. from Stripe webhook or trial grant)
  if (profileIsActive || profileIsPro || profileTrialValid) {
    const resolvedStatus = profilePlanStatus === 'trialing' || profileTrialValid
      ? 'trialing'
      : (profilePlanStatus || 'active');

    return {
      hasActiveAccess: true,
      status: resolvedStatus,
    };
  }

  // Case C: Subscriptions table has explicit inactive status (past_due, canceled, unpaid)
  if (subStatus && ['past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'].includes(subStatus)) {
    return {
      hasActiveAccess: false,
      status: subStatus,
      reason: `Your subscription is ${subStatus}. Please update your billing details to continue.`,
    };
  }

  // Case D: Profiles table has explicit canceled/past_due status
  if (profilePlanStatus && ['past_due', 'canceled', 'unpaid'].includes(profilePlanStatus)) {
    return {
      hasActiveAccess: false,
      status: profilePlanStatus,
      reason: `Your subscription is ${profilePlanStatus}. Please update your billing details to continue.`,
    };
  }

  // Case E: Strict fail-closed: No active subscription or trialing row
  return {
    hasActiveAccess: false,
    status: profilePlanStatus || 'no_subscription',
    reason: 'Active subscription or 14-day free trial required to send invites.',
  };
}
