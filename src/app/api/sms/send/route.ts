import { NextRequest, NextResponse } from 'next/server';
import { sendTwilioSms, twilioPhoneNumber, isTwilioConfigured, formatE164, appendComplianceFooter } from '@/lib/twilio';
import { checkQuietHours } from '@/lib/compliance/quietHours';
import { createClient } from '@supabase/supabase-js';
import { resolveReviewUrl } from '@/lib/google-places';

// ─── E.164 formatter (inlined for extra safety) ──────────────────────────────
function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length > 7) return `+${digits}`; // international fallback
  return null;
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse body safely
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const rawTo = (
    body.toPhone ??
    body.phone ??
    body.recipientPhone ??
    body.to ??
    body.phoneNumber ??
    body.customerPhone ??
    body.recipient ??
    body.customer_phone ??
    body.phone_number ??
    body.mobile
  ) as string | undefined;

  // 2. Log incoming body and env var state for debugging
  console.log('[SMS] incoming request:', JSON.stringify({
    rawTo,
    customerName: body.customerName,
    businessName: body.businessName,
    serviceType: body.serviceType,
    hasMessage: Boolean(body.message),
  }));
  console.log('[SMS] env check:', {
    hasSid:           Boolean(process.env.TWILIO_ACCOUNT_SID),
    sidPrefix:        process.env.TWILIO_ACCOUNT_SID?.slice(0, 4) ?? 'none',
    hasToken:         Boolean(process.env.TWILIO_AUTH_TOKEN),
    hasPhone:         Boolean(process.env.TWILIO_PHONE_NUMBER),
    fromNumber:       process.env.TWILIO_PHONE_NUMBER ?? 'unset',
    isTwilioConfigured,
  });

  // 3. Validate + format recipient to E.164
  if (!rawTo) {
    return NextResponse.json(
      { success: false, error: 'Recipient phone number is required.' },
      { status: 400 }
    );
  }

  const formattedTo = toE164(String(rawTo));
  if (!formattedTo) {
    return NextResponse.json(
      { success: false, error: `Invalid phone number: "${rawTo}". Must be 10 or 11 digits.` },
      { status: 400 }
    );
  }

  // 4. TCPA Quiet Hours Compliance Check (8:00 AM - 9:00 PM local time)
  const timeZone = (body.timeZone as string) || (body.timezone as string) || 'America/New_York';
  const { isWithinAllowedWindow, currentHour } = checkQuietHours(timeZone);
  if (!isWithinAllowedWindow) {
    console.warn(`[SMS] TCPA Quiet Hours: Blocked message at local hour ${currentHour}:00 in ${timeZone}`);
    return NextResponse.json(
      {
        success: false,
        error: `SMS delivery is restricted during TCPA quiet hours (current local hour: ${currentHour}:00). Allowed delivery window is 8:00 AM – 9:00 PM local time.`,
        quietHoursBlocked: true,
        currentHour,
      },
      { status: 403 }
    );
  }

  // 5. Build SMS body
  const isDemoMode   = Boolean(body.isDemoMode ?? body.isSimulationMode ?? body.demoMode ?? false);
  const customerName = (body.customerName as string) || (body.name as string) || 'Valued Customer';
  const businessName = isDemoMode
    ? "RatingPulse"
    : ((body.businessName as string) || ((body.business as any)?.name as string) || 'our business');
  const demoReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJawEUC_oN04kRB70LP1wHuPg';
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
  const placeId      = ((body.placeId as string) || (body.google_place_id as string) || '');
  const activeGoogleReviewUrl = isDemoMode
    ? demoReviewUrl
    : (resolveReviewUrl(body.googleReviewUrl as string) || resolveReviewUrl(placeId) || '');
  const serviceType  = (body.serviceType  as string) || 'General Service';
  const userId       = (body.userId       as string) || '';

  const inviteToken = crypto.randomUUID();
  const funnelUrl = `${appUrl}/r/${inviteToken}`;

  let rawMessage: string;
  if (body.message && typeof body.message === 'string') {
    let customMsg = body.message;
    if (/\{\{review_link\}\}|\{review_link\}|\[review_link\]/i.test(customMsg)) {
      customMsg = customMsg.replace(/\{\{review_link\}\}|\{review_link\}|\[review_link\]/gi, funnelUrl);
    } else if (activeGoogleReviewUrl && customMsg.includes(activeGoogleReviewUrl)) {
      customMsg = customMsg.replace(activeGoogleReviewUrl, funnelUrl);
    } else if (!customMsg.includes('/r/')) {
      customMsg = `${customMsg.trim()} ${funnelUrl}`;
    }
    rawMessage = customMsg;
  } else {
    rawMessage = `Hi ${customerName}, thanks for visiting ${businessName}! Could you take 30 seconds to leave us a quick review on Google? ${funnelUrl}`;
  }
  const messageBody = appendComplianceFooter(rawMessage);

  console.log('[SMS] dispatching to:', formattedTo, '| from:', twilioPhoneNumber || 'unset');

  // 6. Send via Twilio — wrap in try/catch so any throw becomes a 400/500 JSON response
  let result;
  try {
    result = await sendTwilioSms(formattedTo, messageBody);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected Twilio error';
    console.error('[SMS] Twilio threw unexpectedly:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  if (!result.success) {
    // Twilio rejected the SMS (bad number, unverified trial recipient, etc.) → 400 not 500
    console.error('[SMS] Twilio dispatch failed:', result.error);
    return NextResponse.json(
      { success: false, error: result.error || 'Twilio rejected the SMS request.' },
      { status: 400 }
    );
  }

  console.log('[SMS] success — sid:', result.messageId, '| simulated:', result.simulated);

  // 6. Fire-and-forget: log to review_invites using schema columns.
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey     =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    void (async () => {
      try {
        const sb = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const payload: Record<string, unknown> = {
          id:             inviteToken,
          token:          inviteToken,
          customer_name:  customerName,
          customer_phone: formattedTo,
          service_type:   serviceType,
          place_id:       placeId || null,
          business_name:  businessName,
          review_link:    activeGoogleReviewUrl || null,
          status:         'sent',
          sent_at:        new Date().toISOString(),
        };
        // Only include user_id when it's a valid UUID
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          payload.user_id = userId;
          payload.business_id = userId;
        }
        const { error } = await sb.from('review_invites').insert([payload]);
        if (error) {
          const fallbackPayload: Record<string, unknown> = {
            id:             inviteToken,
            customer_name:  customerName,
            customer_phone: formattedTo,
            service_type:   serviceType,
            status:         'sent',
            sent_at:        new Date().toISOString(),
          };
          if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
            fallbackPayload.user_id = userId;
          }
          await sb.from('review_invites').insert([fallbackPayload]);
        }
      } catch (e) {
        console.error('[SMS] DB log exception:', e);
      }
    })();
  }

  // 7. Return success
  return NextResponse.json(
    {
      success:   true,
      messageId: result.messageId,
      status:    result.status,
      from:      twilioPhoneNumber,
      to:        formattedTo,
      simulated: result.simulated,
    },
    { status: 200 }
  );
}

