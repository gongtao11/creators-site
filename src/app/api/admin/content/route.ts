import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * GET /api/admin/content - 鑾峰彇鎵€鏈夊唴瀹? * POST /api/admin/content - 鍒涘缓鏂板唴瀹? * PUT /api/admin/content - 鏇存柊鍐呭
 * DELETE /api/admin/content - 鍒犻櫎鍐呭
 */

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contents: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("contents")
      .insert({
        title: body.title,
        description: body.description || "",
        type: body.type,
        preview_url: body.preview_url || null,
        full_url: body.full_url || body.preview_url || null,
        price: body.price || null,
        is_published: body.is_published ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ content: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("contents")
      .update({
        title: updates.title,
        description: updates.description || "",
        type: updates.type,
        preview_url: updates.preview_url || null,
        full_url: updates.full_url || updates.preview_url || null,
        price: updates.price || null,
        is_published: updates.is_published ?? true,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ content: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("contents")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
