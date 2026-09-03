import { requireRole } from "@/lib/auth-guard";
import { getBankAccounts } from "@/services/bank-accounts";
import { toggleBankAccountActive } from "./actions";
import { BankAccountForm } from "./bank-account-form";

export const metadata = { title: "Banka Hesapları | Ejder Finans" };

export default async function BankAccountsPage() {
  await requireRole("ADMIN");
  const accounts = await getBankAccounts();
  return (
    <main className="min-h-screen bg-[#f6f7f8] p-5 text-[#263441] lg:p-10">
      <div className="mx-auto max-w-4xl">
        <a className="text-xs font-semibold text-[#168360]" href="/">← Dashboard</a>
        <h1 className="mt-4 text-2xl font-semibold">Banka hesapları</h1>
        <p className="mt-1 text-sm text-[#718091]">Şirketin banka hesaplarını tanımlayın. IBAN bilgileri her zaman maskeli saklanır.</p>

        <section className="mt-6 rounded-md border border-[#e5e9ee] bg-white p-5">
          <BankAccountForm />
        </section>

        <section className="mt-6 space-y-3">
          {accounts.length ? accounts.map((account) => (
            <article className="flex flex-col justify-between gap-3 rounded-md border border-[#e5e9ee] bg-white p-4 sm:flex-row sm:items-center" key={account.id}>
              <div>
                <p className="font-semibold">{account.bankName} <span className="ml-2 text-xs font-normal text-[#8993a0]">{account.accountName}</span></p>
                <p className="mt-1 font-mono text-xs text-[#5f6d7c]">{account.ibanMasked} · {account.currency}</p>
              </div>
              <form action={toggleBankAccountActive.bind(null, account.id, !account.active)}>
                <button className={`rounded px-3 py-2 text-xs font-semibold ${account.active ? "border border-[#dce2e8] text-[#5f6d7c]" : "bg-[#24795f] text-white"}`} type="submit">
                  {account.active ? "Pasifleştir" : "Aktifleştir"}
                </button>
              </form>
            </article>
          )) : <div className="rounded-md border border-dashed border-[#cfd7dd] bg-white px-5 py-14 text-center text-sm text-[#718091]">Henüz banka hesabı tanımlanmadı.</div>}
        </section>
      </div>
    </main>
  );
}
