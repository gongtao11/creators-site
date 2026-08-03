import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const albumId = formData.get("album_id") as string;
    const startIndex = parseInt((formData.get("start_index") as string) || "0");

    if (!albumId) return NextResponse.json({ error: "album_id required" }, { status: 400 });
    if (!files || files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

    // Upload files in batches of 5 in parallel for speed
    const BATCH_SIZE = 5;
    const results: { url: string; sort_order: number }[] = [];
    const errors: { index: number; fileName: string; error: string }[] = [];

    for (let batchStart = 0; batchStart < files.length; batchStart += BATCH_SIZE) {
      const batch = files.slice(batchStart, batchStart + BATCH_SIZE);
      const batchPromises = batch.map(async (file, batchIdx) => {
        const i = batchStart + batchIdx;
        try {
          const ext = file.name.split(".").pop() || "jpg";
          const fileName = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`;
          const buffer = Buffer.from(await file.arrayBuffer());

          const { error: upErr } = await supabaseAdmin.storage
            .from("content").upload(fileName, buffer, {
              contentType: file.type || "image/jpeg",
              cacheControl: "3600",
              upsert: false,
            });
          if (upErr) throw new Error(upErr.message);

          const { data: urlData } = supabaseAdmin.storage.from("content").getPublicUrl(fileName);
          const publicUrl = urlData.publicUrl;

          const { error: insErr } = await supabaseAdmin
            .from("album_images")
            .insert({ album_id: albumId, url: publicUrl, sort_order: startIndex + i });
          if (insErr) throw new Error(insErr.message);

          return { url: publicUrl, sort_order: startIndex + i };
        } catch (err: unknown) {
          errors.push({ index: i, fileName: file.name, error: err instanceof Error ? err.message : "Unknown" });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((r) => { if (r) results.push(r); });
    }

    // Set cover image if none exists
    if (results.length > 0) {
      const { data: album } = await supabaseAdmin.from("albums").select("cover_url").eq("id", albumId).single();
      if (album && !album.cover_url) {
        await supabaseAdmin.from("albums").update({ cover_url: results[0].url }).eq("id", albumId);
      }
    }

    return NextResponse.json({
      success: true,
      total: files.length,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await supabaseAdmin.from("album_images").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
