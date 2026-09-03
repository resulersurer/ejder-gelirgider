import "server-only";
import { db } from "@/lib/db";

export type TransactionRow = {
  id: string; date: string; time: string; bank: string; type: string;
  direction: "IN" | "OUT"; amount: number; counterparty: string;
  description: string; category: string; status: string;
};

export type DashboardData = {
  connected: boolean; todayIncome: number; todayExpense: number;
  monthIncome: number; monthExpense: number; transactions: TransactionRow[];
  lastCheckedAt: Date | null;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const formatDate = (date: Date) => new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
const formatTime = (date: Date) => new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);

export async function getDashboardData(): Promise<DashboardData> {
  if (!db) return emptyDashboard(false);
  try {
    const now = new Date();
    const today = startOfDay(now);
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const [todayTransactions, monthTransactions, recent, lastLog] = await Promise.all([
      db.bankTransaction.findMany({ where: { transactionDate: { gte: today }, status: "CONFIRMED" }, select: { amount: true, direction: true } }),
      db.bankTransaction.findMany({ where: { transactionDate: { gte: month }, status: "CONFIRMED" }, select: { amount: true, direction: true } }),
      db.bankTransaction.findMany({ orderBy: { transactionDate: "desc" }, take: 15, include: { category: { select: { name: true } } } }),
      db.emailProcessingLog.findFirst({ where: { status: "PROCESSED" }, orderBy: { processedAt: "desc" }, select: { processedAt: true } }),
    ]);
    const totals = (items: { amount: { toNumber(): number }; direction: "IN" | "OUT" }[]) => items.reduce((result, item) => {
      result[item.direction === "IN" ? "income" : "expense"] += item.amount.toNumber(); return result;
    }, { income: 0, expense: 0 });
    const daily = totals(todayTransactions); const monthly = totals(monthTransactions);
    return { connected: true, todayIncome: daily.income, todayExpense: daily.expense, monthIncome: monthly.income, monthExpense: monthly.expense, lastCheckedAt: lastLog?.processedAt ?? null, transactions: recent.map((item) => ({ id: item.id, date: formatDate(item.transactionDate), time: formatTime(item.transactionDate), bank: item.bank, type: item.transactionType, direction: item.direction, amount: item.amount.toNumber(), counterparty: item.direction === "IN" ? item.sender ?? "-" : item.receiver ?? "-", description: item.description ?? "-", category: item.category?.name ?? "Kategorisiz", status: item.status })) };
  } catch {
    return emptyDashboard(false);
  }
}

function emptyDashboard(connected: boolean): DashboardData {
  return { connected, todayIncome: 0, todayExpense: 0, monthIncome: 0, monthExpense: 0, transactions: [], lastCheckedAt: null };
}