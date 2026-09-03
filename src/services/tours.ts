import "server-only";
import { db } from "@/lib/db";

export type TourRow = { id: string; name: string; code: string; startDate: Date; endDate: Date; status: string; income: number; expense: number };

export async function getTours(): Promise<TourRow[]> {
  if (!db) return [];
  const tours = await db.tour.findMany({ orderBy: { startDate: "desc" }, include: { transactions: { select: { amount: true, direction: true } } } });
  return tours.map((tour) => {
    const income = tour.transactions.filter((item) => item.direction === "IN").reduce((sum, item) => sum + item.amount.toNumber(), 0);
    const expense = tour.transactions.filter((item) => item.direction === "OUT").reduce((sum, item) => sum + item.amount.toNumber(), 0);
    return { id: tour.id, name: tour.name, code: tour.code, startDate: tour.startDate, endDate: tour.endDate, status: tour.status, income, expense };
  });
}
