export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

interface GenerateReplyPayload {
  reviewText?: string;
  authorName?: string;
  rating?: number;
  businessName?: string;
  businessCategory?: string;
  tone?: 'friendly_professional' | 'casual_enthusiastic' | 'concise_polite' | 'empathetic' | string;
  keywords?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateReplyPayload = await req.json().catch(() => ({}));
    const {
      reviewText = '',
      authorName = 'Valued Customer',
      rating = 5,
      businessName = 'our team',
      businessCategory = 'Local Business',
      tone = 'friendly_professional',
      keywords = [],
    } = body;

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are the owner of "${businessName}". Write a friendly, 2-sentence response to this Google review.

Customer Name: ${authorName}
Rating: ${rating} Stars
Review: "${reviewText || 'Great service!'}"

Rules:
- Speak strictly as the owner of ${businessName}.
- Reference details from their review (e.g., food, service, atmosphere).
- Absolutely do NOT mention dental care, medical treatments, or unrelated industries unless explicitly referenced in the customer review.
- No hashtags.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 250,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim()) {
            const cleaned = generatedText
              .trim()
              .replace(/^["']|["']$/g, '')
              .replace(/#\w+/g, '')
              .trim();
            return NextResponse.json({
              success: true,
              reply: cleaned,
              model: 'gemini-1.5-flash',
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using intelligent dynamic fallback engine:', geminiErr);
      }
    }

    // Dynamic Context-Aware Fallback Generator (Produces distinct, tailored variations)
    const reply = generateDynamicTailoredReply({
      reviewText,
      authorName,
      rating,
      businessName,
      businessCategory,
      tone,
      keywords,
    });

    return NextResponse.json({
      success: true,
      reply,
      model: 'intelligent-engine',
    });
  } catch (error: any) {
    console.error('Review Reply Generation API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate review reply' },
      { status: 500 }
    );
  }
}

/**
 * Intelligent context analyzer and dynamic reply synthesizer
 */
function generateDynamicTailoredReply({
  reviewText,
  authorName,
  rating,
  businessName,
  tone,
  keywords,
}: {
  reviewText: string;
  authorName: string;
  rating: number;
  businessName: string;
  businessCategory: string;
  tone: string;
  keywords?: string[];
}): string {
  const textLower = (reviewText || '').toLowerCase();
  const firstName = authorName.split(' ')[0] || 'there';

  // 1. High Rating (5 Stars)
  if (rating >= 5) {
    // Food / Dining / Hospitality
    if (
      textLower.includes('pizza') || textLower.includes('crust') || textLower.includes('slice') ||
      textLower.includes('delicious') || textLower.includes('tasty') || textLower.includes('food') ||
      textLower.includes('meal') || textLower.includes('burger') || textLower.includes('coffee') ||
      textLower.includes('flavor') || textLower.includes('drink') || textLower.includes('dish')
    ) {
      const foodVariants = [
        `Hi ${firstName}, thank you so much for the 5-star review! We are thrilled you loved your meal and enjoyed your visit to ${businessName}. See you again soon!`,
        `Thanks a million, ${firstName}! Our entire team takes pride in delivering fresh, delicious flavors, and hearing that you had a great experience made our day.`,
      ];
      return foodVariants[Math.floor(Math.random() * foodVariants.length)];
    }

    // Cleanliness / Atmosphere
    if (textLower.includes('clean') || textLower.includes('modern') || textLower.includes('atmosphere') || textLower.includes('vibe') || textLower.includes('space') || textLower.includes('beautiful')) {
      const cleanVariants = [
        `Thank you so much, ${firstName}! We are thrilled you enjoyed our clean, welcoming space and had a wonderful experience at ${businessName}.`,
        `Hi ${firstName}, hearing that you enjoyed our atmosphere made our day! We put a lot of care into maintaining a spotless, welcoming environment for all our guests. See you next time!`,
      ];
      return cleanVariants[Math.floor(Math.random() * cleanVariants.length)];
    }

    // Family / Kids
    if (textLower.includes('kid') || textLower.includes('daughter') || textLower.includes('son') || textLower.includes('child') || textLower.includes('family')) {
      return `Thank you for such a heartwarming note, ${firstName}! Making visits comfortable and enjoyable for families is one of our favorite parts of what we do at ${businessName}. Please send our warmest regards to your family!`;
    }

    // Fast / Prompt service / Friendly staff
    if (textLower.includes('fast') || textLower.includes('quick') || textLower.includes('prompt') || textLower.includes('wait') || textLower.includes('friendly') || textLower.includes('staff') || textLower.includes('service') || textLower.includes('recommend')) {
      const serviceVariants = [
        `Hi ${firstName}, thank you for highlighting our prompt service and welcoming team! We respect your time and love making every visit to ${businessName} as seamless as possible.`,
        `Hello ${firstName}! Your recommendation means the world to everyone at ${businessName}. Providing attentive, high-standard care is what drives us every single day.`,
        `Thanks a million, ${firstName}! We're honored by your 5-star review and thrilled you had such a pleasant experience with our team at ${businessName}.`,
      ];
      return serviceVariants[Math.floor(Math.random() * serviceVariants.length)];
    }

    // Generic 5-Star Varied Pool
    const default5Star = [
      `Thank you so much for the 5-star review, ${firstName}! We are dedicated to providing personalized, high-quality service and can't wait to welcome you back to ${businessName}.`,
      `Hi ${firstName}, we truly appreciate your generous feedback! Knowing you had an exceptional visit inspires our whole team at ${businessName} to keep setting the standard.`,
      `Wonderful feedback like yours makes our day, ${firstName}! Thank you for choosing ${businessName} and taking the time to share your experience.`,
      `Hello ${firstName}! We are deeply grateful for your support and thrilled you had such a positive experience. Looking forward to your next visit to ${businessName}!`,
    ];
    return default5Star[Math.floor(Math.random() * default5Star.length)];
  }

  // 2. Good Rating with Specific Feedback (4 Stars)
  if (rating === 4) {
    if (textLower.includes('parking') || textLower.includes('wait') || textLower.includes('busy') || textLower.includes('line')) {
      return `Hi ${firstName}, thank you for your honest 4-star review and praise for our team! We appreciate your feedback regarding the busy peak hours and are constantly working to make your experience at ${businessName} even smoother.`;
    }
    const default4Star = [
      `Hi ${firstName}, thank you for your kind 4-star review! We're glad you had a great experience overall, and we are always working to make every detail of your visit a full 5-star standard at ${businessName}.`,
      `Thank you for sharing your thoughtful feedback, ${firstName}. We appreciate your trust in ${businessName} and look forward to exceeding your expectations next time!`,
      `Hello ${firstName}, we appreciate your positive rating and feedback! Our team is committed to continuous improvement and hopes to welcome you back to ${businessName} soon.`,
    ];
    return default4Star[Math.floor(Math.random() * default4Star.length)];
  }

  // 3. Constructive / Low Rating (1-3 Stars)
  const lowRatingVariants = [
    `Dear ${firstName}, thank you for bringing this to our attention. We hold ourselves to high standards, and we sincerely apologize that your recent experience at ${businessName} did not reflect that. Please reach out to our management team directly so we can make things right.`,
    `Hi ${firstName}, we take your feedback very seriously and regret that your visit fell short of expectations. Your satisfaction is our top priority, and we would appreciate the opportunity to speak with you directly to address this.`,
    `Hello ${firstName}, thank you for your honest review. We apologize for any inconvenience caused and want to ensure this is resolved properly. Please contact our team directly at ${businessName} so we can assist you.`,
  ];
  return lowRatingVariants[Math.floor(Math.random() * lowRatingVariants.length)];
}