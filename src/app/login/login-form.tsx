"use client";
import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#5f6d7c]" htmlFor="email">E-posta</label>
        <input autoComplete="username" className="mt-1 w-full rounded border border-[#dce2e8] px-3 py-2 text-sm outline-none focus:border-[#24795f]" id="email" name="email" required type="email" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#5f6d7c]" htmlFor="password">Şifre</label>
        <input autoComplete="current-password" className="mt-1 w-full rounded border border-[#dce2e8] px-3 py-2 text-sm outline-none focus:border-[#24795f]" id="password" minLength={8} name="password" required type="password" />
      </div>
      {state?.error ? <p className="rounded bg-[#f9eaea] px-3 py-2 text-xs text-[#c75151]">{state.error}</p> : null}
      <button className="w-full rounded bg-[#24795f] py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
    </form>
  );
}
