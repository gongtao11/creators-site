import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// POST - batch upload multiple files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const title_prefix = (formData.get("title_prefix") as string) || "Photo";
    const description = (formData.get("description") as string) || "";
    const type = (formData.get("type") as string) || "photo";
    const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results: { index: number; fileName: string; url: string; contentId: string }[] = [];
    const errors: { index: number; fileName: string; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadErr } = await supabaseAdmin.storage
          .from("content")
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) throw new Error(uploadErr.message);

        const { data: urlData } = supabaseAdmin.storage.from("content").getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        const title = files.length === 1
          ? title_prefix
          : `${title_prefix} #${i + 1}`;

        const { data: content, error: insertErr } = await supabaseAdmin
          .from("contents")
          .insert({
            title,
            description,
            type,
            preview_url: publicUrl,
            full_url: publicUrl,
            price,
            is_published: true,
          })
          .select()
          .single();

        if (insertErr) throw new Error(insertErr.message);

        results.push({ index: i, fileName: file.name, url: publicUrl, contentId: content.id });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push({ index: i, fileName: file.name, error: msg });
      }
    }

    return NextResponse.json({
      success: true,
      total: files.length,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Batch upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
