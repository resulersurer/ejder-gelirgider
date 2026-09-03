"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(8) });

// Used to normalize response timing when the account does not exist, reducing user-enumeration risk.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeOZWvmt8CLHRQVKWQdN0uHf.EbaQtcJZK";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Geçerli bir e-posta ve şifre girin." };
  if (!db) return { error: "Veritabanı yapılandırılmadı." };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const passwordMatches = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordMatches) return { error: "E-posta veya şifre hatalı." };

  await createSession({ userId: user.id, email: user.email, name: user.name ?? user.email, role: user.role });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
