"use client";
import { useActionState } from "react";
import { createEmailRule, type EmailRuleFormState } from "./actions";

export function EmailRuleForm() {
  const [state, formAction, pending] = useActionState<EmailRuleFormState, FormData>(createEmailRule, undefined);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="bank" placeholder="Banka adı" required />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="senderEmail" placeholder="Gönderen e-posta / alan adı" required type="text" />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="subjectPattern" placeholder="Konu deseni (regex, opsiyonel)" />
      <select className="rounded border border-[#dce2e8] px-3 py-2 text-sm" defaultValue="generic" name="parserType">
        <option value="akbank">Akbank parser</option>
        <option value="garanti">Garanti BBVA parser</option>
        <option value="isbank">İş Bankası parser</option>
        <option value="generic">Genel parser</option>
      </select>
      <button className="rounded bg-[#24795f] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Ekleniyor…" : "Kural ekle"}</button>
      {state?.error ? <p className="col-span-full rounded bg-[#f9eaea] px-3 py-2 text-xs text-[#c75151]">{state.error}</p> : null}
    </form>
  );
}
