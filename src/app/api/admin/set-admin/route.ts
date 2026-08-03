import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * PUT /api/admin/set-admin
 * 灏嗘寚瀹氱敤鎴疯涓虹鐞嗗憳
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // 鏌ユ壘鐢ㄦ埛
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const user = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 璁句负绠＄悊鍛?    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        username:
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          "admin",
        is_admin: true,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      message: "Admin privileges granted",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
