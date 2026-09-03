import { parseBankNotification } from "./shared";
import type { BankParser } from "./types";
export const parseIsbank: BankParser = (mail) => parseBankNotification("İş Bankası", mail);