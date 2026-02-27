/**
 * 兑换码批量生成脚本
 *
 * 使用方法:
 *   pnpm tsx scripts/generate-redemption-codes.ts --count 50
 *   pnpm tsx scripts/generate-redemption-codes.ts              # 默认生成 10 个
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const CHAR_SET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_PREFIX = "wolf";
const SEGMENT_LENGTH = 4;
const SEGMENT_COUNT = 2;
const DEFAULT_CREDITS_AMOUNT = 5;
const DEFAULT_COUNT = 10;

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function generateCode(): string {
  const segments: string[] = [];
  for (let s = 0; s < SEGMENT_COUNT; s++) {
    let segment = "";
    const bytes = crypto.randomBytes(SEGMENT_LENGTH);
    for (let i = 0; i < SEGMENT_LENGTH; i++) {
      segment += CHAR_SET[bytes[i] % CHAR_SET.length];
    }
    segments.push(segment);
  }
  return `${CODE_PREFIX}-${segments.join("-")}`;
}

function parseArgs(): { count: number } {
  const args = process.argv.slice(2);
  let count = DEFAULT_COUNT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        count = parsed;
      }
      i++;
    }
  }
  return { count };
}

async function main() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  loadEnvFile(envPath);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    console.error("Ensure .env.local is configured.");
    process.exit(1);
  }

  const { count } = parseArgs();
  console.log(`Generating ${count} redemption codes...\n`);

  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateCode());
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const rows = Array.from(codes).map((code) => ({
    code,
    credits_amount: DEFAULT_CREDITS_AMOUNT,
    is_redeemed: false,
  }));

  const { error } = await supabase
    .from("redemption_codes")
    .insert(rows as never[]);

  if (error) {
    console.error("Failed to insert codes:", error.message);
    process.exit(1);
  }

  const codeList = Array.from(codes);

  console.log(`=== 生成完成：${codeList.length} 个兑换码 ===\n`);
  console.log(codeList.join("\n"));
  console.log(`\n复制以上内容即可上架到链动小铺。`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
