import "server-only";
import { db } from "@/lib/db";

export type BankAccountRow = { id: string; bankName: string; accountName: string; ibanMasked: string; currency: string; active: boolean };

export async function getBankAccounts(): Promise<BankAccountRow[]> {
  if (!db) return [];
  return db.bankAccount.findMany({ orderBy: { bankName: "asc" }, select: { id: true, bankName: true, accountName: true, ibanMasked: true, currency: true, active: true } });
}
