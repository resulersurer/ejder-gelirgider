import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(fileURLToPath(import.meta.url), "..", "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    const trimmed = rawValue.trim();
    process.env[key] = /^(['"]).*\1$/.test(trimmed) ? trimmed.slice(1, -1) : trimmed;
  }
}

loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

const { PrismaClient } = await import("../src/generated/prisma/index.js");

const CATEGORY_NAMES = [
  "Tur Tahsilatı", "Acenta Tahsilatı", "Otel Ödemesi", "Uçak Ödemesi", "Rehber Ödemesi",
  "Transfer", "Personel", "Vergi", "Komisyon", "Banka Masrafı", "Diğer",
];

const db = new PrismaClient();
try {
  for (const name of CATEGORY_NAMES) {
    await db.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`${CATEGORY_NAMES.length} kategori hazır.`);
} finally {
  await db.$disconnect();
}
