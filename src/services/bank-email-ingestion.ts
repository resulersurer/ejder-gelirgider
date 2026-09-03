import "server-only";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { db } from "@/lib/db";
import { detectAndParse } from "@/lib/parsers";

type IngestionResult = { processed: number; ignored: number; skipped: number };

/** Confidence eşiğinin üzerindeki işlemler doğrudan CONFIRMED olur, altındakiler NEEDS_REVIEW'e düşer. */
const CONFIDENCE_THRESHOLD = 0.85;

export async function ingestBankEmails(): Promise<IngestionResult> {
  if (!db) throw new Error("DATABASE_URL yapılandırılmadı.");
  const user = process.env.YANDEX_EMAIL; const pass = process.env.YANDEX_APP_PASSWORD;
  if (!user || !pass) throw new Error("Muhasebe IMAP bilgileri yapılandırılmadı.");
  const client = new ImapFlow({ host: "imap.yandex.com", port: 993, secure: true, auth: { user, pass }, logger: false });
  const result = { processed: 0, ignored: 0, skipped: 0 };
  const rules = await db.emailRule.findMany({ where: { active: true }, select: { bank: true, senderEmail: true, subjectPattern: true, contentPattern: true, parserType: true } });
  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    // Sadece okunmamış (UNSEEN) mailler taranır — tüm inbox yerine
    const searchResult = await client.search({ seen: false }, { uid: true });
    const uids = Array.isArray(searchResult) ? searchResult : [];
    if (uids.length === 0) return result;

    for await (const message of client.fetch(uids, { uid: true, envelope: true, source: true }, { uid: true })) {
      if (!message.source || !message.envelope) continue;
      let parsedMail;
      try {
        parsedMail = await simpleParser(message.source);
      } catch (err) {
        console.error("[ingest] Mail ayrıştırma hatası:", err instanceof Error ? err.message : err);
        continue;
      }
      const messageId = parsedMail.messageId ?? `<yandex-${message.uid}@local>`;
      if (await db.bankTransaction.findUnique({ where: { emailMessageId: messageId }, select: { id: true } })) { result.skipped++; continue; }
      if (await db.emailProcessingLog.findUnique({ where: { emailMessageId: messageId }, select: { id: true } })) { result.skipped++; continue; }
      const sender = parsedMail.from?.text ?? "Bilinmeyen gönderici";
      const subject = parsedMail.subject ?? "Konu yok";
      const senderIsAllowed = rules.some((rule) => sender.toLowerCase().includes(rule.senderEmail.toLowerCase()));
      if (!senderIsAllowed) { result.ignored++; continue; }
      const transaction = detectAndParse({ sender, subject, text: parsedMail.text ?? parsedMail.html ? String(parsedMail.text ?? parsedMail.html) : "", date: parsedMail.date ?? new Date() }, rules);
      if (!transaction) {
        console.error("[ingest] Parse başarısız — gönderici:", sender, "| konu:", subject);
        await db.emailProcessingLog.create({ data: { emailMessageId: messageId, sender, subject, status: "PARSE_FAILED", errorMessage: "Banka mailinde tutar veya beklenen konu deseni ayrıştırılamadı." } });
        result.ignored++;
        continue;
      }
      // Düşük güven skoru olan işlemler inceleme kuyruğuna düşer
      const status = transaction.confidenceScore >= CONFIDENCE_THRESHOLD ? "CONFIRMED" : "NEEDS_REVIEW";
      try {
        await db.$transaction([
          db.bankTransaction.create({ data: { ...transaction, emailSubject: subject, emailMessageId: messageId, emailSender: sender, status } }),
          db.emailProcessingLog.create({ data: { emailMessageId: messageId, sender, subject, bankDetected: transaction.bank, status: "PROCESSED" } }),
        ]);
      } catch (err) {
        console.error("[ingest] DB kayıt hatası — messageId:", messageId, err instanceof Error ? err.message : err);
        result.ignored++;
        continue;
      }
      result.processed++;
    }
  } finally { lock.release(); await client.logout(); }
  return result;
}