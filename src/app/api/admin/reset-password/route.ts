import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * POST /api/admin/reset-password
 * 鐢ㄧ鐞嗗憳鏉冮檺閲嶇疆鎸囧畾鐢ㄦ埛鐨勫瘑鐮? */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and newPassword required" },
        { status: 400 }
      );
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

    // 閲嶇疆瀵嗙爜
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Password reset for ${email}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
