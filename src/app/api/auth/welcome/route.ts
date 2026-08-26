export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/templates/welcome';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || body.to;
    const name = body.name || body.fullName || body.full_name;
    const userId = body.userId || body.user_id;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail({ to: email, name, userId });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API Welcome Email Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to dispatch welcome email' },
      { status: 500 }
    );
  }
}
