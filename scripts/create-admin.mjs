// Run this yourself in your own terminal: node scripts/create-admin.mjs
// The password is never echoed to the terminal and is only sent to your own Neon database.
import readline from "node:readline";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/index.js";

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
