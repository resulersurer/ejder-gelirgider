import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ImapFlow } from "imapflow";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";
import { ingestBankEmails } from "@/services/bank-email-ingestion";

export const runtime = "nodejs";
// Vercel'in izin verdiği maksimum sürenin biraz altında tutuyoruz
export const maxDuration = 55;

/** SSE event oluşturucu */
function sseChunk(event: string, data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: NextRequest) {
  // --- Kimlik doğrulama ---
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return new Response("Yetkisiz", { status: 401 });
  const session = await verifySessionToken(token);
  if (!session) return new Response("Geçersiz oturum", { status: 401 });
  if (session.role === "VIEWER") return new Response("Yetersiz yetki", { status: 403 });

  // --- IMAP yapılandırması ---
  const user = process.env.YANDEX_EMAIL;
  const pass = process.env.YANDEX_APP_PASSWORD;
  if (!user || !pass) {
    return new Response("IMAP yapılandırılmamış", { status: 503 });
  }

  const aborted = { value: false };
  request.signal.addEventListener("abort", () => { aborted.value = true; });

  const stream = new ReadableStream({
    async start(controller) {
      // Bağlantı başarılı bilgisini hemen gönder
      controller.enqueue(sseChunk("connected", { ts: Date.now() }));

      // Her 20 saniyede bir heartbeat göndererek bağlantıyı canlı tut
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

      // 52 saniye içinde çalış (maxDuration=55s, biraz pay bırakıyoruz)
      const deadline = Date.now() + 52_000;

      try {
        while (Date.now() < deadline && !aborted.value) {
          const remaining = deadline - Date.now();
          if (remaining < 2000) break;

          const idleClient = new ImapFlow({
            host: "imap.yandex.com",
            port: 993,
            secure: true,
            auth: { user, pass },
            logger: false,
          });

          try {
            await idleClient.connect();
            const lock = await idleClient.getMailboxLock("INBOX");

            // IMAP IDLE: sunucu yeni mail gelince bildirim gönderir.
            // Vercel kısıtı nedeniyle en fazla kalan süre kadar bekleriz.
            const idlePromise = idleClient.idle();
            const timeoutPromise = new Promise<void>((resolve) =>
              setTimeout(resolve, Math.min(remaining - 1500, 25_000))
            );

            const notified = await Promise.race([
              idlePromise.then(() => true),
              timeoutPromise.then(() => false),
            ]);

            lock.release();
            await idleClient.logout();

            if (aborted.value) break;

            // IDLE bildirimi aldıysak (yeni mail var) → işle ve bildir
            if (notified) {
              try {
                const result = await ingestBankEmails();
                if (result.processed > 0) {
                  controller.enqueue(sseChunk("new_transaction", {
                    count: result.processed,
                    ts: Date.now(),
                  }));
                }
              } catch (err) {
                console.error("[mail-stream] Ingestion hatası:", err instanceof Error ? err.message : err);
              }
            }
          } catch (err) {
            console.error("[mail-stream] IDLE bağlantı hatası:", err instanceof Error ? err.message : err);
            try { await idleClient.logout(); } catch { /* intentional */ }
            // Hata durumunda kısa bekleme
            await new Promise((resolve) => setTimeout(resolve, 3_000));
          }
        }
      } finally {
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* intentional */ }
      }
    },
    cancel() {
      aborted.value = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      // Nginx / proxy tamponlamasını devre dışı bırak
      "X-Accel-Buffering": "no",
    },
  });
}
