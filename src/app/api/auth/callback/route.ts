import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * GET /api/auth/callback
 * Supabase email 楠岃瘉鍥炶皟
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // 浜ゆ崲 code 鑾峰彇 session (鐢?Supabase 瀹㈡埛绔湪娴忚鍣ㄧ澶勭悊)
    // 杩欓噷鍙仛閲嶅畾鍚?    const next = requestUrl.searchParams.get("next") || "/";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
