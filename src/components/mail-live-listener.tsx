"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";

type LiveStatus = "connecting" | "connected" | "disconnected";

const statusConfig: Record<LiveStatus, { dot: string; label: string; sub: string }> = {
  connecting: {
    dot: "bg-[#e9ad5f]",
    label: "Bağlanıyor…",
    sub: "IMAP akışı başlatılıyor",
  },
  connected: {
    dot: "bg-[#65c79d]",
    label: "Canlı izleme aktif",
    sub: "Yeni mail anında işlenir",
  },
  disconnected: {
    dot: "bg-[#c15a56]",
    label: "Bağlantı kesildi",
    sub: "Yeniden bağlanılıyor…",
  },
};

/**
 * IMAP IDLE tabanlı canlı mail izleyici.
 * SSE bağlantısı açar; yeni işlem gelince router.refresh() ile sayfayı günceller.
 * Sidebar'daki sistem durumu widget'ını da bu bileşen render eder.
 */
export function MailLiveListener({ dbConnected }: { dbConnected: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [lastCount, setLastCount] = useState<number | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    function connect() {
      if (!mounted) return;

      setStatus("connecting");

      const es = new EventSource("/api/mail-stream");
      esRef.current = es;

      es.addEventListener("connected", () => {
        if (!mounted) return;
        setStatus("connected");
      });

      es.addEventListener("new_transaction", (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const data = JSON.parse(e.data) as { count: number };
          setLastCount(data.count);
        } catch { /* intentional */ }
        // Yeni işlem geldi → tüm server component verilerini güncelle
        router.refresh();
      });

      es.onerror = () => {
        if (!mounted) return;
        setStatus("disconnected");
        es.close();
        esRef.current = null;
        // 4 saniye sonra yeniden dene
        retryRef.current = setTimeout(connect, 4_000);
      };
    }

    connect();

    return () => {
      mounted = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      esRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = statusConfig[status];

  return (
    <div className="mt-auto rounded-md border border-[#3b4e5e] p-3 text-[#b9c6d0]">
      <div className="flex items-center gap-2">
        <Settings2 size={15} />
        <span className="text-xs font-semibold">Sistem durumu</span>
      </div>
      <p className="mt-2 text-[11px] text-[#91a2af]">{cfg.sub}</p>
      <span className={`mt-2 inline-flex items-center gap-1 text-[10px] ${status === "connected" ? "text-[#65c79d]" : status === "connecting" ? "text-[#e9ad5f]" : "text-[#c15a56]"}`}>
        <i className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${status === "connecting" ? "animate-pulse" : ""}`} />
        {cfg.label}
      </span>
      {dbConnected ? null : (
        <span className="mt-1 block text-[10px] text-[#e9ad5f]">⚠ Veritabanı bağlantısı yok</span>
      )}
      {lastCount !== null && (
        <span className="mt-1 block text-[10px] text-[#65c79d]">
          {lastCount} yeni işlem işlendi ✓
        </span>
      )}
    </div>
  );
}
