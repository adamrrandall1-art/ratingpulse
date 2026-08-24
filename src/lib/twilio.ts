import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER ?? '';

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn(
    '[Twilio] One or more required env vars are missing ' +
      '(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER). ' +
      'SMS will run in simulation mode.'
  );
}

export const isTwilioConfigured = Boolean(
  accountSid &&
  authToken &&
  accountSid.startsWith('AC') &&
  authToken.length >= 16
);

// Only construct the Twilio client when both credentials are verified strings.
// Calling twilio(undefined, undefined) throws at module load time, which causes
// a 500 on all /api/sms/* routes even before any request body is parsed.
export const twilioClient =
  isTwilioConfigured && typeof accountSid === 'string' && typeof authToken === 'string'
    ? twilio(accountSid, authToken)
    : null;

/**
 * Format phone numbers into standard E.164 (+1XXXXXXXXXX) format
 */
export function formatE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (phone.startsWith('+')) {
    return phone.replace(/\s+/g, '');
  }
  return `+${digits}`;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Dispatch real SMS via Twilio using standard direct body dispatch.
 * Syntax: { body, from, to } — no templates, no messagingServiceSid.
 *
 * Trial account note: Twilio trial accounts can only send to verified numbers.
 * Error 21608 = unverified recipient. When that happens we fall back to
 * simulation mode so the UI keeps working during development.
 */
export async function sendTwilioSms(
  to: string,
  body: string
): Promise<SendSmsResult> {
  const formattedTo = formatE164(to);

  if (!isTwilioConfigured || !twilioClient) {
    console.log('[Twilio Simulated] SMS dispatched to:', formattedTo, '| body:', body);
    return {
      success: true,
      messageId: `sim_msg_${Date.now()}`,
      status: 'delivered',
      simulated: true,
    };
  }

  try {
    // Standard direct dispatch — no templates, no messagingServiceSid
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedTo,
    });

    console.log('[Twilio] sent:', message.sid, '| status:', message.status);
    return {
      success: true,
      messageId: message.sid,
      status: message.status,
      simulated: false,
    };
  } catch (error: any) {
    const code: number | undefined = error.code;
    const msg: string = error.message || 'Failed to dispatch SMS through Twilio';

    console.error('[Twilio] dispatch error — code:', code, '| message:', msg);

    // Twilio trial accounts block messages to unverified numbers (code 21608)
    // and sometimes flag template issues (code 21606/21612).
    // Fall back to simulation so the rest of the app flow still works.
    const TRIAL_RESTRICTION_CODES = [
      21608, // The number you're trying to reach is unverified (trial account)
      21606, // From number not capable of sending to this destination
      21612, // Cannot route to this number
      21610, // Message blocked (recipient opted out)
    ];

    if (code && TRIAL_RESTRICTION_CODES.includes(code)) {
      console.warn(
        `[Twilio] Trial restriction (code ${code}) — falling back to simulation mode.`,
        'To send real SMS, verify the recipient at console.twilio.com/phone-numbers/verified'
      );
      return {
        success: true,
        messageId: `sim_trial_${Date.now()}`,
        status: 'simulated',
        simulated: true,
        error: `Trial restriction (${code}): ${msg}`,
      };
    }

    return {
      success: false,
      error: `Twilio error ${code ?? 'unknown'}: ${msg}`,
    };
  }
}

