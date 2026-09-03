"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { ingestBankEmails } from "@/services/bank-email-ingestion";

const createSchema = z.object({
  bank: z.string().trim().min(2).max(80),
  senderEmail: z.string().trim().toLowerCase().min(3).max(150),
  subjectPattern: z.string().trim().max(200).optional(),
  parserType: z.enum(["akbank", "garanti", "isbank", "generic"]),
});

export type EmailRuleFormState = { error?: string } | undefined;
export type ScanState = { error?: string; message?: string } | undefined;

export async function runBankEmailScan(): Promise<ScanState> {
  await requireRole("ADMIN");
  try {
    const result = await ingestBankEmails();
    revalidatePath("/");
    revalidatePath("/review");
    revalidatePath("/logs");
    revalidatePath("/admin/email-rules");
    return { message: `Tarama tamamlandı: ${result.processed} işlendi, ${result.ignored} yok sayıldı, ${result.skipped} tekrar olduğu için atlandı.` };
  } catch {
    return { error: "Posta kutusu taranamadı. IMAP yapılandırmasını ve Vercel loglarını kontrol edin." };
  }
}

export async function createEmailRule(_prevState: EmailRuleFormState, formData: FormData): Promise<EmailRuleFormState> {
  await requireRole("ADMIN");
  const parsed = createSchema.safeParse({
    bank: formData.get("bank"), senderEmail: formData.get("senderEmail"),
    subjectPattern: formData.get("subjectPattern") || undefined, parserType: formData.get("parserType"),
  });
  if (!parsed.success) return { error: "Lütfen tüm alanları geçerli biçimde doldurun." };
  if (!db) return { error: "Veritabanı yapılandırılmadı." };

  await db.emailRule.create({ data: parsed.data });
  revalidatePath("/admin/email-rules");
}

export async function toggleEmailRuleActive(id: string, active: boolean) {
  await requireRole("ADMIN");
  if (!db) return;
  await db.emailRule.update({ where: { id }, data: { active } });
  revalidatePath("/admin/email-rules");
}
