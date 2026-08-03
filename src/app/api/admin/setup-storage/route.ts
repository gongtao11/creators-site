import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * POST /api/admin/setup-storage
 * 鍒涘缓 content 瀛樺偍妗? */
export async function POST(_request: NextRequest) {
  try {
    // 灏濊瘯鍒涘缓瀛樺偍妗?    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const existingBucket = buckets?.find((b) => b.name === "content");

    if (existingBucket) {
      return NextResponse.json({
        success: true,
        message: "Storage bucket 'content' already exists",
      });
    }

    const { error } = await supabaseAdmin.storage.createBucket("content", {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ["image/*", "video/*"],
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Storage bucket 'content' created",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
