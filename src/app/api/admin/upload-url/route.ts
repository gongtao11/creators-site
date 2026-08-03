import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName) return NextResponse.json({ error: "fileName required" }, { status: 400 });

    // Generate a unique filename
    const ext = fileName.split(".").pop() || "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Create a signed upload URL that bypasses Netlify's 6MB limit
    const { data, error } = await supabaseAdmin.storage
      .from("content")
      .createSignedUploadUrl(uniqueName);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get the public URL that will be accessible after upload
    const { data: urlData } = supabaseAdmin.storage.from("content").getPublicUrl(uniqueName);

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      publicUrl: urlData.publicUrl,
      uniqueName,
      token: data.token,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
