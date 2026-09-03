import { requireRole } from "@/lib/auth-guard";
import { getEmailRules } from "@/services/email-rules";
import { toggleEmailRuleActive } from "./actions";
import { EmailRuleForm } from "./email-rule-form";

export const metadata = { title: "Mail Kuralları | Ejder Finans" };

export default async function EmailRulesPage() {
  await requireRole("ADMIN");
  const rules = await getEmailRules();
  return (
    <main className="min-h-screen bg-[#f6f7f8] p-5 text-[#263441] lg:p-10">
      <div className="mx-auto max-w-5xl">
        <a className="text-xs font-semibold text-[#168360]" href="/">← Dashboard</a>
        <h1 className="mt-4 text-2xl font-semibold">Banka mail kuralları</h1>
        <p className="mt-1 text-sm text-[#718091]">Yeni bir banka eklemek için buradan kural tanımlayın; kod değişikliği gerekmez (bilinen bankalar için).</p>

        <section className="mt-6 rounded-md border border-[#e5e9ee] bg-white p-5">
          <EmailRuleForm />
        </section>

        <section className="mt-6 space-y-3">
          {rules.length ? rules.map((rule) => (
            <article className="flex flex-col justify-between gap-3 rounded-md border border-[#e5e9ee] bg-white p-4 sm:flex-row sm:items-center" key={rule.id}>
              <div>
                <p className="font-semibold">{rule.bank} <span className="ml-2 rounded bg-[#f0f3f5] px-2 py-0.5 text-[10px] font-normal text-[#657384]">{rule.parserType}</span></p>
                <p className="mt-1 text-xs text-[#718091]">Gönderen: {rule.senderEmail}{rule.subjectPattern ? ` · Konu: ${rule.subjectPattern}` : ""}</p>
              </div>
              <form action={toggleEmailRuleActive.bind(null, rule.id, !rule.active)}>
                <button className={`rounded px-3 py-2 text-xs font-semibold ${rule.active ? "border border-[#dce2e8] text-[#5f6d7c]" : "bg-[#24795f] text-white"}`} type="submit">
                  {rule.active ? "Pasifleştir" : "Aktifleştir"}
                </button>
              </form>
            </article>
          )) : <div className="rounded-md border border-dashed border-[#cfd7dd] bg-white px-5 py-14 text-center text-sm text-[#718091]">Henüz mail kuralı tanımlanmadı. Tanımlı kural yoksa sistem yerleşik varsayılan bankaları (Akbank, Garanti BBVA, İş Bankası) otomatik tanır.</div>}
        </section>
      </div>
    </main>
  );
}
