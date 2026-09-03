import { parseAkbank } from "./akbank";
import { parseGaranti } from "./garanti";
import { parseIsbank } from "./isbank";
import type { BankParser, MailForParsing, ParsedTransaction } from "./types";

const parsers: Record<string, BankParser> = { Akbank: parseAkbank, "Garanti BBVA": parseGaranti, "İş Bankası": parseIsbank };
const signatures = [{ bank: "Akbank", pattern: /akbank/i }, { bank: "Garanti BBVA", pattern: /garanti|bbva/i }, { bank: "İş Bankası", pattern: /iş bankası|isbank/i }];

export function detectAndParse(mail: MailForParsing): ParsedTransaction | null {
  const signature = signatures.find(({ pattern }) => pattern.test(`${mail.sender} ${mail.subject} ${mail.text}`));
  return signature ? parsers[signature.bank](mail) : null;
}