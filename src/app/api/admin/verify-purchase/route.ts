import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data: purchases, error } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get user emails
    const purchasesWithEmail = [];
    for (const p of purchases || []) {
      let email = "unknown";
      if (p.user_id) {
        try {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("username")
            .eq("id", p.user_id)
            .single();
          if (profile) email = profile.username || email;

          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(p.user_id);
          if (authUser?.user?.email) email = authUser.user.email;
        } catch { }
      }
      purchasesWithEmail.push({ ...p, user_email: email });
    }

    return NextResponse.json({ purchases: purchasesWithEmail });
  } catch (error) {
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { purchaseId, status } = body;

    if (!purchaseId || !status) {
      return NextResponse.json({ error: "purchaseId and status required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("purchases")
      .update({ status })
      .eq("id", purchaseId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
