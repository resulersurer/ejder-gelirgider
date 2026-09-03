import "server-only";
import { db } from "@/lib/db";

export type EmailLogRow = { id: string; sender: string; subject: string; bankDetected: string | null; status: string; errorMessage: string | null; processedAt: Date };

export async function getEmailLogs(): Promise<EmailLogRow[]> {
  if (!db) return [];
  return db.emailProcessingLog.findMany({ orderBy: { processedAt: "desc" }, take: 100 });
}
