"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";

export async function decideTransaction(id: string, status: "CONFIRMED" | "IGNORED") {
  await requireRole("FINANCE");
  if (!db) return;
  await db.bankTransaction.update({ where: { id }, data: { status } });
  revalidatePath("/review");
  revalidatePath("/");
}
