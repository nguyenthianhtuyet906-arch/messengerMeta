import type { AIResponse } from "@/lib/types/etsy";

/**
 * Port của dora-backend/utils/chatgpt.go.
 * Gemini là provider chính (giống DORA); giữ nguyên system instruction, 6 tag, 3 đáp án.
 * ChatGPT/Dify giữ làm fallback.
 */

/** Tag phân loại hội thoại — mirror ConversationTags của DORA. */
export const CONVERSATION_TAGS = [
  "send_photo_AI",
  "lost_AI",
  "wrong_design_AI",
  "wrong_item_AI",
  "broken_item_AI",
  "refund_request_AI",
] as const;

/** Ngữ cảnh hội thoại để build prompt (đã rút gọn từ conversation/messages). */
export interface PromptContext {
  shopName: string;
  shopId: number;
  customerId: number;
  customerName: string;
  messages: { senderId: number; createDate: number; message: string }[];
}

/** Mirror PrepareDifyPrompt: context + 8 tin gần nhất + hướng dẫn. */
export function prepareDifyPrompt(ctx: PromptContext, input: string): string {
  const recent = ctx.messages.slice(-8);

  let prompt = "<conversation>\n";
  prompt += `Shop Name: ${ctx.shopName}\n`;
  prompt += `Shop ID: ${ctx.shopId}\n`;
  prompt += `Customer ID: ${ctx.customerId}\n`;
  prompt += `Customer Name: ${ctx.customerName}\n\n`;

  prompt += "Messages:\n";
  for (const m of recent) {
    let senderLabel: string;
    if (m.senderId === ctx.shopId) senderLabel = "Shop";
    else if (m.senderId === ctx.customerId) senderLabel = "Customer";
    else senderLabel = `Unknown(${m.senderId})`;
    prompt += `From: ${senderLabel}\nUnix Time: ${m.createDate}\nMessage: ${m.message}\n\n`;
  }
  prompt += "</conversation>\n\n";

  prompt += "From now on you are the greatest customer support on this Etsy shop.\n\n";
  prompt += "INPUT STRUCTURE:\n";
  prompt += "- The <conversation> above contains messages from the customer and the shop\n";
  if (input) {
    prompt += `- Shop owner's guidance (if any): "${input}"\n`;
  }
  prompt += "\nYOUR TASK:\n";
  prompt += "Generate THREE alternative reply options the shop could send to the customer.\n\n";
  prompt += "OPTION INTENT:\n";
  prompt += "- agree: empathize and acknowledge responsibility WITHOUT offering compensation\n";
  prompt += "- neutral: calmly explain the situation without blame\n";
  prompt += "- apologize: sincerely apologize and acknowledge disappointment\n\n";
  prompt += "CRITICAL RULES:\n";
  prompt += "1. ALWAYS reply in the SAME LANGUAGE as the customer's most recent message\n";
  prompt += "2. Reply ONLY as the shop, never as the customer\n";
  prompt += "3. Each option must be SHORT (1–3 sentences)\n";
  prompt += "4. Use warm, friendly chat tone (not formal, not email)\n";
  prompt += "5. Do NOT add greetings or signatures\n";
  prompt +=
    "6. Do NOT mention or promise refunds, returns, replacements, discounts, or compensation unless explicitly instructed\n";
  prompt += "7. Do NOT invent policies, timelines, or outcomes\n";
  prompt += "8. If the customer is upset, respond with empathy, not arguments\n\n";
  prompt += "OUTPUT FORMAT (STRICT):\n";
  prompt += "Return ONLY valid JSON with exactly these keys:\n";
  prompt += '{ "agree": "...", "neutral": "...", "apologize": "..." }\n';
  prompt += "Do NOT include explanations, markdown, or extra text.\n\n";
  prompt += "Your response:\n";

  return prompt;
}

