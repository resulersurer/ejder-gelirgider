import "server-only";
import { db } from "@/lib/db";

export type ReportFilters = { from?: Date; to?: Date; bank?: string; category?: string };
export type ReportTransaction = {
  id: string; transactionDate: Date; bank: string; transactionType: string; direction: "IN" | "OUT";
  amount: number; sender: string | null; receiver: string | null; description: string | null; category: string | null; status: string;
};
export type ReportSummary = { income: number; expense: number; net: number; count: number };

function buildWhere(filters: ReportFilters) {
  return {
    ...(filters.from || filters.to ? { transactionDate: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {}),
    ...(filters.bank ? { bank: filters.bank } : {}),
    ...(filters.category ? { category: { name: filters.category } } : {}),
  };
}

export async function getReportTransactions(filters: ReportFilters): Promise<ReportTransaction[]> {
  if (!db) return [];
  const rows = await db.bankTransaction.findMany({ where: buildWhere(filters), include: { category: { select: { name: true } } }, orderBy: { transactionDate: "desc" }, take: 1000 });
  return rows.map((row) => ({ id: row.id, transactionDate: row.transactionDate, bank: row.bank, transactionType: row.transactionType, direction: row.direction, amount: row.amount.toNumber(), sender: row.sender, receiver: row.receiver, description: row.description, category: row.category?.name ?? null, status: row.status }));
}

export async function getReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  if (!db) return { income: 0, expense: 0, net: 0, count: 0 };
  const rows = await db.bankTransaction.findMany({ where: buildWhere(filters), select: { amount: true, direction: true } });
  const income = rows.filter((row) => row.direction === "IN").reduce((sum, row) => sum + row.amount.toNumber(), 0);
  const expense = rows.filter((row) => row.direction === "OUT").reduce((sum, row) => sum + row.amount.toNumber(), 0);
  return { income, expense, net: income - expense, count: rows.length };
}

export async function getDistinctBanks(): Promise<string[]> {
  if (!db) return [];
  const rows = await db.bankTransaction.findMany({ distinct: ["bank"], select: { bank: true }, orderBy: { bank: "asc" } });
  return rows.map((row) => row.bank);
}

export async function getCategoryNames(): Promise<string[]> {
  if (!db) return [];
  const rows = await db.category.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  return rows.map((row) => row.name);
}
