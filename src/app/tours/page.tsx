import { requireRole } from "@/lib/auth-guard";
import { getTours } from "@/services/tours";
import { TourForm } from "./tour-form";

export const metadata = { title: "Turlar | Ejder Finans" };

const money = (amount: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
const statusLabel: Record<string, string> = { PLANLANDI: "Planlandı", DEVAM_EDIYOR: "Devam ediyor", TAMAMLANDI: "Tamamlandı", IPTAL: "İptal" };

export default async function ToursPage() {
  const session = await requireRole("FINANCE");
  const tours = await getTours();
  return (
    <main className="min-h-screen bg-[#f6f7f8] p-5 text-[#263441] lg:p-10">
      <div className="mx-auto max-w-5xl">
        <a className="text-xs font-semibold text-[#168360]" href="/">← Dashboard</a>
        <h1 className="mt-4 text-2xl font-semibold">Turlar</h1>
        <p className="mt-1 text-sm text-[#718091]">Banka hareketleri ileride turlara bağlanarak tur bazlı kârlılık takibi yapılabilir.</p>

        {session.role === "ADMIN" ? <section className="mt-6 rounded-md border border-[#e5e9ee] bg-white p-5"><TourForm /></section> : null}

        <section className="mt-6 space-y-3">
          {tours.length ? tours.map((tour) => (
            <article className="rounded-md border border-[#e5e9ee] bg-white p-4" key={tour.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{tour.name} <span className="ml-2 rounded bg-[#f0f3f5] px-2 py-0.5 text-[10px] font-normal text-[#657384]">{tour.code}</span></p>
                <span className="rounded-full bg-[#eef1f3] px-2 py-1 text-[10px] font-semibold text-[#5f6d7c]">{statusLabel[tour.status] ?? tour.status}</span>
              </div>
              <p className="mt-1 text-xs text-[#8993a0]">{tour.startDate.toLocaleDateString("tr-TR")} – {tour.endDate.toLocaleDateString("tr-TR")}</p>
              <dl className="mt-3 grid grid-cols-3 text-xs">
                <div><dt className="text-[#8b96a2]">Tahsilat</dt><dd className="mt-1 font-bold text-[#14835d]">{money(tour.income)}</dd></div>
                <div><dt className="text-[#8b96a2]">Gider</dt><dd className="mt-1 font-bold text-[#c75151]">{money(tour.expense)}</dd></div>
                <div><dt className="text-[#8b96a2]">Net</dt><dd className="mt-1 font-bold">{money(tour.income - tour.expense)}</dd></div>
              </dl>
            </article>
          )) : <div className="rounded-md border border-dashed border-[#cfd7dd] bg-white px-5 py-14 text-center text-sm text-[#718091]">Henüz tur tanımlanmadı.</div>}
        </section>
      </div>
    </main>
  );
}