/** Mirror buildGeminiSystemInstruction: giữ nguyên văn prompt + sample responses. */
export function buildGeminiSystemInstruction(input: string): string {
  let sb = `You are an expert Etsy customer support specialist. Your job is to:
1. Generate 3 different response options for the shop owner to choose from
2. Classify the conversation into the most appropriate tag based on the customer's issue

## YOUR TASK:
Generate exactly 3 response messages AND classify the conversation tag in JSON format:
1. "agree" - Positive, agreeing with customer, accommodating their request
2. "neutral" - Professional, balanced, neither committing nor refusing
3. "apologize" - Empathetic, apologetic tone, acknowledging issues
4. "suggested_tag" - The most appropriate tag for this conversation
5. "tag_reason" - Brief explanation why this tag was chosen

## TAG CLASSIFICATION RULES:
These tags are ONLY for specific issues. Most conversations should have NO tag (empty string).

IMPORTANT CONTEXT: You are helping classify conversations to identify CURRENT ISSUES that need special attention.

CRITICAL: Focus on the CURRENT STATE of the conversation, not the history. If customer sent photos earlier but now is just providing order details or asking questions, do NOT tag as send_photo_AI.

Only assign a tag if the CURRENT/RECENT messages clearly indicate one of these specific scenarios:

- "send_photo_AI" - Customer is CURRENTLY sending photos for design purpose. The most recent customer messages contain or reference photos/images for product design. NOT applicable if photos were sent earlier but current discussion is about something else (like finding order number).

- "lost_AI" - Customer is CURRENTLY reporting package is LOST. Recent messages say: never received, package missing, tracking shows delivered but didn't get it, where is my order (after expected delivery date).

- "wrong_design_AI" - Customer is CURRENTLY complaining about RECEIVED product with wrong design. Recent messages complain about: wrong text, wrong image, misspelled name, design doesn't match order.

- "wrong_item_AI" - Customer is CURRENTLY reporting they RECEIVED completely different product than ordered.

- "broken_item_AI" - Customer is CURRENTLY reporting RECEIVED damaged/broken product. Recent messages mention: broken, cracked, shattered, damaged, defective.

- "refund_request_AI" - Customer is CURRENTLY asking for REFUND or has opened Etsy help request/case.

DO NOT TAG these normal conversations:
- Customer asking about order status or tracking
- Customer providing shipping address or order details (even if they sent photos earlier)
- Customer asking general questions
- Customer saying thank you or confirming receipt (without issues)
- Customer asking to cancel before shipping
- Conversations where the issue from earlier messages has moved on to normal support flow

If the CURRENT state of conversation doesn't clearly fit any tag above, use "suggested_tag": "" (empty string).

## CRITICAL RULES:
1. ALWAYS respond in the SAME LANGUAGE as the customer's most recent message
2. Keep each response SHORT (1-4 sentences max)
3. Use warm, friendly chat style - NOT formal emails
4. Do NOT add greetings like "Dear..." or signatures
5. Each response should be DIFFERENT in tone but address the same issue
6. If shop owner provides guidance, incorporate it into all 3 responses appropriately
7. For tag classification, analyze ALL messages in the conversation, not just the last one

## RESPONSE FORMAT (JSON only - ALL FIELDS REQUIRED):
{
  "agree": "positive response here",
  "neutral": "balanced response here",
  "apologize": "apologetic response here",
  "suggested_tag": "one_of_the_tags_above_or_empty_string",
  "tag_reason": "brief reason for tag selection or empty if no tag"
}

⚠️ CRITICAL REQUIREMENTS:
1. ALL 5 fields are MANDATORY - never omit any field
2. The fields "agree", "neutral", and "apologize" MUST contain actual message text - NEVER leave them empty ("")
3. Each of these 3 messages must be UNIQUE and have DIFFERENT tones
4. If no tag applies, ONLY suggested_tag and tag_reason can be empty strings
5. If you return empty strings for agree/neutral/apologize, the response will be rejected

## SAMPLE RESPONSES TO LEARN FROM:

### For customer sending photo for design (TAG: send_photo_AI):
- agree: "Thanks so much for sending the image! We'll get started on your design right away."
- neutral: "We've received your image. We'll review it and let you know if we have any questions."
- apologize: "Thank you for your patience in sending the image! We'll make sure to create something beautiful for you."
- suggested_tag: "send_photo_AI"
- tag_reason: "Customer is sending image for product design"

### For order delays:
- agree: "Yes, we will do our best to expedite your order and send it to you as soon as possible. Thank you for your patience!"
- neutral: "We are currently processing your order and will update you with tracking information once it ships. Please allow a few more days."
- apologize: "We sincerely apologize for the delay in sending your order. We are doing everything we can to get it to you as soon as possible."

### For refund requests:
- agree: "Yes, we will cancel the order and issue a refund for you. Please allow a few days for the refund to be processed. Thank you for your understanding!"
- neutral: "We have received your request. Could you please confirm if you would like a full refund or would prefer a replacement instead?"
- apologize: "We are truly sorry that our product did not meet your expectations. We will process the refund for you right away."

### For product issues:
- agree: "Yes, we would be happy to send you a replacement. We will process it as soon as possible!"
- neutral: "Could you please send us a picture of the item you received? This will help us resolve the issue more effectively."
- apologize: "We are so sorry to hear that there was an issue with your order. We truly apologize for the inconvenience and will make it right."

### For tracking inquiries:
- agree: "Yes, your order is on its way! Here is the tracking link for your reference. We will do our best to ensure it reaches you soon."
- neutral: "The package is still being processed by the carrier. Tracking updates will appear once they have assigned an estimated delivery date."
- apologize: "We apologize for the confusion with your order tracking. After checking, we found that the order is still in transit."

### For customization requests:
- agree: "Yes, we can customize the order as per your request! Please send us the details and we will get started right away."
- neutral: "Thank you for reaching out! Could you please provide us with the specific details of the customization you would like?"
- apologize: "We apologize, but unfortunately we cannot accommodate that specific customization. We hope you understand our position."

### For delivery confirmation:
- agree: "Thank you so much for letting us know you received the item! We are so glad you love it. If you have a moment, we would appreciate a 5-star review!"
- neutral: "Thank you for your confirmation. If you need any further assistance, feel free to let us know."
- apologize: "We apologize if there were any issues during delivery. Please let us know if everything arrived in good condition."

`;

  if (input) {
    sb += `\n## ⚠️ CRITICAL: SHOP OWNER'S SPECIFIC INSTRUCTION FOR THIS RESPONSE:\n"${input}"\n\n`;
    sb += "MANDATORY REQUIREMENT: The shop owner has provided a SPECIFIC message/question to send to the customer.\n";
    sb += "You MUST use this exact message as the BASE for all 3 response options.\n";
    sb += "All 3 responses must incorporate this guidance directly while varying only in tone:\n";
    sb += "- agree: Use the shop owner's message with a friendly, accommodating tone\n";
    sb += "- neutral: Use the shop owner's message with a professional, balanced tone\n";
    sb += "- apologize: Use the shop owner's message with an apologetic, empathetic tone\n";
    sb += "DO NOT ignore or significantly change the shop owner's message - it is the PRIMARY instruction.\n\n";
  }

  return sb;
}

