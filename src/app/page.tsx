import { getDashboardData } from "@/services/dashboard";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-guard";
import { logout } from "@/app/login/actions";
import { FinanceDashboard } from "@/components/finance-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await requireSession();
  if (session.role === "VIEWER") redirect("/reports");
  const data = await getDashboardData();
  return <FinanceDashboard data={data} name={session.name} onLogout={logout} role={session.role} />;
}
