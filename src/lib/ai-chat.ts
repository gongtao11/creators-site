import { loadScript, getScriptRawText } from "./script-loader";
import type { AiMatchResult } from "@/types";


function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") 
    .replace(/\s+/g, " ") 
    .trim();
}


function keywordMatch(userMessage: string): AiMatchResult | null {
  const entries = loadScript();
  const normalized = normalize(userMessage);

  
  for (const entry of entries) {
    
    if (entry.keywords.length === 1 && entry.keywords[0] === "default") {
      continue; 
    }

    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        return {
          matched: true,
          response: entry.response,
          triggerKeyword: keyword,
          category: entry.category,
          source: "keyword",
        };
      }
    }
  }

  return null; 
}


function getDefaultResponse(): AiMatchResult | null {
  const entries = loadScript();
  const defaultEntry = entries.find(
    (e) => e.keywords.length === 1 && e.keywords[0] === "default"
  );
  if (defaultEntry) {
    return {
      matched: true,
      response: defaultEntry.response,
      triggerKeyword: "default",
      category: defaultEntry.category,
      source: "default",
    };
  }
  return null;
}


async function claudeFallback(userMessage: string): Promise<AiMatchResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const scriptContent = getScriptRawText();
    const creatorName = process.env.NEXT_PUBLIC_CREATOR_NAME || "the creator";

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are ${creatorName}, a content creator responding to a fan's private message on your exclusive content website.

## Your persona
- Friendly, warm, slightly playful and flirty but not explicit
- Reply in English with occasional natural emoji
- Keep responses short (20-50 words), like real person texting
- NEVER say you are an AI, a bot, or automated
- NEVER provide personal contact info (WhatsApp, phone, Instagram, etc.)
- Encourage fans to subscribe or check out your content naturally

## Your scripted responses (reference these when applicable)
${scriptContent}

## Rules
- If the fan's message matches a topic in the script, follow that tone
- If not, respond naturally according to your persona
- Always be positive and engaging
- Guide fans toward subscriptions and paid content subtly`;

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = msg.content
      .filter((c) => c.type === "text")
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");

    if (text) {
      return {
        matched: true,
        response: text.trim(),
        triggerKeyword: null,
        category: "ai-fallback",
        source: "claude",
      };
    }
  } catch (error) {
    console.error("Claude API fallback failed:", error);
  }

  return null;
}


export async function generateReply(userMessage: string): Promise<AiMatchResult> {
  
  const keywordResult = keywordMatch(userMessage);
  if (keywordResult) return keywordResult;

  
  const claudeResult = await claudeFallback(userMessage);
  if (claudeResult) return claudeResult;

  
  const defaultResult = getDefaultResponse();
  if (defaultResult) return defaultResult;

  
  return {
    matched: false,
    response: "Thanks for your message! I'll get back to you soon 😘",
    triggerKeyword: null,
    category: "system-fallback",
    source: "default",
  };
}


export function generateReplySync(userMessage: string): AiMatchResult {
  const keywordResult = keywordMatch(userMessage);
  if (keywordResult) return keywordResult;

  const defaultResult = getDefaultResponse();
  if (defaultResult) return defaultResult;

  return {
    matched: false,
    response: "Thanks for your message! I'll get back to you soon 😘",
    triggerKeyword: null,
    category: "system-fallback",
    source: "default",
  };
}
