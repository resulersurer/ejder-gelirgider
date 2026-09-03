import type { MailForParsing, ParsedTransaction } from "./types";
import { normalizeCurrency } from "@/lib/currency";

const amountPattern = /(?:tutar|işlem tutarı|amount)[^\d]*([\d.]+(?:,\d{2})?)\s*(TL|TRY|USD|EUR|€|\$)?/i;
const referencePattern = /(?:referans|işlem no|işlem numarası|referans no)[:\s#-]*([A-Z0-9-]{5,})/i;
const outgoingPattern = /(?:borç|çıkış|ödeme|harcama|gönderildi|çekildi|debit)/i;
const fastPattern = /\bFAST\b/i;
const eftPattern = /\bEFT\b/i;

export function parseBankNotification(bank: string, mail: MailForParsing): ParsedTransaction | null {
  const match = mail.text.match(amountPattern) ?? mail.subject.match(amountPattern);
  if (!match) return null;
  const amount = Number(match[1].replaceAll(".", "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const direction = outgoingPattern.test(`${mail.subject} ${mail.text}`) ? "OUT" : "IN";
  const transactionType = fastPattern.test(mail.text) ? direction === "IN" ? "FAST_IN" : "FAST_OUT" : eftPattern.test(mail.text) ? direction === "IN" ? "EFT_IN" : "EFT_OUT" : direction === "IN" ? "INCOME" : "EXPENSE";
  return { bank, transactionType, direction, amount, currency: normalizeCurrency(match[2]), transactionDate: mail.date, description: cleanDescription(mail.text), referenceNumber: mail.text.match(referencePattern)?.[1], confidenceScore: 0.87 };
}

function cleanDescription(text: string) { return text.replace(/\s+/g, " ").trim().slice(0, 500); }