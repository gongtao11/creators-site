import { NextRequest, NextResponse } from "next/server";
import { updateScript, loadScript } from "@/lib/script-loader";
import { supabaseAdmin } from "@/lib/supabase-server";


export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get("supabase-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entries = loadScript();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("GET /api/script error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {
    const token =
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get("supabase-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json(
        { error: "csvContent is required" },
        { status: 400 }
      );
    }

    updateScript(csvContent);
    const entries = loadScript();

    return NextResponse.json({
      success: true,
      count: entries.length,
    });
  } catch (error) {
    console.error("PUT /api/script error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
