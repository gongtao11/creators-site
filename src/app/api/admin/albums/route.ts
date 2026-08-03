import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET all albums
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ albums: data || [] });
}

// POST create album
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, type, price, cover_url, is_published } = body;
  const { data, error } = await supabaseAdmin
    .from("albums")
    .insert({ title, description, type: type || "photo", price, cover_url, is_published: is_published ?? true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ album: data });
}

// PUT update album
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, title, description, price, is_published } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const { error } = await supabaseAdmin
    .from("albums")
    .update({ title, description, price, is_published })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE album
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await supabaseAdmin.from("album_images").delete().eq("album_id", id);
  await supabaseAdmin.from("albums").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
