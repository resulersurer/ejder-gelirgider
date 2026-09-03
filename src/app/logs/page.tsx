import { requireRole } from "@/lib/auth-guard";
import { getEmailLogs } from "@/services/logs";

export const metadata = { title: "Loglar | Ejder Finans" };

const statusLabel: Record<string, string> = { PROCESSED: "İşlendi", IGNORED: "Yok sayıldı" };

export default async function LogsPage() {
  await requireRole("FINANCE");
  const logs = await getEmailLogs();
  return (
    <main className="min-h-screen bg-[#f6f7f8] p-5 text-[#263441] lg:p-10">
      <div className="mx-auto max-w-5xl">
        <a className="text-xs font-semibold text-[#168360]" href="/">← Dashboard</a>
        <h1 className="mt-4 text-2xl font-semibold">Mail işleme logları</h1>
        <p className="mt-1 text-sm text-[#718091]">Muhasebe posta kutusu IMAP taramasında işlenen veya yok sayılan e-postalar. Ham mail içeriği saklanmaz.</p>

        <section className="mt-6 overflow-hidden rounded-md border border-[#e5e9ee] bg-white">
          <div className="overflow-auto">
            <table className="w-full min-w-[800px] text-left text-[11px]">
              <thead className="bg-[#fbfcfc] text-[10px] text-[#8994a0]"><tr>{["Tarih", "Gönderen", "Konu", "Tespit Edilen Banka", "Durum", "Hata"].map((label) => <th className="whitespace-nowrap p-3 font-semibold" key={label}>{label}</th>)}</tr></thead>
              <tbody>
                {logs.length ? logs.map((log) => (
                  <tr className="border-t border-[#eef0f2]" key={log.id}>
                    <td className="whitespace-nowrap p-3">{log.processedAt.toLocaleString("tr-TR")}</td>
                    <td className="whitespace-nowrap p-3">{log.sender}</td>
                    <td className="p-3">{log.subject}</td>
                    <td className="whitespace-nowrap p-3">{log.bankDetected ?? "-"}</td>
                    <td className="whitespace-nowrap p-3"><span className={`rounded-full px-2 py-1 text-[10px] ${log.status === "PROCESSED" ? "bg-[#e7f4ee] text-[#1c825e]" : "bg-[#f0f3f5] text-[#657384]"}`}>{statusLabel[log.status] ?? log.status}</span></td>
                    <td className="p-3 text-[#c75151]">{log.errorMessage ?? "-"}</td>
                  </tr>
                )) : <tr><td className="p-8 text-center text-[#84909d]" colSpan={6}>Henüz mail işleme kaydı yok. Cron çalıştığında burada görünecek.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
