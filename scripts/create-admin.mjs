// Run this yourself in your own terminal: node scripts/create-admin.mjs
// The password is never echoed to the terminal and is only sent to your own Neon database.
import readline from "node:readline";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";

const projectRoot = path.resolve(fileURLToPath(import.meta.url), "..", "..");

// Plain `node` does not auto-load .env files the way `next dev`/`next build` do.
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

if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "[SENSITIVE]") {
  console.error("DATABASE_URL bulunamadı. .env.local dosyasında gerçek bir Neon bağlantı adresi olduğundan emin olun.");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("Şifreyi gizli almak için bu script bir terminalde (TTY) çalıştırılmalı."));
      return;
    }
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    let input = "";
    const onData = (char) => {
      if (char === "\n" || char === "\r" || char === "\u0004") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
        return;
      }
      if (char === "\u0003") process.exit(1);
      if (char === "\u007f") {
        input = input.slice(0, -1);
        return;
      }
      input += char;
    };
    process.stdin.on("data", onData);
  });
}

const email = (await ask("Yönetici e-posta adresi: ")).toLowerCase();
const name = await ask("Ad soyad: ");
const password = await askHidden("Şifre (en az 12 karakter, ekranda görünmez): ");

if (!email.includes("@") || password.length < 12) {
  console.error("Geçersiz e-posta veya şifre en az 12 karakter olmalı.");
  process.exit(1);
}

const db = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, name, role: "ADMIN" },
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`Yönetici hesabı hazır: ${user.email} (${user.role})`);
} finally {
  await db.$disconnect();
}
