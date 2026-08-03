import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("*");

    if (error) throw error;

    const wallets: Record<string, string> = {};
    (data || []).forEach((row: { key: string; value: string }) => {
      wallets[row.key] = row.value;
    });

    return NextResponse.json({ wallets });
  } catch {
    return NextResponse.json({ wallets: {} });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
