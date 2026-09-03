import "server-only";
import { db } from "@/lib/db";

export type TransactionRow = {
  id: string; date: string; time: string; bank: string; type: string;
  direction: "IN" | "OUT"; amount: number; currency: string; counterparty: string;
  description: string; category: string; status: string;
};

export type DailyFlowPoint = { date: string; income: number; expense: number };
export type BankShare = { bank: string; total: number; percentage: number };
export type BankSummary = { bank: string; income: number; expense: number; net: number };
export type CurrencySummary = { currency: string; income: number; expense: number; net: number };

export type DashboardData = {
  connected: boolean; todayIncome: number; todayExpense: number;
  monthIncome: number; monthExpense: number; transactions: TransactionRow[];
  lastCheckedAt: Date | null; dailyFlow: DailyFlowPoint[]; bankDistribution: BankShare[]; bankSummaries: BankSummary[]; currencySummaries: CurrencySummary[]; reviewCount: number;
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
      db.bankTransaction.findMany({ where: { transactionDate: { gte: today }, status: "CONFIRMED", currency: "TRY" }, select: { amount: true, direction: true } }),
      db.bankTransaction.findMany({ where: { transactionDate: { gte: month }, status: "CONFIRMED" }, select: { amount: true, direction: true, bank: true, currency: true } }),
      db.bankTransaction.findMany({ where: { transactionDate: { gte: weekStart }, status: "CONFIRMED", currency: "TRY" }, select: { amount: true, direction: true, transactionDate: true } }),
      db.bankTransaction.findMany({ orderBy: { transactionDate: "desc" }, take: 15, include: { category: { select: { name: true } } } }),
      db.emailProcessingLog.findFirst({ where: { status: "PROCESSED" }, orderBy: { processedAt: "desc" }, select: { processedAt: true } }),
      db.bankTransaction.count({ where: { status: "NEEDS_REVIEW" } }),
    ]);
    const totals = (items: { amount: { toNumber(): number }; direction: "IN" | "OUT" }[]) => items.reduce((result, item) => {
      result[item.direction === "IN" ? "income" : "expense"] += item.amount.toNumber(); return result;
    }, { income: 0, expense: 0 });
    const daily = totals(todayTransactions); const monthly = totals(monthTransactions.filter((item) => item.currency === "TRY"));

    const dailyFlow: DailyFlowPoint[] = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart); day.setDate(day.getDate() + index);
      const dayTime = startOfDay(day).getTime();
      const dayTotals = totals(weekTransactions.filter((item) => startOfDay(item.transactionDate).getTime() === dayTime));
      return { date: new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(day), income: dayTotals.income, expense: dayTotals.expense };
    });

    const bankTotals = new Map<string, number>();
    const bankSummaryTotals = new Map<string, { income: number; expense: number }>();
    const currencyTotals = new Map<string, { income: number; expense: number }>();
    for (const item of monthTransactions.filter((entry) => entry.currency === "TRY")) {
      const amount = item.amount.toNumber();
      bankTotals.set(item.bank, (bankTotals.get(item.bank) ?? 0) + amount);
      const summary = bankSummaryTotals.get(item.bank) ?? { income: 0, expense: 0 };
      summary[item.direction === "IN" ? "income" : "expense"] += amount;
      bankSummaryTotals.set(item.bank, summary);
    }
    for (const item of monthTransactions) {
      const summary = currencyTotals.get(item.currency) ?? { income: 0, expense: 0 };
      summary[item.direction === "IN" ? "income" : "expense"] += item.amount.toNumber();
      currencyTotals.set(item.currency, summary);
    }
    const totalVolume = [...bankTotals.values()].reduce((sum, value) => sum + value, 0);
    const bankDistribution: BankShare[] = [...bankTotals.entries()].sort((a, b) => b[1] - a[1]).map(([bank, total]) => ({ bank, total, percentage: totalVolume ? Math.round((total / totalVolume) * 1000) / 10 : 0 }));
    const bankSummaries: BankSummary[] = [...bankSummaryTotals.entries()].sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense)).map(([bank, summary]) => ({ bank, ...summary, net: summary.income - summary.expense }));
    const currencySummaries: CurrencySummary[] = [...currencyTotals.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([currency, summary]) => ({ currency, ...summary, net: summary.income - summary.expense }));

    return { connected: true, todayIncome: daily.income, todayExpense: daily.expense, monthIncome: monthly.income, monthExpense: monthly.expense, lastCheckedAt: lastLog?.processedAt ?? null, dailyFlow, bankDistribution, bankSummaries, currencySummaries, reviewCount, transactions: recent.map((item) => ({ id: item.id, date: formatDate(item.transactionDate), time: formatTime(item.transactionDate), bank: item.bank, type: item.transactionType, direction: item.direction, amount: item.amount.toNumber(), currency: item.currency, counterparty: item.direction === "IN" ? item.sender ?? "-" : item.receiver ?? "-", description: item.description ?? "-", category: item.category?.name ?? "Kategorisiz", status: item.status })) };
  } catch {
    return emptyDashboard(false);
  }
}

function emptyDashboard(connected: boolean): DashboardData {
  return { connected, todayIncome: 0, todayExpense: 0, monthIncome: 0, monthExpense: 0, transactions: [], lastCheckedAt: null, dailyFlow: [], bankDistribution: [], bankSummaries: [], currencySummaries: [], reviewCount: 0 };
}