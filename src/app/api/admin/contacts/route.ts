import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enrich with user emails
    const enriched: any[] = [];
    for (const msg of messages || []) {
      let email = "AI (System)";
      if (msg.sender_id) {
        try {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(msg.sender_id);
          if (u?.user?.email) email = u.user.email;
        } catch {}
      }
      enriched.push({ ...msg, user_email: email });
    }

    // Build threaded conversations: group by the user (fan) ID
    // Each thread = messages where sender_id OR receiver_id belongs to that user
    const threadMap = new Map<string, { email: string; messages: any[] }>();
    for (const msg of enriched) {
      // Determine which user this message belongs to
      let userId = msg.sender_id || msg.receiver_id;
      if (!userId) continue; // skip orphan messages

      if (!threadMap.has(userId)) {
        threadMap.set(userId, { email: msg.user_email || userId, messages: [] });
      }
      threadMap.get(userId)!.messages.push(msg);
    }

    // Sort each thread chronologically
    const threads = Array.from(threadMap.entries()).map(([id, data]) => ({
      userId: id,
      email: data.email,
      msgCount: data.messages.length,
      messages: data.messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
      lastDate: data.messages[data.messages.length - 1]?.created_at || "",
    }));

    return NextResponse.json({ messages: enriched, threads });
  } catch {
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content } = body;
    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: "userId and content required" }, { status: 400 });
    }

    // Insert creator reply with sender_id = null but is_creator flag via content
    const { error } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: null,
        receiver_id: userId,
        content: "[Creator] " + content.trim(),
        is_ai: false,
      });

    if (error) {
      // Fallback: insert without constraint
      const { error: e2 } = await supabaseAdmin
        .from("messages")
        .insert({
          receiver_id: userId,
          content: "[Creator] " + content.trim(),
          is_ai: false,
        });
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
