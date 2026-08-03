import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// POST - add image URLs to an album (files already uploaded directly to Supabase Storage)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { albumId, urls, startIndex } = body;

    if (!albumId) return NextResponse.json({ error: "albumId required" }, { status: 400 });
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls array required" }, { status: 400 });
    }

    const rows = urls.map((url: string, i: number) => ({
      album_id: albumId,
      url,
      sort_order: (startIndex || 0) + i,
    }));

    const { error } = await supabaseAdmin.from("album_images").insert(rows);
    if (error) throw error;

    // Set cover if none exists
    const { data: album } = await supabaseAdmin.from("albums").select("cover_url").eq("id", albumId).single();
    if (album && !album.cover_url && urls.length > 0) {
      await supabaseAdmin.from("albums").update({ cover_url: urls[0] }).eq("id", albumId);
    }

    return NextResponse.json({ success: true, count: urls.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
