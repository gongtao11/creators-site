import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateReply } from "@/lib/ai-chat";


export async function GET(request: NextRequest) {
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

    
    
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    
    
    const conversationsMap = new Map<
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
          unread: (existing?.unread || 0) + (msg.is_ai ? 0 : 0), 
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

    
    const { data: userMsg, error: userMsgError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: user.id, 
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

    
    const aiResult = await generateReply(content.trim());

    
    const { data: aiMsg, error: aiMsgError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: null, 
        receiver_id: user.id,
        content: aiResult.response,
        is_ai: true,
        trigger_keyword: aiResult.triggerKeyword,
      })
      .select()
      .single();

    if (aiMsgError) {
      
      console.error("Failed to store AI reply:", aiMsgError);
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
