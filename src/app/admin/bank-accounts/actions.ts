"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { maskIban } from "@/lib/security/iban";

const createSchema = z.object({
  bankName: z.string().trim().min(2).max(80),
  accountName: z.string().trim().min(2).max(80),
  iban: z.string().trim().min(6).max(40),
  currency: z.string().trim().toUpperCase().length(3).default("TRY"),
});

export type BankAccountFormState = { error?: string } | undefined;

export async function createBankAccount(_prevState: BankAccountFormState, formData: FormData): Promise<BankAccountFormState> {
  await requireRole("ADMIN");
  const parsed = createSchema.safeParse({
    bankName: formData.get("bankName"), accountName: formData.get("accountName"),
    iban: formData.get("iban"), currency: formData.get("currency") || "TRY",
  });
  if (!parsed.success) return { error: "Lütfen tüm alanları geçerli biçimde doldurun." };
  if (!db) return { error: "Veritabanı yapılandırılmadı." };

  await db.bankAccount.create({ data: { bankName: parsed.data.bankName, accountName: parsed.data.accountName, ibanMasked: maskIban(parsed.data.iban), currency: parsed.data.currency } });
  revalidatePath("/admin/bank-accounts");
}

export async function toggleBankAccountActive(id: string, active: boolean) {
  await requireRole("ADMIN");
  if (!db) return;
  await db.bankAccount.update({ where: { id }, data: { active } });
  revalidatePath("/admin/bank-accounts");
}
