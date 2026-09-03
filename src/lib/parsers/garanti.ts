import { parseBankNotification } from "./shared";
import type { BankParser } from "./types";
export const parseGaranti: BankParser = (mail) => parseBankNotification("Garanti BBVA", mail);