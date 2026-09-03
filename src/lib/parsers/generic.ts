import { parseBankNotification } from "./shared";
import type { MailForParsing, ParsedTransaction } from "./types";

export function parseGeneric(bank: string, mail: MailForParsing): ParsedTransaction | null {
  return parseBankNotification(bank, mail);
}
