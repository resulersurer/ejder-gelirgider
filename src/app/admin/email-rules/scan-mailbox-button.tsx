"use client";
import { useActionState } from "react";
import { runBankEmailScan, type ScanState } from "./actions";

export function ScanMailboxButton() {
  const [state, action, pending] = useActionState<ScanState, FormData>(runBankEmailScan, undefined);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <form action={action}>
        <button className="rounded bg-[#263746] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Taranıyor..." : "Posta kutusunu şimdi tara"}
        </button>
      </form>
      {state?.message ? <p className="text-xs text-[#14835d]">{state.message}</p> : null}
      {state?.error ? <p className="text-xs text-[#c75151]">{state.error}</p> : null}
    </div>
  );
}