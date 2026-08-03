import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * POST /api/register
 * 鐢?service_role 缁曡繃閭欢棰戠巼闄愬埗鐩存帴娉ㄥ唽
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // 鐢?admin 鏉冮檺鍒涘缓鐢ㄦ埛 (缁曡繃閭欢闄愬埗)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 鐩存帴纭閭
      user_metadata: { username },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 鍒涘缓 profile
    if (data.user) {
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: data.user.id,
          username: username || email.split("@")[0],
        })
        .select();
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
