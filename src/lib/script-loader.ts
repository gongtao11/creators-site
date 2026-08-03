import fs from "fs";
import path from "path";
import type { ScriptEntry } from "@/types";

const SCRIPT_PATH = path.join(process.cwd(), "data", "script.csv");


let cachedEntries: ScriptEntry[] | null = null;


function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        
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


export function loadScript(): ScriptEntry[] {
  if (cachedEntries) return cachedEntries;

  const raw = fs.readFileSync(SCRIPT_PATH, "utf-8");
  const lines = raw.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    cachedEntries = [];
    return [];
  }

  
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


export function reloadScript(): ScriptEntry[] {
  cachedEntries = null;
  return loadScript();
}


export function getScriptRawText(): string {
  return fs.readFileSync(SCRIPT_PATH, "utf-8");
}


export function updateScript(csvContent: string): void {
  fs.writeFileSync(SCRIPT_PATH, csvContent, "utf-8");
  reloadScript();
}
