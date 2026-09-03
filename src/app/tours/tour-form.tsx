"use client";
import { useActionState } from "react";
import { createTour, type TourFormState } from "./actions";

export function TourForm() {
  const [state, formAction, pending] = useActionState<TourFormState, FormData>(createTour, undefined);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="name" placeholder="Tur adı" required />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="code" placeholder="Tur kodu" required />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="startDate" required type="date" />
      <input className="rounded border border-[#dce2e8] px-3 py-2 text-sm" name="endDate" required type="date" />
      <select className="rounded border border-[#dce2e8] px-3 py-2 text-sm" defaultValue="PLANLANDI" name="status">
        <option value="PLANLANDI">Planlandı</option>
        <option value="DEVAM_EDIYOR">Devam ediyor</option>
        <option value="TAMAMLANDI">Tamamlandı</option>
        <option value="IPTAL">İptal</option>
      </select>
      <button className="col-span-full rounded bg-[#24795f] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-1" disabled={pending} type="submit">{pending ? "Ekleniyor…" : "Tur ekle"}</button>
      {state?.error ? <p className="col-span-full rounded bg-[#f9eaea] px-3 py-2 text-xs text-[#c75151]">{state.error}</p> : null}
    </form>
  );
}
