import "server-only";
import { db } from "@/lib/db";

export type ReviewItem = { id: string; bank: string; amount: number; currency: string; direction: "IN" | "OUT"; transactionDate: Date; sender: string | null; receiver: string | null; description: string | null; emailSubject: string; emailSender: string; confidenceScore: number; category: string | null; categoryId: string | null };

export async function getReviewItems(): Promise<ReviewItem[]> {
  if (!db) return [];
  try {
    const items = await db.bankTransaction.findMany({ where: { status: "NEEDS_REVIEW" }, include: { category: { select: { name: true } } }, orderBy: { transactionDate: "desc" } });
    return items.map((item) => ({ id: item.id, bank: item.bank, amount: item.amount.toNumber(), currency: item.currency, direction: item.direction, transactionDate: item.transactionDate, sender: item.sender, receiver: item.receiver, description: item.description, emailSubject: item.emailSubject, emailSender: item.emailSender, confidenceScore: item.confidenceScore, category: item.category?.name ?? null, categoryId: item.categoryId }));
  } catch { return []; }
}

export async function getReviewCategories() {
  if (!db) return [];
  try {
    return await db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  } catch {
    return [];
  }
}