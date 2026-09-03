import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Giriş | Ejder Finans" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f8] p-6">
      <div className="w-full max-w-sm rounded-md border border-[#e5e9ee] bg-white p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#e5783c] text-lg font-bold text-white">e</div>
          <h1 className="text-lg font-semibold text-[#263441]">Ejder Finans</h1>
          <p className="mt-1 text-xs text-[#8993a0]">Hesabınıza giriş yapın</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
