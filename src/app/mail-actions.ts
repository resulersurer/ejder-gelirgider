"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { ingestBankEmails } from "@/services/bank-email-ingestion";

export type MailScanState = { error?: string; message?: string } | undefined;

export async function runDashboardMailScan(): Promise<MailScanState> {
  await requireRole("FINANCE");
  try {
    const result = await ingestBankEmails();
    revalidatePath("/");
    revalidatePath("/review");
    revalidatePath("/reports");
    revalidatePath("/logs");
    return {
      message: `Tarama tamamlandı: ${result.processed} işlem dashboard'a işlendi, ${result.ignored} mail banka giriş/çıkışı olmadığı için atlandı, ${result.skipped} tekrarlandı.`,
    };
  } catch (err) {
    console.error("[mail-scan] Posta taraması başarısız:", err instanceof Error ? err.message : err);
    return { error: "Posta kutusu taranamadı. IMAP ayarlarını ve sunucu loglarını kontrol edin." };
  }
}
