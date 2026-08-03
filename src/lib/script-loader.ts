import fs from "fs";
import path from "path";
import Papa from "papaparse";
import type { ScriptEntry } from "@/types";

const SCRIPT_PATH = path.join(process.cwd(), "data", "script.csv");

// 鍐呭瓨缂撳瓨
let cachedEntries: ScriptEntry[] | null = null;

interface CsvRow {
  keywords: string;
  response: string;
  category: string;
}

/**
 * 瑙ｆ瀽 CSV 璇濇湳鏂囦欢锛岃繑鍥炵粨鏋勫寲鐨勬潯鐩垪琛? */
export function loadScript(): ScriptEntry[] {
  if (cachedEntries) return cachedEntries;

  const raw = fs.readFileSync(SCRIPT_PATH, "utf-8");
  const parsed = Papa.parse<CsvRow>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const entries: ScriptEntry[] = [];

  for (const row of parsed.data) {
    if (!row.keywords || !row.response) continue;

    const keywords = row.keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    if (keywords.length === 0) continue;

    entries.push({
      keywords,
      response: row.response.trim(),
      category: row.category?.trim() || "uncategorized",
    });
  }

  // 鎶?default 鏉＄洰鎺掑埌鏈€鍚?  const defaultIdx = entries.findIndex(
    (e) => e.keywords.length === 1 && e.keywords[0] === "default"
  );
  if (defaultIdx > -1) {
    const [defaultEntry] = entries.splice(defaultIdx, 1);
    entries.push(defaultEntry);
  }

  cachedEntries = entries;
  return entries;
}

/**
 * 鍒锋柊缂撳瓨锛堜笂浼犳柊 CSV 鍚庤皟鐢級
 */
export function reloadScript(): ScriptEntry[] {
  cachedEntries = null;
  return loadScript();
}

/**
 * 鑾峰彇瀹屾暣 CSV 鍘熷鍐呭锛堢敤浜?LLM context锛? */
export function getScriptRawText(): string {
  return fs.readFileSync(SCRIPT_PATH, "utf-8");
}

/**
 * 鏇存柊璇濇湳鏂囦欢
 */
export function updateScript(csvContent: string): void {
  fs.writeFileSync(SCRIPT_PATH, csvContent, "utf-8");
  reloadScript();
}
