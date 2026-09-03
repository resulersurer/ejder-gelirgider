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

const { PrismaClient } = await import("@prisma/client");

const CATEGORY_NAMES = [
  "Tur Tahsilatı", "Acenta Tahsilatı", "Otel Ödemesi", "Uçak Ödemesi", "Rehber Ödemesi",
  "Transfer", "Personel", "Vergi", "Komisyon", "Banka Masrafı", "Diğer",
];

const EMAIL_RULES = [
  { bank: "Akbank", senderEmail: "hizmet@bilgi.akbank.com", subjectPattern: "Hesabınıza nakit girişi olmuştur", parserType: "akbank" },
  { bank: "Akbank", senderEmail: "hizmet@bilgi.akbank.com", subjectPattern: "Hesabınızdan nakit çıkışı olmuştur", parserType: "akbank" },
  { bank: "Garanti BBVA", senderEmail: "garantibbva@garantibbva.com.tr", subjectPattern: "Gelen Para Transferi", parserType: "garanti" },
  { bank: "Garanti BBVA", senderEmail: "garantibbva@garantibbva.com.tr", subjectPattern: "Yurtdışından Gelen Para Transferi", parserType: "garanti" },
  { bank: "Halkbank", senderEmail: "internet.subesi@bilgi.halkbank.com.tr", subjectPattern: "HESABA GELEN HAVALE BİLGİLENDİRME FORMU", parserType: "generic" },
  { bank: "Halkbank", senderEmail: "internet.subesi@bilgi.halkbank.com.tr", subjectPattern: "HESAPTAN|HESABINIZDAN|PARA ÇIKIŞ", parserType: "generic" },
  { bank: "İş Bankası", senderEmail: "bilgilendirme@ileti.isbank.com.tr", subjectPattern: "hesabınıza para geldi\\.", parserType: "isbank" },
  { bank: "İş Bankası", senderEmail: "bilgilendirme@ileti.isbank.com.tr", subjectPattern: "hesabınızdan", parserType: "isbank" },
  { bank: "QNB", senderEmail: "email@email.qnb.com.tr", subjectPattern: "QNB hesabınıza tarafından gönderilmiştir\\.", parserType: "generic" },
  { bank: "QNB", senderEmail: "email@email.qnb.com.tr", subjectPattern: "işlem dekontunuz", parserType: "generic" },
  { bank: "VakıfBank", senderEmail: "bildirim@vakifbank.com.tr", subjectPattern: "Mevduat Hesabınıza Para Girişleri", parserType: "generic" },
  { bank: "VakıfBank", senderEmail: "bildirim@vakifbank.com.tr", subjectPattern: "Mevduat Hesabı Para Çıkışları", parserType: "generic" },
  { bank: "Yapı Kredi", senderEmail: "yapikredi@iletisim.yapikredi.com.tr", subjectPattern: "Akıllı Asistan-Gelen HAVALE", parserType: "generic" },
  { bank: "Yapı Kredi", senderEmail: "yapikredi@iletisim.yapikredi.com.tr", subjectPattern: "GİDEN HAVALE|HESABINIZDAN|PARA ÇIKIŞ", parserType: "generic" },
  { bank: "Ziraat Bankası", senderEmail: "ziraatbankasi@ileti.ziraatbank.com.tr", subjectPattern: "hesabınıza gönderilmiştir", parserType: "generic" },
  { bank: "Ziraat Bankası", senderEmail: "ziraatbankasi@ileti.ziraatbank.com.tr", subjectPattern: "hesabınızdan", parserType: "generic" },
  { bank: "Ziraat Bankası", senderEmail: "ziraatbankasi@ileti.ziraatbank.com.tr", subjectPattern: "hesabınıza", parserType: "generic" },
  { bank: "DenizBank", senderEmail: "info@e-posta.denizbank.com", subjectPattern: "hesabınıza", parserType: "generic" },
  { bank: "DenizBank", senderEmail: "info@e-posta.denizbank.com", subjectPattern: "hesabınızdan|çıkış|ödeme", parserType: "generic" },
];

const db = new PrismaClient();
try {
  for (const name of CATEGORY_NAMES) {
    await db.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const rule of EMAIL_RULES) {
    const existing = await db.emailRule.findFirst({ where: rule, select: { id: true } });
    if (!existing) await db.emailRule.create({ data: rule });
  }
  console.log(`${CATEGORY_NAMES.length} kategori ve ${EMAIL_RULES.length} banka mail kuralı hazır.`);
} finally {
  await db.$disconnect();
}
