import "server-only";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { db } from "@/lib/db";
import { detectAndParse } from "@/lib/parsers";

type IngestionResult = { processed: number; ignored: number; skipped: number };

export async function ingestBankEmails(): Promise<IngestionResult> {
  if (!db) throw new Error("DATABASE_URL yapılandırılmadı.");
  const user = process.env.YANDEX_EMAIL; const pass = process.env.YANDEX_APP_PASSWORD;
  if (!user || !pass) throw new Error("Yandex IMAP bilgileri yapılandırılmadı.");
  const client = new ImapFlow({ host: "imap.yandex.com", port: 993, secure: true, auth: { user, pass }, logger: false });
  const result = { processed: 0, ignored: 0, skipped: 0 };
  const rules = await db.emailRule.findMany({ where: { active: true }, select: { bank: true, senderEmail: true, subjectPattern: true, parserType: true } });
  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    for await (const message of client.fetch("1:*", { uid: true, envelope: true, source: true })) {
      if (!message.source || !message.envelope) continue;
      const parsedMail = await simpleParser(message.source);
      const messageId = parsedMail.messageId ?? `<yandex-${message.uid}@local>`;
      if (await db.bankTransaction.findUnique({ where: { emailMessageId: messageId }, select: { id: true } })) { result.skipped++; continue; }
      if (await db.emailProcessingLog.findUnique({ where: { emailMessageId: messageId }, select: { id: true } })) { result.skipped++; continue; }
      const sender = parsedMail.from?.text ?? "Bilinmeyen gönderici";
      const subject = parsedMail.subject ?? "Konu yok";
      const transaction = detectAndParse({ sender, subject, text: parsedMail.text ?? parsedMail.html ? String(parsedMail.text ?? parsedMail.html) : "", date: parsedMail.date ?? new Date() }, rules);
      if (!transaction) { await db.emailProcessingLog.create({ data: { emailMessageId: messageId, sender, subject, status: "IGNORED" } }); result.ignored++; continue; }
      await db.$transaction([
        db.bankTransaction.create({ data: { ...transaction, emailSubject: subject, emailMessageId: messageId, emailSender: sender, status: transaction.confidenceScore >= 0.9 ? "CONFIRMED" : "NEEDS_REVIEW" } }),
        db.emailProcessingLog.create({ data: { emailMessageId: messageId, sender, subject, bankDetected: transaction.bank, status: "PROCESSED" } }),
      ]);
      result.processed++;
    }
  } finally { lock.release(); await client.logout(); }
  return result;
}