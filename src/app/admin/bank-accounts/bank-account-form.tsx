"use client";
import { useActionState } from "react";
import { createBankAccount, type BankAccountFormState } from "./actions";

export function BankAccountForm() {
  const [state, formAction, pending] = useActionState<BankAccountFormState, FormData>(createBankAccount, undefined);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="bankName" placeholder="Banka adı" required />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="accountName" placeholder="Hesap adı" required />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="iban" placeholder="IBAN (TR...)" required />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm uppercase" defaultValue="TRY" maxLength={3} name="currency" placeholder="Para birimi" />
      <button className="rounded bg-[#24795f] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Ekleniyor…" : "Hesap ekle"}</button>
      {state?.error ? <p className="col-span-full rounded bg-[#f9eaea] px-3 py-2 text-xs text-[#c75151]">{state.error}</p> : null}
    </form>
  );
}
