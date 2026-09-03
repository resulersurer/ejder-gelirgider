"use client";

export default function ReviewError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f8] p-6 text-[#263441]">
      <section className="max-w-md rounded-md border border-[#e5e9ee] bg-white p-7 text-center">
        <p className="text-xs font-bold tracking-[.8px] text-[#8993a0]">İNCELEME KUYRUĞU</p>
        <h1 className="mt-2 text-xl font-semibold">Kayıtlar şu anda yüklenemedi</h1>
        <p className="mt-2 text-sm text-[#718091]">Geçici bir sunucu hatası oluştu. Yeniden deneyin; sorun sürerse Loglar ekranını kontrol edin.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button className="rounded bg-[#24795f] px-4 py-2 text-sm font-semibold text-white" onClick={reset} type="button">Yeniden dene</button>
          <a className="rounded border border-[#dce2e8] px-4 py-2 text-sm font-semibold text-[#5f6d7c]" href="/">Dashboard</a>
        </div>
      </section>
    </main>
  );
}