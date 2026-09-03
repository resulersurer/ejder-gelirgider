import "server-only";
import { db } from "@/lib/db";

export type EmailRuleRow = { id: string; bank: string; senderEmail: string; subjectPattern: string | null; parserType: string; active: boolean };

export async function getEmailRules(): Promise<EmailRuleRow[]> {
  if (!db) return [];
  return db.emailRule.findMany({ orderBy: { bank: "asc" }, select: { id: true, bank: true, senderEmail: true, subjectPattern: true, parserType: true, active: true } });
}
