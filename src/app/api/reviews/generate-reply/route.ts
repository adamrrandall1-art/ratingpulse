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
        const prompt = `You are the owner of "${businessName}". Write a genuine, warm 2-sentence response to this Google review.

Reviewer: ${authorName}
Rating: ${rating} Stars
Review Content: "${reviewText || 'Great service!'}"

STRICT GUIDELINES:
1. HIGHLIGHT SPECIFIC ITEMS: If the reviewer mentions specific menu items, products, or service highlights (for example: ice cream flavors, tacos, slices, portion sizes, staff names), you MUST explicitly mention those exact items/details in your reply. Do not give generic compliments when specific items were praised.
2. NATURAL & AUTHENTIC TONE: Write casually and warmly as a local shop owner. Avoid corporate jargon like "our team puts a lot of passion into crafting every order".
3. NO HASHTAGS: Strictly forbidden. Do not include any # tags.
4. FRESH DIVERSITY: Provide a distinct and creative phrasing variation each time this runs.`;

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
                temperature: 0.85,
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
    // Specific item detection (e.g. ice cream tacos, tacos, ice cream, pizza, burger, etc.)
    const itemMatch = textLower.match(/(?:ice cream tacos?|ice cream|tacos?|pizza|slices?|burgers?|pasta|fries|coffee|latte|sandwiches?|wings?|sushi|salad|shakes?|desserts?|specials?)/i);
    if (itemMatch) {
      const item = itemMatch[0];
      const itemVariants = [
        `Hi ${firstName}, thank you so much for the 5-star review! We're so glad you loved the ${item} at ${businessName}. Can't wait to see you again soon!`,
        `Thanks for the awesome review, ${firstName}! Hearing how much you enjoyed the ${item} made our day here at ${businessName}. See you next time!`,
        `Hi ${firstName}, we really appreciate your 5-star review! The ${item} is definitely one of our favorites too. Hope to have you back at ${businessName} soon!`,
      ];
      return itemVariants[Math.floor(Math.random() * itemVariants.length)];
    }

    // Food / Dining / Hospitality general
    if (
      textLower.includes('delicious') || textLower.includes('tasty') || textLower.includes('food') ||
      textLower.includes('meal') || textLower.includes('flavor') || textLower.includes('drink') || textLower.includes('dish')
    ) {
      const foodVariants = [
        `Hi ${firstName}, thank you so much for the 5-star review! We are thrilled you enjoyed your visit to ${businessName}. See you again soon!`,
        `Thanks a million, ${firstName}! We love hearing that you enjoyed everything during your visit to ${businessName}.`,
        `Hi ${firstName}! Appreciate the great review—delivering delicious flavors is our passion here at ${businessName}.`,
      ];
      return foodVariants[Math.floor(Math.random() * foodVariants.length)];
    }

    // Cleanliness / Atmosphere
    if (textLower.includes('clean') || textLower.includes('modern') || textLower.includes('atmosphere') || textLower.includes('vibe') || textLower.includes('space') || textLower.includes('beautiful')) {
      const cleanVariants = [
        `Thank you so much, ${firstName}! We are thrilled you enjoyed the atmosphere and had a wonderful experience at ${businessName}.`,
        `Hi ${firstName}, hearing that you enjoyed the vibe made our day! We put a lot of care into maintaining a welcoming spot at ${businessName}. See you next time!`,
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
        `Hi ${firstName}, thank you for highlighting our prompt service and welcoming team! We love making every visit to ${businessName} as seamless as possible.`,
        `Hello ${firstName}! Your recommendation means the world to everyone at ${businessName}. We appreciate your support!`,
        `Thanks a million, ${firstName}! We're honored by your 5-star review and thrilled you had such a pleasant experience with our team at ${businessName}.`,
      ];
      return serviceVariants[Math.floor(Math.random() * serviceVariants.length)];
    }

    // Generic 5-Star Varied Pool
    const default5Star = [
      `Thank you so much for the 5-star review, ${firstName}! We appreciate your support and can't wait to welcome you back to ${businessName}.`,
      `Hi ${firstName}, we truly appreciate your generous feedback! Knowing you had an exceptional visit inspires our whole team at ${businessName}.`,
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