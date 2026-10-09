import { NextRequest, NextResponse } from 'next/server';
import { checkQuietHours } from '@/lib/compliance/quietHours';
import { sendTwilioSms, formatE164, appendComplianceFooter } from '@/lib/twilio';
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
    const { contacts = [], timeZone = 'America/New_York', businessName = "RatingPulse" } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contacts provided in bulk batch.' },
        { status: 400 }
      );
    }

    const { isWithinAllowedWindow, currentHour } = checkQuietHours(timeZone);

    // Validate and normalize all contacts
    const validContacts: Array<{ name: string; phone: string; email?: string; formattedPhone: string }> = [];
    const invalidContacts: Array<{ name?: string; phone?: string; reason: string }> = [];

    for (const c of contacts) {
      const name = c.name?.trim() || 'Valued Customer';
      const phone = c.phone?.trim() || '';
      const email = c.email?.trim() || '';
      const formatted = toE164(phone) || formatE164(phone);

      if (!formatted || formatted.length < 10) {
        invalidContacts.push({ name, phone, reason: 'Invalid phone format' });
      } else {
        validContacts.push({ name, phone, email, formattedPhone: formatted });
      }
    }

    if (validContacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid phone numbers found in the uploaded batch.',
          invalidCount: invalidContacts.length,
        },
        { status: 400 }
      );
    }

    const isDemoMode = Boolean(body.isDemoMode ?? body.isSimulationMode ?? body.demoMode ?? false);
    const resolvedBusinessName = isDemoMode
      ? "RatingPulse"
      : (body.businessName || body.business?.name || "RatingPulse");
    const placeId = isDemoMode
      ? 'ChIJawEUC_oN04kRB70LP1wHuPg'
      : (body.placeId || body.google_place_id || '');
    const userId = body.userId || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const directReviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : `${appUrl}/rate`;
    const reviewLink = body.reviewLink || body.reviewUrl || directReviewUrl;

    const status = isWithinAllowedWindow ? 'SENT' : 'QUEUED_FOR_DAYLIGHT';

    // If within daytime, dispatch SMS via Twilio; otherwise queue for 8 AM
    if (isWithinAllowedWindow) {
      // Async dispatch batch with rate limiting
      void (async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const sb = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

        for (const contact of validContacts) {
          try {
            const rawMessage = `Hi ${contact.name}, thanks for choosing ${resolvedBusinessName}! Could you take 30s to rate your experience on Google? ${reviewLink}`;
            const messageBody = appendComplianceFooter(rawMessage);
            await sendTwilioSms(contact.formattedPhone, messageBody);

            if (sb) {
              const payload: Record<string, unknown> = {
                customer_name: contact.name,
                customer_phone: contact.formattedPhone,
                customer_email: contact.email || null,
                service_type: 'Bulk Upload Campaign',
                place_id: placeId || null,
                status: 'sent',
                sent_at: new Date().toISOString(),
              };
              if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
                payload.user_id = userId;
              }
              await sb.from('review_invites').insert([payload]);
            }
          } catch (err) {
            console.error(`[Bulk Invites] Error dispatching to ${contact.formattedPhone}:`, err);
          }
        }
      })();
    } else {
      console.log(`[Bulk Invites] Off-hours (hour ${currentHour}:00 in ${timeZone}). Queued ${validContacts.length} contacts for 8:00 AM delivery.`);
    }

    return NextResponse.json(
      {
        success: true,
        queuedCount: validContacts.length,
        invalidCount: invalidContacts.length,
        status,
        currentHour,
        scheduledDeliveryTime: isWithinAllowedWindow ? 'Instant' : '8:00 AM Tomorrow',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API bulk invites error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while processing bulk invites' },
      { status: 500 }
    );
  }
}
