import { parseAkbank } from "./akbank";
import { parseGaranti } from "./garanti";
import { parseGeneric } from "./generic";
import type { BankParser, MailForParsing, ParsedTransaction } from "./types";

import { parseIsbank } from "./isbank";

const parsersByType: Record<string, BankParser> = { akbank: parseAkbank, garanti: parseGaranti, isbank: parseIsbank };

// Only rules loaded from the EmailRule table are accepted for financial processing.
export type EmailRuleConfig = { bank: string; senderEmail: string; subjectPattern: string | null; contentPattern: string | null; parserType: string };

export function detectAndParse(mail: MailForParsing, rules: EmailRuleConfig[] = []): ParsedTransaction | null {
  const matchedRule = rules.find((rule) => {
    const senderMatches = mail.sender.toLowerCase().includes(rule.senderEmail.toLowerCase());
    const subjectMatches = !rule.subjectPattern || safeRegExp(rule.subjectPattern).test(mail.subject);
    const contentMatches = !rule.contentPattern || safeRegExp(rule.contentPattern).test(mail.text);
    return senderMatches && subjectMatches && contentMatches;
  });
  if (matchedRule) {
    const transaction = (parsersByType[matchedRule.parserType] ?? ((m: MailForParsing) => parseGeneric(matchedRule.bank, m)))(mail);
    return transaction ? { ...transaction, bank: matchedRule.bank, confidenceScore: 0.95 } : null;
  }

  return null;
}

function safeRegExp(pattern: string) {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return /a^/;
  }
}
