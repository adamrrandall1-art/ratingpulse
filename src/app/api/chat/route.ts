import { NextResponse, type NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, messages } = body;

    const conversation = messages || (message ? [{ role: 'user', content: message }] : []);
    if (!conversation.length) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const latestUserMessage = conversation[conversation.length - 1]?.content || '';
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    const systemPrompt = `You are the helpful AI assistant for RatingPulse (https://ratingpulse.co). Answer questions accurately about automating Google Reviews, SMS/Email requests, AI auto-replies, and pricing. Keep answers crisp, confident, friendly, and encourage users to start their 14-day free trial.

Key Facts about RatingPulse:
- **What it does**: Automatically collects 5-star Google reviews via high-converting SMS and Email invites sent right after client visits.
- **AI Auto-Replies**: Uses Gemini AI to draft personalized, keyword-rich replies to Google reviews that boost local Google Maps 3-Pack rankings.
- **Feedback Interceptor**: Dissatisfied customers (1-3 stars) are routed to a private resolution form so you can resolve issues before they become public Google reviews.
- **Pricing**: $25/month flat with a 14-day free trial (no credit card required to test). Unlimited SMS invites, AI replies, and Google sync included.
- **Compliance**: 100% compliant with Google Review policies and carrier TCR 10DLC regulations.
- **Setup time**: Under 2 minutes - connect Google Business Profile and send your first invite instantly.`;

    if (apiKey) {
      try {
        const contents = conversation.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to intelligent knowledge base:', geminiError);
      }
    }

    // Built-in intelligent Knowledge Engine fallback
    const lower = latestUserMessage.toLowerCase();
    let reply = '';

    if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('month') || lower.includes('plan') || lower.includes('$25')) {
      reply = `**RatingPulse is $25/month** with everything included:\n• Unlimited automated SMS & Email review invites\n• Gemini AI SEO-rich Google review replies\n• Private 1-3 star feedback protection\n• Real-time Google Business Profile sync\n\nYou can get started today with a **14-day free trial**!`;
    } else if (lower.includes('free trial') || lower.includes('trial') || lower.includes('credit card')) {
      reply = `Yes! RatingPulse offers a **14-day free trial** with full access to all features (unlimited SMS invites, AI replies, and Google sync). No credit card is required to get started. You can sign up in under 2 minutes at https://ratingpulse.co/signup.`;
    } else if (lower.includes('how') && (lower.includes('work') || lower.includes('request') || lower.includes('invite') || lower.includes('sms') || lower.includes('email'))) {
      reply = `Here is how RatingPulse automates your 5-star Google reviews in 3 simple steps:\n1. **Send Instant Invites**: Enter your customer's phone number or email (or connect your POS/CRM) to dispatch a 1-tap review link.\n2. **Smart Sentiment Routing**: Happy clients are routed directly to Google Maps to leave 5 stars. Private feedback is intercepted if they had a concern.\n3. **1-Tap AI Replies**: Gemini AI drafts local SEO keyword replies to climb Google Maps rankings.`;
    } else if (lower.includes('negative') || lower.includes('bad review') || lower.includes('intercept') || lower.includes('1 star') || lower.includes('3 star')) {
      reply = `RatingPulse protects your public reputation with our **Smart Feedback Interceptor**. When a client rates their experience 1 to 3 stars, they are seamlessly guided to a private internal feedback form. This allows you to resolve their issue privately before anything gets posted to Google.`;
    } else if (lower.includes('seo') || lower.includes('maps') || lower.includes('ranking') || lower.includes('ai') || lower.includes('gemini')) {
      reply = `Google's local algorithm indexes review replies! RatingPulse uses **Gemini AI** to draft customized replies tailored to your business that naturally incorporate local keywords (like your city and services), helping you outrank competitors in the Google Maps 3-Pack.`;
    } else if (lower.includes('connect') || lower.includes('google') || lower.includes('setup') || lower.includes('install')) {
      reply = `Setup takes less than 2 minutes:\n1. Search for your business name on RatingPulse.\n2. Connect your Google Business Profile with 1 click.\n3. Start sending branded SMS and email invites right away from your dashboard!`;
    } else {
      reply = `Welcome to RatingPulse! 🚀 We help local businesses automatically generate 5-star Google reviews using instant SMS/Email invites and Gemini AI SEO replies.\n\nHow can I help you today? Feel free to ask about our **$25/mo pricing**, the **14-day free trial**, or how our review automation works!`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Support Chat API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process support message' },
      { status: 500 }
    );
  }
}
