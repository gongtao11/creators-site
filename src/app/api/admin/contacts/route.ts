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

    return NextResponse.json({ messages: enriched });
  } catch {
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

// POST - admin replies to a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content } = body;

    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: "userId and content required" }, { status: 400 });
    }

    // Get user to find email for the receiver
    let receiverId = userId;
    try {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (u?.user?.id) receiverId = u.user.id;
    } catch {}

    const { error } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: null,
        receiver_id: receiverId,
        content: content.trim(),
        is_ai: false,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
