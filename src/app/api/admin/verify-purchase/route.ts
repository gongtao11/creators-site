import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ purchases: data || [] });
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
