import type { MailForParsing, ParsedTransaction } from "./types";
import { normalizeCurrency } from "@/lib/currency";

const currencyToken = [
  "TRY",
  "TL",
  "TÜRK\\s+L[İI]RASI",
  "USD",
  "DOLAR",
  "AMER[İI]KAN\\s+DOLARI",
  "EUR",
  "EURO",
  "GBP",
  "STERL[İI]N",
  "CHF",
  "[İI]SV[İI]ÇRE\\s+FRANGI",
  "JPY",
  "JAPON\\s+YEN[İI]",
  "AED",
  "BAE\\s+D[İI]RHEM[İI]",
  "SAR",
  "SUUD[İI]\\s+R[İI]YAL[İI]",
  "KWD",
  "QAR",
  "CAD",
  "AUD",
  "SEK",
  "NOK",
  "DKK",
  "RUB",
  "CNY",
  "PLN",
  "₺",
  "€",
  "\\$",
  "£",
  "¥",
  "[A-Z]{3}",
].join("|");

const amountPattern = new RegExp(`(?:tutar|işlem tutarı|amount|tutarlı)[^\\d]*([\\d.]+(?:,\\d{2})?)\\s*(${currencyToken})?`, "i");
const referencePattern = /(?:referans|işlem no|işlem numarası|referans no)[:\s#-]*([A-Z0-9-]{5,})/i;
const incomingPattern = /(?:alacak|giriş|geldi|yat[ıi]r[ıi]ld[ıi]|hesab[ıi]n[ıi]za|hesab[ıi]ma|tahsilat|credit)/i;
const outgoingPattern = /(?:borç|çıkış|ödeme|harcama|gönderildi|çekildi|debit)/i;
const fastPattern = /\bFAST\b/i;
const eftPattern = /\bEFT\b/i;

export function parseBankNotification(bank: string, mail: MailForParsing): ParsedTransaction | null {
  const content = `${mail.subject}\n${mail.text}`;
  const match = content.match(amountPattern);
  if (!match) return null;

  const amount = Number(match[1].replaceAll(".", "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const isOutgoing = outgoingPattern.test(content);
  const isIncoming = incomingPattern.test(content);
  if (!isIncoming && !isOutgoing) return null;

  const direction = isOutgoing ? "OUT" : "IN";
  const transactionType = fastPattern.test(content)
    ? direction === "IN" ? "FAST_IN" : "FAST_OUT"
    : eftPattern.test(content) ? direction === "IN" ? "EFT_IN" : "EFT_OUT"
      : direction === "IN" ? "INCOME" : "EXPENSE";

  return {
    bank,
    transactionType,
    direction,
    amount,
    currency: normalizeCurrency(match[2]),
    transactionDate: mail.date,
    description: cleanDescription(mail.text),
    referenceNumber: content.match(referencePattern)?.[1],
    confidenceScore: 0.87,
  };
}

function cleanDescription(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}
