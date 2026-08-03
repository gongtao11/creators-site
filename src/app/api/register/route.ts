import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";


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

    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, 
      user_metadata: { username },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    
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
