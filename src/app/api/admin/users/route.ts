import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const users = data?.users || [];

    const enriched = await Promise.all(
      users.map(async (u) => {
        let purchaseCount = 0;
        try {
          const { count } = await supabaseAdmin
            .from("purchases")
            .select("*", { count: "exact", head: true })
            .eq("user_id", u.id);
          purchaseCount = count || 0;
        } catch {}

        let messageCount = 0;
        try {
          const { count } = await supabaseAdmin
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", u.id);
          messageCount = count || 0;
        } catch {}

        return {
          id: u.id,
          email: u.email || "N/A",
          username: u.user_metadata?.username || u.email?.split("@")[0] || "N/A",
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at || null,
          purchase_count: purchaseCount,
          message_count: messageCount,
        };
      })
    );

    const total = enriched.length;
    const activeToday = enriched.filter((u) => {
      if (!u.last_sign_in) return false;
      const diff = Date.now() - new Date(u.last_sign_in).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }).length;

    return NextResponse.json({ users: enriched, total, activeToday });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
