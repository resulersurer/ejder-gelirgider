import { parseBankNotification } from "./shared";
import type { BankParser } from "./types";
export const parseAkbank: BankParser = (mail) => parseBankNotification("Akbank", mail);