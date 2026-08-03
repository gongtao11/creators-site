"use client";

import { useState } from "react";

export default function TestPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult("");
    let log = "";

    // 1. 妫€鏌ョ幆澧冨彉閲?    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    log += `URL: ${url || "鉂?鏈壘鍒?}\n`;
    log += `Key: ${key ? key.substring(0, 30) + "..." : "鉂?鏈壘鍒?}\n`;
    log += `Key 闀垮害: ${key?.length || 0}\n\n`;

    if (!url || !key) {
      log += "鉂?鐜鍙橀噺娌℃湁鍔犺浇锛侀渶瑕侀噸鍚湇鍔″櫒銆俓n";
      setResult(log);
      setLoading(false);
      return;
    }

    // 2. 娴嬭瘯杩炴帴
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, key);

      log += "瀹㈡埛绔垱寤烘垚鍔?鉁匼n";

      // 3. 灏濊瘯娉ㄥ唽
      const testEmail = "test_" + Date.now() + "@example.com";
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "test123456",
      });

      if (error) {
        log += `鉂?娉ㄥ唽澶辫触: ${error.message}\n`;
        log += `閿欒浠ｇ爜: ${error.status}\n`;
      } else {
        log += `鉁?娉ㄥ唽鎴愬姛! User ID: ${data.user?.id}\n`;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log += `鉂?寮傚父: ${msg}\n`;
    }

    setResult(log);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: "monospace", maxWidth: 700, margin: "0 auto" }}>
      <h1>Supabase 杩炴帴璇婃柇</h1>
      <button
        onClick={runTest}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          background: "#ec4899",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        {loading ? "娴嬭瘯涓?.." : "寮€濮嬭瘖鏂?}
      </button>

      {result && (
        <pre
          style={{
            background: "#1a1a2e",
            color: "#00ff88",
            padding: 20,
            borderRadius: 8,
            fontSize: 14,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
          }}
        >
          {result}
        </pre>
      )}

      <div style={{ marginTop: 30, color: "#666", fontSize: 13 }}>
        <p>濡傛灉 Key 鏄剧ず涓虹┖锛屽垯闇€瑕佸畬鍏ㄥ叧闂粓绔悗鍐嶉噸鏂?npm run dev</p>
      </div>
    </div>
  );
}
