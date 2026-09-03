import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { Role } from "./session-token";

const roleRank: Record<Role, number> = { VIEWER: 0, FINANCE: 1, ADMIN: 2 };

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(minRole: Role) {
  const session = await requireSession();
  if (roleRank[session.role] < roleRank[minRole]) redirect("/");
  return session;
}

export const roleLabel: Record<Role, string> = { ADMIN: "Yönetici", FINANCE: "Finans", VIEWER: "Görüntüleyici" };
