import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
const updateSchema = z.object({ status: z.enum(["CONFIRMED", "IGNORED"]), categoryId: z.string().cuid().optional() });

export async function PATCH(request: NextRequest, context: RouteContext<"/api/transactions/[id]">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Giriş gerekli" }, { status: 401 });
  if (session.role === "VIEWER") return Response.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  if (!db) return Response.json({ error: "DATABASE_URL yapılandırılmadı." }, { status: 503 });
  const payload = updateSchema.safeParse(await request.json());
  if (!payload.success) return Response.json({ error: "Geçersiz güncelleme" }, { status: 400 });
  const { id } = await context.params;
  const transaction = await db.bankTransaction.update({ where: { id }, data: payload.data, select: { id: true, status: true } }).catch(() => null);
  return transaction ? Response.json({ transaction }) : Response.json({ error: "İşlem bulunamadı" }, { status: 404 });
}