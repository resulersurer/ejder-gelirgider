import "server-only";
import { db } from "@/lib/db";

export type TransactionRow = {
  id: string; date: string; time: string; bank: string; type: string;
  direction: "IN" | "OUT"; amount: number; counterparty: string;
  description: string; category: string; status: string;
};

export type DailyFlowPoint = { date: string; income: number; expense: number };
export type BankShare = { bank: string; total: number; percentage: number };

export type DashboardData = {
  connected: boolean; todayIncome: number; todayExpense: number;
  monthIncome: number; monthExpense: number; transactions: TransactionRow[];
  lastCheckedAt: Date | null; dailyFlow: DailyFlowPoint[]; bankDistribution: BankShare[]; reviewCount: number;
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
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - 6);
    const [todayTransactions, monthTransactions, weekTransactions, recent, lastLog, reviewCount] = await Promise.all([
      db.bankTransaction.findMany({ where: { transactionDate: { gte: today }, status: "CONFIRMED" }, select: { amount: true, direction: true } }),
      db.bankTransaction.findMany({ where: { transactionDate: { gte: month }, status: "CONFIRMED" }, select: { amount: true, direction: true, bank: true } }),
      db.bankTransaction.findMany({ where: { transactionDate: { gte: weekStart }, status: "CONFIRMED" }, select: { amount: true, direction: true, transactionDate: true } }),
      db.bankTransaction.findMany({ orderBy: { transactionDate: "desc" }, take: 15, include: { category: { select: { name: true } } } }),
      db.emailProcessingLog.findFirst({ where: { status: "PROCESSED" }, orderBy: { processedAt: "desc" }, select: { processedAt: true } }),
      db.bankTransaction.count({ where: { status: "NEEDS_REVIEW" } }),
    ]);
    const totals = (items: { amount: { toNumber(): number }; direction: "IN" | "OUT" }[]) => items.reduce((result, item) => {
      result[item.direction === "IN" ? "income" : "expense"] += item.amount.toNumber(); return result;
    }, { income: 0, expense: 0 });
    const daily = totals(todayTransactions); const monthly = totals(monthTransactions);

    const dailyFlow: DailyFlowPoint[] = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart); day.setDate(day.getDate() + index);
      const dayTime = startOfDay(day).getTime();
      const dayTotals = totals(weekTransactions.filter((item) => startOfDay(item.transactionDate).getTime() === dayTime));
      return { date: new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(day), income: dayTotals.income, expense: dayTotals.expense };
    });

    const bankTotals = new Map<string, number>();
    for (const item of monthTransactions) bankTotals.set(item.bank, (bankTotals.get(item.bank) ?? 0) + item.amount.toNumber());
    const totalVolume = [...bankTotals.values()].reduce((sum, value) => sum + value, 0);
    const bankDistribution: BankShare[] = [...bankTotals.entries()].sort((a, b) => b[1] - a[1]).map(([bank, total]) => ({ bank, total, percentage: totalVolume ? Math.round((total / totalVolume) * 1000) / 10 : 0 }));

    return { connected: true, todayIncome: daily.income, todayExpense: daily.expense, monthIncome: monthly.income, monthExpense: monthly.expense, lastCheckedAt: lastLog?.processedAt ?? null, dailyFlow, bankDistribution, reviewCount, transactions: recent.map((item) => ({ id: item.id, date: formatDate(item.transactionDate), time: formatTime(item.transactionDate), bank: item.bank, type: item.transactionType, direction: item.direction, amount: item.amount.toNumber(), counterparty: item.direction === "IN" ? item.sender ?? "-" : item.receiver ?? "-", description: item.description ?? "-", category: item.category?.name ?? "Kategorisiz", status: item.status })) };
  } catch {
    return emptyDashboard(false);
  }
}

function emptyDashboard(connected: boolean): DashboardData {
  return { connected, todayIncome: 0, todayExpense: 0, monthIncome: 0, monthExpense: 0, transactions: [], lastCheckedAt: null, dailyFlow: [], bankDistribution: [], reviewCount: 0 };
}