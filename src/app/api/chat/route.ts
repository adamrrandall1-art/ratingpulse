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

PRICING RULES:
- Free Plan: $0/mo — includes starter review invites, Google Places sync, and basic AI response drafting. No credit card required.
- Pro Plan: $25/mo (with a 14-day free trial) — includes unlimited automated SMS & email review requests, smart sentiment routing, priority AI reply generation, and full analytics.
- Cancel anytime: No long-term contracts.

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
                maxOutputTokens: 350,
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

    // Built-in Knowledge Engine aligned strictly with Ground Truth & Pricing Rules
    const lower = latestUserMessage.toLowerCase();
    let reply = '';

    // Check pricing FIRST so "How does pricing work?" routes to pricing
    if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost') || lower.includes('$25') || lower.includes('pro plan') || lower.includes('plan') || lower.includes('subscription')) {
      reply = `RatingPulse offers two simple tiers:\n\n• **Free Plan ($0/mo)**: Includes starter review invites, Google Places sync, and basic AI drafting with zero credit card required.\n• **Pro Plan ($25/mo)**: Includes unlimited automated SMS & email review requests, smart sentiment routing, priority AI replies, and full analytics with a 14-day free trial.\n\nYou can cancel anytime with no contracts.`;
    } else if (lower.includes('credit card') || lower.includes('card required') || lower.includes('free trial') || lower.includes('is it free')) {
      reply = `No credit card is required to sign up or use RatingPulse. The Free Plan is $0/mo, and the Pro Plan includes a 14-day free trial with zero payment details needed upfront. Click 'Get Started Free' at the top right to start immediately.`;
    } else if (lower.includes('sign up') || lower.includes('create account') || lower.includes('register') || lower.includes('how do i start') || lower.includes('get started')) {
      reply = `You can sign up in seconds by clicking 'Get Started Free' or 'Sign In' at the top right of ratingpulse.co using your Google Account or email. No credit card is required to create your account and start collecting reviews.`;
    } else if (lower.includes('how') && (lower.includes('work') || lower.includes('review') || lower.includes('sms') || lower.includes('invite') || lower.includes('what is') || lower.includes('what does'))) {
      reply = `RatingPulse automates 5-star Google review collection in 3 steps:\n\n1. **Send Instant Invites**: Dispatch 1-tap review links via automated SMS or email after client visits.\n2. **Smart Sentiment Routing**: Happy clients are routed to Google Maps for 5-star reviews, while private feedback is intercepted if they had concerns.\n3. **AI SEO Replies**: Gemini AI crafts keyword-rich responses to boost your local Google Maps rankings.`;
    } else if (lower.includes('negative') || lower.includes('bad') || lower.includes('1 star') || lower.includes('3 star') || lower.includes('feedback')) {
      reply = `RatingPulse protects your public reputation with smart feedback routing. Customers rating 1-3 stars are seamlessly directed to a private resolution form so you can resolve issues privately before anything appears on Google.`;
    } else if (lower.includes('seo') || lower.includes('ranking') || lower.includes('maps') || lower.includes('ai') || lower.includes('gemini')) {
      reply = `RatingPulse uses Gemini AI to draft personalized review replies enriched with your local SEO keywords. This active engagement signals relevance to Google's algorithm and helps increase your visibility in Google Maps local search.`;
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
