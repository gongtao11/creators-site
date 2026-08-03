import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateReply } from "@/lib/ai-chat";

/**
 * GET /api/messages
 * 鑾峰彇褰撳墠鐢ㄦ埛鐨勪細璇濆垪琛? */
export async function GET(request: NextRequest) {
  try {
    // 浠?cookie 鑾峰彇鐢ㄦ埛
    const token =
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get("supabase-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 鏌ヨ璇ョ敤鎴风浉鍏崇殑鎵€鏈夋秷鎭紝鎸変細璇濆垎缁?    // 浼氳瘽 = 涓庤绮変笣鐨勬墍鏈夋秷鎭?(receiver_id = user.id)
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 濡傛灉鐢ㄦ埛鏄?admin (鍒涗綔鑰?锛岃幏鍙栨墍鏈夊彂缁欏垱浣滆€呯殑娑堟伅
    // 鍏堟妸娑堟伅鎸変細璇濈粍缁?    const conversationsMap = new Map<
      string,
      {
        userId: string;
        lastMessage: string;
        lastMessageAt: string;
        unread: number;
      }
    >();

    for (const msg of messages || []) {
      const key = msg.sender_id || "ai";
      const existing = conversationsMap.get(key);

      if (!existing || msg.created_at > existing.lastMessageAt) {
        conversationsMap.set(key, {
          userId: key,
          lastMessage: msg.content.slice(0, 100),
          lastMessageAt: msg.created_at,
          unread: (existing?.unread || 0) + (msg.is_ai ? 0 : 0), // AI 娑堟伅涓嶇畻鏈
        });
      }
    }

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json({ conversations, messages });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * 鍙戦€佹秷鎭苟鑾峰彇 AI 鍥炲
 */
export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get("supabase-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // 1. 瀛樺偍鐢ㄦ埛娑堟伅
    const { data: userMsg, error: userMsgError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: user.id, // 鍙戠粰鍒涗綔鑰?(鍚屼竴涓汉浣滀负鎺ユ敹鑰?
        content: content.trim(),
        is_ai: false,
      })
      .select()
      .single();

    if (userMsgError) {
      return NextResponse.json(
        { error: userMsgError.message },
        { status: 500 }
      );
    }

    // 2. 鐢熸垚 AI 鍥炲
    const aiResult = await generateReply(content.trim());

    // 3. 瀛樺偍 AI 鍥炲
    const { data: aiMsg, error: aiMsgError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: null, // null = AI/绯荤粺
        receiver_id: user.id,
        content: aiResult.response,
        is_ai: true,
        trigger_keyword: aiResult.triggerKeyword,
      })
      .select()
      .single();

    if (aiMsgError) {
      // AI 娑堟伅瀛樺偍澶辫触锛屼絾鐢ㄦ埛娑堟伅宸插瓨锛岃繑鍥為儴鍒嗘垚鍔?      console.error("Failed to store AI reply:", aiMsgError);
      return NextResponse.json({
        userMessage: userMsg,
        aiReply: {
          content: aiResult.response,
          is_ai: true,
          trigger_keyword: aiResult.triggerKeyword,
          source: aiResult.source,
        },
        warning: "AI reply not persisted",
      });
    }

    return NextResponse.json({
      userMessage: userMsg,
      aiReply: aiMsg,
    });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
