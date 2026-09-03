import { NextRequest } from "next/server";
import { ingestBankEmails } from "@/services/bank-email-ingestion";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Yetkisiz cron isteği" }, { status: 401 });
  try { return Response.json({ ok: true, ...(await ingestBankEmails()) }); }
  catch (error) { console.error("Bank email ingestion failed", error instanceof Error ? error.message : "unknown"); return Response.json({ error: "Mail işleme tamamlanamadı" }, { status: 500 }); }
}