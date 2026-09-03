import { NextRequest, NextResponse } from 'next/server';
import { sendTwilioSms, twilioPhoneNumber, isTwilioConfigured, formatE164 } from '@/lib/twilio';
import { createClient } from '@supabase/supabase-js';

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

  // 4. Build SMS body
  const customerName = (body.customerName as string) || 'Valued Customer';
  const businessName = (body.businessName as string) || 'Our Business';
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
  const reviewLink   = (body.reviewGateUrl as string) || (body.reviewLink as string) || (body.reviewUrl as string) || `${appUrl}/rate`;
  const serviceType  = (body.serviceType  as string) || 'General Service';
  const userId       = (body.userId       as string) || '';

  const messageBody = (body.message as string) ||
    `Hi ${customerName}, thanks for visiting ${businessName}! Could you take 30s to rate your experience on Google? ${reviewLink}`;

  console.log('[SMS] dispatching to:', formattedTo, '| from:', twilioPhoneNumber || 'unset');

  // 5. Send via Twilio — wrap in try/catch so any throw becomes a 400/500 JSON response
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

  // 6. Fire-and-forget: log to review_invites using only the schema columns.
  //    Do NOT pass local JS `id` — the DB generates its own UUID.
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    void (async () => {
      try {
        const sb = createClient(supabaseUrl, supabaseAnonKey);
        const payload: Record<string, unknown> = {
          customer_name:  customerName,
          customer_phone: formattedTo,
          service_type:   serviceType,
          status:         'sent',
          sent_at:        new Date().toISOString(),
        };
        // Only include user_id when it's a valid UUID (avoids FK violation on anonymous calls)
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          payload.user_id = userId;
        }
        const { error } = await sb.from('review_invites').insert([payload]);
        if (error) console.error('[SMS] DB log error:', error.message, '| code:', error.code);
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

