import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const querySchema = z.object({
  bank: z.string().trim().max(100).optional(), direction: z.enum(["IN", "OUT"]).optional(),
  status: z.enum(["CONFIRMED", "NEEDS_REVIEW", "IGNORED"]).optional(),
  search: z.string().trim().max(120).optional(), take: z.coerce.number().int().min(1).max(100).default(30),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Giriş gerekli" }, { status: 401 });
  if (!db) return Response.json({ transactions: [], message: "DATABASE_URL yapılandırılmadı." });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return Response.json({ error: "Geçersiz filtreler" }, { status: 400 });
  const { bank, direction, status, search, take } = parsed.data;
  const transactions = await db.bankTransaction.findMany({
    where: { ...(bank ? { bank } : {}), ...(direction ? { direction } : {}), ...(status ? { status } : {}), ...(search ? { OR: [{ sender: { contains: search, mode: "insensitive" } }, { receiver: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}) },
    include: { category: { select: { name: true } } }, orderBy: { transactionDate: "desc" }, take,
  });
  return Response.json({ transactions: transactions.map((item) => ({ ...item, amount: item.amount.toNumber(), category: item.category?.name ?? null })) });
}