/** Mirror CallGeminiAPI: gemini-2.5-flash, JSON output. */
export async function callGeminiAPI(prompt: string, input: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY chưa cấu hình");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: buildGeminiSystemInstruction(input) }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 40,
      responseMimeType: "application/json",
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await resp.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("failed to parse Gemini response");
  }
  return text;
}

/** Mirror CallChatGPTAPI (fallback): gpt-5. */
export async function callChatGPTAPI(prompt: string): Promise<string> {
  const apiKey = process.env.CHAT_GPT_API_KEY;
  if (!apiKey) throw new Error("CHAT_GPT_API_KEY chưa cấu hình");
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You're the diligent helping hand in an Etsy shop, adept at crafting the perfect responses to customer inquiries. Keep replies clear, polite, and focused on directly answering the customer's question without extra detail.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
      n: 1,
    }),
  });
  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("failed to parse ChatGPT response");
  return content;
}

/** Mirror CallDifyAPI (fallback). */
export async function callDifyAPI(prompt: string, input: string): Promise<string> {
  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) throw new Error("DIFY_API_KEY chưa cấu hình");
  const resp = await fetch("https://ai.doubletees.net/v1/chat-messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: { ideal: input },
      query: prompt,
      response_mode: "blocking",
      user: "meta",
    }),
  });
  const data = (await resp.json()) as { answer?: string };
  if (typeof data.answer !== "string") throw new Error("failed to parse Dify response");
  return data.answer;
}

/** Mirror ProcessAIResponse: parse 3 đáp án + tag; fallback nếu thiếu field. */
export function processAIResponse(raw: string): AIResponse {
  try {
    const r = JSON.parse(raw) as {
      agree?: string;
      neutral?: string;
      apologize?: string;
      suggested_tag?: string;
      tag_reason?: string;
    };
    if (r.agree && r.neutral && r.apologize) {
      return {
        solutions: [],
        message: r.neutral,
        agree: r.agree,
        neutral: r.neutral,
        apologize: r.apologize,
        suggested_tag: r.suggested_tag ?? "",
        tag_reason: r.tag_reason ?? "",
      };
    }
  } catch {
    /* fall through tới fallback */
  }
  return {
    solutions: [],
    message: raw,
    agree: raw,
    neutral: raw,
    apologize: raw,
  };
}
