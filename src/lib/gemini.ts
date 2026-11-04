import { GoogleGenAI } from '@google/genai';

export interface ReviewReplyOptions {
  reviewerName?: string;
  authorName?: string;
  author_name?: string;
  starRating?: number;
  rating?: number;
  reviewText?: string;
  review_text?: string;
  text?: string;
  brandVoice?: string;
  tone?: string;
  seoKeywords?: string | string[];
  keywords?: string | string[];
  customKeywords?: string | string[];
  customInstructions?: string;
  aiInstructions?: string;
  replySignature?: string;
  aiSignature?: string;
  signature?: string;
  model?: string;
}

/**
 * Builds the strict, natural review response prompt preventing literal keyword echoing.
 */
export function buildReviewReplyPrompt(options: ReviewReplyOptions): string {
  const reviewerName = options.reviewerName || options.authorName || options.author_name || 'Customer';
  const starRating = options.starRating ?? options.rating ?? 5;
  const reviewText = options.reviewText || options.review_text || options.text || 'Great experience!';
  const brandVoice = options.brandVoice || options.tone || 'friendly and professional';

  const rawKeywords = options.seoKeywords ?? options.keywords ?? options.customKeywords;
  const seoKeywords = Array.isArray(rawKeywords)
    ? rawKeywords.filter(Boolean).map((k) => String(k).trim()).join(', ')
    : typeof rawKeywords === 'string'
      ? rawKeywords.trim()
      : '';

  const customInstructions = (options.customInstructions || options.aiInstructions || '').trim();
  const replySignature = (options.replySignature || options.aiSignature || options.signature || '').trim();

  const prompt = `You are the business owner responding warmly and publicly to a Google customer review.

REVIEW DETAILS:
- Reviewer: ${reviewerName || 'Customer'}
- Star Rating: ${starRating || 5} Stars
- Review Content: "${reviewText || 'Great experience!'}"

REPLY PARAMETERS:
- Brand Tone: ${brandVoice || 'friendly and professional'}
- Length: 2 to 3 natural, conversational sentences.

KEYWORD INTEGRATION RULES:
${seoKeywords ? `- Seamlessly and naturally weave 1 or 2 of these phrases into your own sentences ONLY if they flow conversationally: "${seoKeywords}".
- ABSOLUTELY FORBIDDEN: Do not write "mentioning our commitment to...", "we value our...", or copy-paste the keyword list as an awkward add-on.
- The reader must NEVER be able to tell that keywords were targeted.` : ''}

${customInstructions ? `BUSINESS POLICIES & SPECIAL INSTRUCTIONS:
- Follow these rules: "${customInstructions}"` : ''}

${replySignature ? `SIGNATURE:
- Conclude with this sign-off on a new line: "${replySignature}"` : ''}

OUTPUT FORMAT:
- Return ONLY the exact public reply text. No meta-commentary, no quotes around the reply, no introductory notes.`;

  return prompt;
}

/**
 * Generates an AI review reply using Gemini with strict invisible keyword integration rules.
 */
export async function generateGeminiReviewReply(options: ReviewReplyOptions): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    '';

  if (!apiKey) {
    throw new Error('Missing Gemini API Key in environment');
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildReviewReplyPrompt(options);

  const model = options.model || 'gemini-2.5-flash';

  const callPromise = ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 0,
      },
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Generation timed out. Please try again.')), 8000)
  );

  const response: any = await Promise.race([callPromise, timeoutPromise]);
  let reply = (response?.text || '').trim().replace(/^["']|["']$/g, '');

  const sig = (options.replySignature || options.aiSignature || options.signature || '').trim();
  if (sig && !reply.includes(sig)) {
    reply = `${reply}\n\n${sig}`;
  }

  return reply;
}
