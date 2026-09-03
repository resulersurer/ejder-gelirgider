import { parseAkbank } from "./akbank";
import { parseGaranti } from "./garanti";
import { parseIsbank } from "./isbank";
import { parseGeneric } from "./generic";
import type { BankParser, MailForParsing, ParsedTransaction } from "./types";

const parsersByType: Record<string, BankParser> = { akbank: parseAkbank, garanti: parseGaranti, isbank: parseIsbank };
const fallbackSignatures = [
  { bank: "Akbank", parserType: "akbank", pattern: /akbank/i },
  { bank: "Garanti BBVA", parserType: "garanti", pattern: /garanti|bbva/i },
  { bank: "İş Bankası", parserType: "isbank", pattern: /iş bankası|isbank/i },
];

// Rules loaded from the EmailRule table; new banks can be added here without touching parser code.
export type EmailRuleConfig = { bank: string; senderEmail: string; subjectPattern: string | null; parserType: string };

export function detectAndParse(mail: MailForParsing, rules: EmailRuleConfig[] = []): ParsedTransaction | null {
  const matchedRule = rules.find((rule) => {
    const senderMatches = mail.sender.toLowerCase().includes(rule.senderEmail.toLowerCase());
    const subjectMatches = !rule.subjectPattern || safeRegExp(rule.subjectPattern)?.test(mail.subject) !== false;
    return senderMatches && subjectMatches;
  });
  if (matchedRule) {
    const transaction = (parsersByType[matchedRule.parserType] ?? ((m: MailForParsing) => parseGeneric(matchedRule.bank, m)))(mail);
    return transaction ? { ...transaction, bank: matchedRule.bank, confidenceScore: 0.95 } : null;
  }

  const signature = fallbackSignatures.find(({ pattern }) => pattern.test(`${mail.sender} ${mail.subject} ${mail.text}`));
  return signature ? parsersByType[signature.parserType](mail) : null;
}

function safeRegExp(pattern: string) {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}
