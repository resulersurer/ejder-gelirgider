"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";

const reviewUpdateSchema = z.object({
  id: z.string().cuid(),
  bank: z.string().trim().min(2).max(80),
  amount: z.coerce.number().positive().max(999_999_999),
  direction: z.enum(["IN", "OUT"]),
  categoryId: z.string().cuid().nullable(),
  status: z.enum(["CONFIRMED", "IGNORED"]),
});

export async function updateReviewTransaction(formData: FormData) {
  await requireRole("FINANCE");
  const parsed = reviewUpdateSchema.safeParse({
    id: formData.get("id"), bank: formData.get("bank"), amount: formData.get("amount"),
    direction: formData.get("direction"), categoryId: formData.get("categoryId") || null, status: formData.get("status"),
  });
  if (!parsed.success || !db) return;

  const { id, categoryId, ...data } = parsed.data;
  const categoryExists = !categoryId || await db.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!categoryExists) return;
  await db.bankTransaction.update({ where: { id }, data: { ...data, categoryId } });
  revalidatePath("/review");
  revalidatePath("/");
  revalidatePath("/reports");
}
