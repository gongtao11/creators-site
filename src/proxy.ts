import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Proxy: 姣忎釜椤甸潰鍐呴儴鑷妫€鏌ョ櫥褰曠姸鎬侊紝杩欓噷鍙仛杞彂
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/messages/:path*", "/profile/:path*", "/admin/:path*"],
};
