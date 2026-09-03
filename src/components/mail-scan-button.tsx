"use client";
import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { runDashboardMailScan, type MailScanState } from "@/app/mail-actions";

export function MailScanButton() {
  const [state, action, pending] = useActionState<MailScanState, FormData>(runDashboardMailScan, undefined);
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={action}>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1f765b] px-3 text-xs font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          <RefreshCw className={pending ? "animate-spin" : ""} size={14} />
          {pending ? "Taranıyor" : "Postayı tara"}
        </button>
      </form>
      {state?.message ? <p className="max-w-96 text-right text-[11px] text-[#167b5d]">{state.message}</p> : null}
      {state?.error ? <p className="max-w-96 text-right text-[11px] text-[#c15a56]">{state.error}</p> : null}
    </div>
  );
}
