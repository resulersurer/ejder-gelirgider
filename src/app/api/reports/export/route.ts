import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getReportTransactions, type ReportFilters } from "@/services/reports";

export const runtime = "nodejs";

// Prefixing values that look like spreadsheet formulas prevents CSV/formula injection when opened in Excel.
function csvField(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function parseFilters(params: URLSearchParams): ReportFilters {
  const from = params.get("from"); const to = params.get("to");
  return {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    bank: params.get("bank") || undefined,
    category: params.get("category") || undefined,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  const rows = await getReportTransactions(parseFilters(request.nextUrl.searchParams));
  const header = ["Tarih", "Banka", "İşlem Tipi", "Yön", "Tutar", "Para Birimi", "Gönderen", "Alıcı", "Açıklama", "Kategori", "Durum"];
  const lines = [header.map(csvField).join(",")];
  for (const row of rows) {
    lines.push([
      row.transactionDate.toISOString(), row.bank, row.transactionType, row.direction === "IN" ? "Giriş" : "Çıkış",
      row.amount.toFixed(2), row.currency, row.sender ?? "", row.receiver ?? "", row.description ?? "", row.category ?? "", row.status,
    ].map((value) => csvField(String(value))).join(","));
  }
  const csv = `\uFEFF${lines.join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapor-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
