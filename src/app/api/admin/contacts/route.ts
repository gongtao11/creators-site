import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

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
  } catch (err) {
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}
