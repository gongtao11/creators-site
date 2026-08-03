import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST() {
  let log = "";
  try {
    // site_settings table
    const { error: e1 } = await supabaseAdmin.rpc("exec_sql", {
      sql: "CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())",
    }).maybeSingle();
    if (e1) log += "settings table skipped: " + e1.message + "\n";
    else log += "site_settings OK\n";

    // purchases columns
    const { error: e2 } = await supabaseAdmin.rpc("exec_sql", {
      sql: "ALTER TABLE purchases ADD COLUMN IF NOT EXISTS tx_hash TEXT",
    }).maybeSingle();
    if (e2) log += "tx_hash skipped: " + e2.message + "\n";
    else log += "tx_hash column OK\n";

    const { error: e3 } = await supabaseAdmin.rpc("exec_sql", {
      sql: "ALTER TABLE purchases ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2)",
    }).maybeSingle();
    if (e3) log += "amount skipped\n";
    else log += "amount column OK\n";

    const { error: e4 } = await supabaseAdmin.rpc("exec_sql", {
      sql: "ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_type TEXT",
    }).maybeSingle();
    if (e4) log += "crypto_type skipped\n";
    else log += "crypto_type column OK\n";

    const { error: e5 } = await supabaseAdmin.rpc("exec_sql", {
      sql: "ALTER TABLE purchases ADD COLUMN IF NOT EXISTS content_title TEXT",
    }).maybeSingle();
    if (e5) log += "content_title skipped\n";
    else log += "content_title column OK\n";

    return NextResponse.json({ success: true, log });
  } catch (err) {
    return NextResponse.json({ error: "DB init may need Supabase SQL Editor: " + String(err), log }, { status: 500 });
  }
}
