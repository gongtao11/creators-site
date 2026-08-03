import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET images for an album
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("album_id");
  if (!albumId) return NextResponse.json({ error: "album_id required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("album_images")
    .select("*")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data || [] });
}

// POST batch upload images to album
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const albumId = formData.get("album_id") as string;
    const startIndex = parseInt((formData.get("start_index") as string) || "0");

    if (!albumId) return NextResponse.json({ error: "album_id required" }, { status: 400 });
    if (!files || files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

    const results: { url: string; sort_order: number }[] = [];
    const errors: { index: number; fileName: string; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: upErr } = await supabaseAdmin.storage
          .from("content").upload(fileName, buffer, { contentType: file.type, cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(upErr.message);

        const { data: urlData } = supabaseAdmin.storage.from("content").getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        const { error: insErr } = await supabaseAdmin
          .from("album_images")
          .insert({ album_id: albumId, url: publicUrl, sort_order: startIndex + i });
        if (insErr) throw new Error(insErr.message);

        results.push({ url: publicUrl, sort_order: startIndex + i });
      } catch (err: unknown) {
        errors.push({ index: i, fileName: file.name, error: err instanceof Error ? err.message : "Unknown" });
      }
    }

    // Set first image as cover if album has no cover
    if (results.length > 0) {
      const { data: album } = await supabaseAdmin.from("albums").select("cover_url").eq("id", albumId).single();
      if (album && !album.cover_url) {
        await supabaseAdmin.from("albums").update({ cover_url: results[0].url }).eq("id", albumId);
      }
    }

    return NextResponse.json({ success: true, total: files.length, uploaded: results.length, failed: errors.length, results });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE image
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await supabaseAdmin.from("album_images").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
