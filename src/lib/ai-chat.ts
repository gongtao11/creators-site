import { loadScript, getScriptRawText } from "./script-loader";
import type { AiMatchResult } from "@/types";

/**
 * 棰勫鐞嗙敤鎴锋秷鎭? */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // 鍘绘爣鐐?    .replace(/\s+/g, " ") // 鍚堝苟绌烘牸
    .trim();
}

/**
 * 鍏抽敭璇嶅尮閰嶅紩鎿? */
function keywordMatch(userMessage: string): AiMatchResult | null {
  const entries = loadScript();
  const normalized = normalize(userMessage);

  // 鎸夐『搴忛亶鍘?(default 鍦ㄦ渶鍚?
  for (const entry of entries) {
    // 妫€鏌ユ槸鍚︽槸 default 鏉＄洰
    if (entry.keywords.length === 1 && entry.keywords[0] === "default") {
      continue; // 璺宠繃 default锛屾渶鍚庣粺涓€澶勭悊
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

  return null; // 娌℃湁鍖归厤
}

/**
 * 鑾峰彇榛樿鍏滃簳鍥炲
 */
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

/**
 * Claude API 鍏滃簳
 */
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

/**
 * 涓诲叆鍙ｏ細澶勭悊鐢ㄦ埛娑堟伅骞惰繑鍥?AI 鍥炲
 *
 * 浼樺厛绾э細
 * 1. 鍏抽敭璇嶇簿纭尮閰?(鍏嶈垂銆佸嵆鏃?
 * 2. Claude API 鍏滃簳   (闇€閰嶇疆 API Key)
 * 3. CSV default 琛?   (鏃?API Key 鏃剁殑鍏滃簳)
 */
export async function generateReply(userMessage: string): Promise<AiMatchResult> {
  // Step 1: 鍏抽敭璇嶅尮閰?  const keywordResult = keywordMatch(userMessage);
  if (keywordResult) return keywordResult;

  // Step 2: Claude API 鍏滃簳
  const claudeResult = await claudeFallback(userMessage);
  if (claudeResult) return claudeResult;

  // Step 3: 榛樿鍏滃簳
  const defaultResult = getDefaultResponse();
  if (defaultResult) return defaultResult;

  // 鏋佺鎯呭喌锛氭病鏈変换浣曞厹搴?  return {
    matched: false,
    response: "Thanks for your message! I'll get back to you soon 馃槝",
    triggerKeyword: null,
    category: "system-fallback",
    source: "default",
  };
}

/**
 * 绠€鍗曠増鏈細浠呭叧閿瘝鍖归厤 + default锛屼笉璋冪敤 LLM
 * 閫傚悎娴嬭瘯鏈熸垨涓嶆兂鐢?AI API 鏃? */
export function generateReplySync(userMessage: string): AiMatchResult {
  const keywordResult = keywordMatch(userMessage);
  if (keywordResult) return keywordResult;

  const defaultResult = getDefaultResponse();
  if (defaultResult) return defaultResult;

  return {
    matched: false,
    response: "Thanks for your message! I'll get back to you soon 馃槝",
    triggerKeyword: null,
    category: "system-fallback",
    source: "default",
  };
}
