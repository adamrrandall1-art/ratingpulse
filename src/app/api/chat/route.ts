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
- Sign Up Process: Users can sign up in seconds by clicking 'Start 14-Day Free Trial' or 'Sign In' at the top right of ratingpulse.co using their Google Account or email.
- Credit Card Requirement: No upfront payment details are needed to begin the initial onboarding.
- What RatingPulse Does: RatingPulse automates 5-star Google review collection via SMS and email, connects directly with Google Business Profiles, and generates AI-powered responses to customer feedback.

PRICING RULES (STRICT):
- We do NOT offer a permanent free plan.
- We offer a full-featured 14-Day Free Trial on the Pro Plan ($25/month).
- Users get unrestricted access to all features (unlimited SMS review invites, sentiment routing, AI response generation) during the 14-day trial.
- Users can cancel anytime during the trial with zero penalty.

STYLE RULES:
- Direct and concise: Answer in 2-3 short, clear sentences.
- Never say 'Yes' and 'No' to the same concept in a single response.
- Always provide direct directions to click 'Start 14-Day Free Trial' when asked how to sign up or test the platform.

FALLBACK GUARDRAIL:
- If a question cannot be answered directly from these rules, reply: "You can reach our team directly at support@ratingpulse.co or click 'Start 14-Day Free Trial' above to test the platform free."`;

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

    // Built-in Knowledge Engine strictly adhering to 14-Day Trial & $25/mo Pro Plan
    const lower = latestUserMessage.toLowerCase();
    let reply = '';

    if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost') || lower.includes('$25') || lower.includes('pro plan') || lower.includes('plan') || lower.includes('subscription')) {
      reply = `RatingPulse is **$25/month** on the Pro Plan and comes with a **14-Day Free Trial**.\n\nDuring your 14-day trial, you get unrestricted access to all features (unlimited automated SMS invites, sentiment routing, AI SEO replies, and Google sync). You can cancel anytime with zero penalty.`;
    } else if (lower.includes('free plan') || lower.includes('permanent free') || lower.includes('is it free') || lower.includes('trial') || lower.includes('credit card')) {
      reply = `We do not offer a permanent free tier, but we provide a full-featured **14-Day Free Trial** on our $25/month Pro Plan. You receive complete unrestricted access to all SMS automation and AI features during the trial. Click 'Start 14-Day Free Trial' at the top right to begin.`;
    } else if (lower.includes('sign up') || lower.includes('create account') || lower.includes('register') || lower.includes('how do i start') || lower.includes('get started')) {
      reply = `You can sign up in seconds by clicking **'Start 14-Day Free Trial'** at the top right of ratingpulse.co using your Google Account or email. You will get immediate access to automated review collection and AI tools.`;
    } else if (lower.includes('how') && (lower.includes('work') || lower.includes('review') || lower.includes('sms') || lower.includes('invite') || lower.includes('what is') || lower.includes('what does'))) {
      reply = `RatingPulse automates 5-star Google review collection in 3 steps:\n\n1. **Send Instant Invites**: Dispatch 1-tap review links via automated SMS or email after client visits.\n2. **Smart Sentiment Routing**: Happy clients are routed to Google Maps for 5-star reviews, while private feedback is intercepted if they had concerns.\n3. **AI SEO Replies**: Gemini AI crafts keyword-rich responses to boost your local Google Maps rankings.`;
    } else if (lower.includes('negative') || lower.includes('bad') || lower.includes('1 star') || lower.includes('3 star') || lower.includes('feedback')) {
      reply = `RatingPulse protects your public reputation with smart feedback routing. Customers rating 1-3 stars are seamlessly directed to a private resolution form so you can resolve issues privately before anything appears on Google.`;
    } else if (lower.includes('seo') || lower.includes('ranking') || lower.includes('maps') || lower.includes('ai') || lower.includes('gemini')) {
      reply = `RatingPulse uses Gemini AI to draft personalized review replies enriched with your local SEO keywords. This active engagement signals relevance to Google's algorithm and helps increase your visibility in Google Maps local search.`;
    } else {
      reply = `You can reach our team directly at support@ratingpulse.co or click 'Start 14-Day Free Trial' above to test the platform free.`;
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
