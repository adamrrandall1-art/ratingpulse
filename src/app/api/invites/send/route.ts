import { NextRequest, NextResponse } from 'next/server';
import { sendTwilioSms, twilioPhoneNumber, formatE164, appendComplianceFooter } from '@/lib/twilio';
import { checkQuietHours } from '@/lib/compliance/quietHours';
import { createClient } from '@supabase/supabase-js';

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length > 7) return `+${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTo =
      body.toPhone ||
      body.phone ||
      body.recipientPhone ||
      body.to ||
      body.phoneNumber ||
      body.customerPhone ||
      body.recipient ||
      body.customer_phone ||
      body.phone_number ||
      body.mobile;

    if (!rawTo || typeof rawTo !== 'string' || !rawTo.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required.' },
        { status: 400 }
      );
    }

    const formattedTo = toE164(rawTo.trim()) || formatE164(rawTo.trim());
    if (!formattedTo || formattedTo.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format.' },
        { status: 400 }
      );
    }

    // TCPA Quiet Hours Compliance Check (8:00 AM - 9:00 PM local time)
    const timeZone = body.timeZone || body.timezone || 'America/New_York';
    const { isWithinAllowedWindow, currentHour } = checkQuietHours(timeZone);
    if (!isWithinAllowedWindow) {
      console.warn(`[SMS Invites] TCPA Quiet Hours: Blocked message at local hour ${currentHour}:00 in ${timeZone}`);
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

    const isDemoMode   = Boolean(body.isDemoMode ?? body.isSimulationMode ?? body.demoMode ?? false);
    const customerName = (body.customerName as string) || (body.name as string) || 'Valued Customer';
    const businessName = isDemoMode
      ? "RatingPulse"
      : ((body.businessName as string) || ((body.business as any)?.name as string) || 'our business');
    const placeId      = isDemoMode
      ? 'ChIJawEUC_oN04kRB70LP1wHuPg'
      : ((body.placeId as string) || (body.google_place_id as string) || '');
    const userId       = (body.userId       as string) || '';
    const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const serviceType  = (body.serviceType  as string) || 'General Service';

    // 1. Generate unique invite token / ID
    const inviteToken = crypto.randomUUID();
    const funnelUrl = `${appUrl}/r/${inviteToken}`;

    // Active Google review link for 4-5 star redirect in the funnel
    const activeGoogleReviewUrl =
      (body.googleReviewUrl as string) ||
      (body.business?.googleReviewUrl as string) ||
      (body.business?.reviewUrl as string) ||
      (body.reviewUrl as string) ||
      (body.reviewLink as string) ||
      (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '');

    // 2. Set destination link in SMS text body to RatingPulse review funnel
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

    const result = await sendTwilioSms(formattedTo, messageBody);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch SMS through carrier.',
        },
        { status: 500 }
      );
    }

    // 3. Log invite record with token to review_invites
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

          if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
            payload.user_id = userId;
            payload.business_id = userId;
          }

          const { error: insertErr } = await sb.from('review_invites').insert([payload]);
          if (insertErr) {
            console.warn('[SMS Invites] First insert attempt warning:', insertErr.message, 'Retrying with core columns...');
            const fallbackPayload: Record<string, unknown> = {
              id:             inviteToken,
              customer_name:  customerName,
              customer_phone: formattedTo,
              service_type:   serviceType,
              place_id:       placeId || null,
              status:         'sent',
              sent_at:        new Date().toISOString(),
            };
            if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
              fallbackPayload.user_id = userId;
            }
            await sb.from('review_invites').insert([fallbackPayload]);
          }
        } catch (e) {
          console.error('[SMS Invites] DB log exception:', e);
        }
      })();
    }

    return NextResponse.json(
      {
        success: true,
        invite: {
          id: inviteToken,
          token: inviteToken,
          funnelUrl,
        },
        messageId: result.messageId,
        status: result.status,
        from: twilioPhoneNumber,
        to: formattedTo,
        simulated: result.simulated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API invites send error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while sending SMS invite' },
      { status: 500 }
    );
  }
}
