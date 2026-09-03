"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(30),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(["PLANLANDI", "DEVAM_EDIYOR", "TAMAMLANDI", "IPTAL"]),
});

export type TourFormState = { error?: string } | undefined;

export async function createTour(_prevState: TourFormState, formData: FormData): Promise<TourFormState> {
  await requireRole("ADMIN");
  const parsed = createSchema.safeParse({
    name: formData.get("name"), code: formData.get("code"),
    startDate: formData.get("startDate"), endDate: formData.get("endDate"), status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Lütfen tüm alanları geçerli biçimde doldurun." };
  if (!db) return { error: "Veritabanı yapılandırılmadı." };

  await db.tour.create({ data: { name: parsed.data.name, code: parsed.data.code, startDate: new Date(parsed.data.startDate), endDate: new Date(parsed.data.endDate), status: parsed.data.status } });
  revalidatePath("/tours");
}
