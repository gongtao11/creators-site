import fs from "fs";
import path from "path";
import type { ScriptEntry } from "@/types";

const SCRIPT_PATH = path.join(process.cwd(), "data", "script.csv");

// 内存缓存
let cachedEntries: ScriptEntry[] | null = null;

/**
 * 简单 CSV 解析器（不依赖任何第三方库）
 * 支持双引号包裹的字段、逗号分隔
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // 双引号转义："" 表示一个字面引号
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * 解析 CSV 话术文件，返回结构化的条目列表
 */
export function loadScript(): ScriptEntry[] {
  if (cachedEntries) return cachedEntries;

  const raw = fs.readFileSync(SCRIPT_PATH, "utf-8");
  const lines = raw.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    cachedEntries = [];
    return [];
  }

  // 第一行是 header: keywords,response,category
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const keywordIdx = headers.indexOf("keywords");
  const responseIdx = headers.indexOf("response");
  const categoryIdx = headers.indexOf("category");

  const entries: ScriptEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);

    const keywordsStr = fields[keywordIdx];
    const response = fields[responseIdx];
    const category = fields[categoryIdx];

    if (!keywordsStr || !response) continue;

    const keywords = keywordsStr
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    if (keywords.length === 0) continue;

    entries.push({
      keywords,
      response: response.trim(),
      category: category?.trim() || "uncategorized",
    });
  }

  // 把 default 条目排到最后
  const defaultIdx = entries.findIndex(
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
 * 刷新缓存（上传新 CSV 后调用）
 */
export function reloadScript(): ScriptEntry[] {
  cachedEntries = null;
  return loadScript();
}

/**
 * 获取完整 CSV 原始内容（用于 LLM context）
 */
export function getScriptRawText(): string {
  return fs.readFileSync(SCRIPT_PATH, "utf-8");
}

/**
 * 更新话术文件
 */
export function updateScript(csvContent: string): void {
  fs.writeFileSync(SCRIPT_PATH, csvContent, "utf-8");
  reloadScript();
}
