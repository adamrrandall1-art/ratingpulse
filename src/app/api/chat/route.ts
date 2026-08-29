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

    const systemPrompt = `You are PulseBot, the official AI sales & onboarding assistant for RatingPulse (https://ratingpulse.co).

CORE TRUTHS & BUSINESS RULES (NEVER CONTRADICT THESE):
- Sign Up Process: Users can sign up in seconds by clicking 'Get Started Free' or 'Sign In' at the top right of ratingpulse.co using their Google Account or email.
- Credit Card Requirement: NO credit card is required to sign up or start using RatingPulse. The initial tier/trial is 100% free with zero payment details collected upfront.
- What RatingPulse Does: RatingPulse automates 5-star Google review collection via SMS and email, connects directly with Google Business Profiles, and generates AI-powered responses to customer feedback.
- Upgrade / Pricing: Upgrading to Pro unlocks unlimited SMS review requests and advanced AI features via Stripe, but free accounts remain free with no card needed.

STYLE RULES:
- Direct and concise: Answer in 2-3 short, clear sentences.
- Never say 'Yes' and 'No' to the same concept in a single response.
- Always provide direct links/directions to the 'Get Started' button when asked how to sign up.

FALLBACK GUARDRAIL:
- If a question cannot be answered directly from these rules, reply: "You can reach our team directly at support@ratingpulse.co or click 'Get Started' above to test the platform free."`;

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
                temperature: 0.2,
                maxOutputTokens: 300,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply: reply.trim() });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to intelligent knowledge base:', geminiError);
      }
    }

    // Built-in Knowledge Engine aligned strictly with Ground Truth Rules
    const lower = latestUserMessage.toLowerCase();
    let reply = '';

    if (lower.includes('sign up') || lower.includes('create account') || lower.includes('register') || lower.includes('get started') || lower.includes('how do i start')) {
      reply = `You can sign up in seconds by clicking 'Get Started Free' or 'Sign In' at the top right of ratingpulse.co using your Google Account or email. No credit card is required to create your account and start collecting reviews.`;
    } else if (lower.includes('credit card') || lower.includes('card required') || lower.includes('free trial') || lower.includes('free')) {
      reply = `No credit card is required to sign up or use RatingPulse. The initial tier is 100% free with zero payment details collected upfront. You can click 'Get Started Free' at the top right to start immediately.`;
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('pro') || lower.includes('upgrade') || lower.includes('month') || lower.includes('$25')) {
      reply = `Free accounts remain free with no credit card required. Upgrading to Pro ($25/month) unlocks unlimited SMS review requests, priority Google sync, and advanced AI features via Stripe.`;
    } else if (lower.includes('how') && (lower.includes('work') || lower.includes('what is') || lower.includes('what does') || lower.includes('review') || lower.includes('sms'))) {
      reply = `RatingPulse automates 5-star Google review collection by sending instant SMS and email invites to your customers. It connects directly with your Google Business Profile and uses Gemini AI to draft keyword-rich responses to customer feedback. Click 'Get Started Free' above to try it out in minutes.`;
    } else if (lower.includes('negative') || lower.includes('bad') || lower.includes('1 star') || lower.includes('3 star') || lower.includes('feedback')) {
      reply = `RatingPulse includes a smart feedback interceptor that directs customers with 1-3 star experiences to a private resolution form. This allows your team to address customer issues privately before anything is published on Google.`;
    } else if (lower.includes('seo') || lower.includes('ranking') || lower.includes('maps') || lower.includes('ai') || lower.includes('gemini')) {
      reply = `RatingPulse uses Gemini AI to craft personalized review replies enriched with your local SEO keywords. This active engagement helps increase your business visibility on Google Maps and local search results.`;
    } else {
      reply = `You can reach our team directly at support@ratingpulse.co or click 'Get Started' above to test the platform free.`;
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
