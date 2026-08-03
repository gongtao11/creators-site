import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, albumId, contentTitle, amount, cryptoType, txHash, userEmail } = body;
    const targetId = albumId || contentId;

    if (!targetId || !amount || !cryptoType || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
    if (userErr) throw userErr;

    const user = (users?.users || []).find(
      (u: { email?: string }) => u.email?.toLowerCase() === (userEmail || "").toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("purchases")
      .insert({
        user_id: user.id,
        content_id: targetId,
        content_title: contentTitle,
        plan: "single",
        status: "pending",
        amount,
        crypto_type: cryptoType,
        tx_hash: txHash,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, purchase: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Purchase failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
