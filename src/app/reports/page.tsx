import { requireSession } from "@/lib/auth-guard";
import { normalizeCurrency } from "@/lib/currency";
import { getCategoryNames, getDistinctBanks, getReportSummary, getReportTransactions } from "@/services/reports";

export const metadata = { title: "Raporlar | Ejder Finans" };
export const dynamic = "force-dynamic";

const money = (amount: number, currency = "TRY") => new Intl.NumberFormat("tr-TR", { style: "currency", currency: normalizeCurrency(currency) }).format(amount);

type SearchParams = { [key: string]: string | string[] | undefined };

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireSession();
  const params = await searchParams;
  const from = toSingle(params.from); const to = toSingle(params.to);
  const bank = toSingle(params.bank); const category = toSingle(params.category);
  const filters = { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined, bank, category };

  const [summary, transactions, banks, categories] = await Promise.all([
    getReportSummary(filters), getReportTransactions(filters), getDistinctBanks(), getCategoryNames(),
  ]);

  const exportQuery = new URLSearchParams();
  if (from) exportQuery.set("from", from);
  if (to) exportQuery.set("to", to);
  if (bank) exportQuery.set("bank", bank);
  if (category) exportQuery.set("category", category);

  return (
    <main className="min-h-screen bg-[#f6f7f8] p-5 text-[#263441] lg:p-10">
      <div className="mx-auto max-w-6xl">
        <a className="text-xs font-semibold text-[#168360]" href="/">← Dashboard</a>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Raporlar</h1>
            <p className="mt-1 text-sm text-[#718091]">Tarih, banka ve kategoriye göre filtreleyip CSV olarak dışa aktarın.</p>
          </div>
          <a className="rounded bg-[#24795f] px-4 py-2 text-xs font-semibold text-white" href={`/api/reports/export?${exportQuery.toString()}`}>↓ CSV indir</a>
        </div>

        <form className="mt-6 grid gap-3 rounded-md border border-[#e5e9ee] bg-white p-5 sm:grid-cols-2 lg:grid-cols-5" method="get">
          <label className="text-xs text-[#5f6d7c]">Başlangıç<input className="mt-1 w-full rounded border border-[#dce2e8] px-3 py-2 text-sm" defaultValue={from ?? ""} name="from" type="date" /></label>
          <label className="text-xs text-[#5f6d7c]">Bitiş<input className="mt-1 w-full rounded border border-[#dce2e8] px-3 py-2 text-sm" defaultValue={to ?? ""} name="to" type="date" /></label>
          <label className="text-xs text-[#5f6d7c]">Banka<select className="mt-1 w-full rounded border border-[#dce2e8] px-3 py-2 text-sm" defaultValue={bank ?? ""} name="bank"><option value="">Tümü</option>{banks.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-xs text-[#5f6d7c]">Kategori<select className="mt-1 w-full rounded border border-[#dce2e8] px-3 py-2 text-sm" defaultValue={category ?? ""} name="category"><option value="">Tümü</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <button className="self-end rounded bg-[#263746] px-3 py-2 text-sm font-semibold text-white" type="submit">Filtrele</button>
        </form>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="rounded-md border border-[#e5e9ee] bg-white p-5"><p className="text-xs text-[#6f7c8b]">Toplam giriş</p><strong className="mt-2 block text-xl text-[#14835d]">{money(summary.income)}</strong></article>
          <article className="rounded-md border border-[#e5e9ee] bg-white p-5"><p className="text-xs text-[#6f7c8b]">Toplam çıkış</p><strong className="mt-2 block text-xl text-[#c75151]">{money(summary.expense)}</strong></article>
          <article className="rounded-md border border-[#e5e9ee] bg-white p-5"><p className="text-xs text-[#6f7c8b]">Net</p><strong className="mt-2 block text-xl">{money(summary.net)}</strong><small className="text-[11px] text-[#8993a0]">{summary.count} işlem</small></article>
        </section>

        <section className="mt-5 overflow-hidden rounded-md border border-[#e5e9ee] bg-white">
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-left text-[11px]">
              <thead className="bg-[#fbfcfc] text-[10px] text-[#8994a0]"><tr>{["Tarih", "Banka", "İşlem", "Yön", "Tutar", "Kategori", "Durum"].map((label) => <th className="whitespace-nowrap p-3 font-semibold" key={label}>{label}</th>)}</tr></thead>
              <tbody>
                {transactions.length ? transactions.map((row) => (
                  <tr className="border-t border-[#eef0f2]" key={row.id}>
                    <td className="whitespace-nowrap p-3">{row.transactionDate.toLocaleDateString("tr-TR")}</td>
                    <td className="whitespace-nowrap p-3 font-bold">{row.bank}</td>
                    <td className="whitespace-nowrap p-3">{row.transactionType}</td>
                    <td className="whitespace-nowrap p-3">{row.direction === "IN" ? "Giriş" : "Çıkış"}</td>
                    <td className={`whitespace-nowrap p-3 font-bold ${row.direction === "IN" ? "text-[#14835d]" : "text-[#c75151]"}`}>{money(row.amount, row.currency)}</td>
                    <td className="whitespace-nowrap p-3">{row.category ?? "Kategorisiz"}</td>
                    <td className="whitespace-nowrap p-3">{row.status}</td>
                  </tr>
                )) : <tr><td className="p-8 text-center text-[#84909d]" colSpan={7}>Seçilen filtrelerle eşleşen işlem bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
