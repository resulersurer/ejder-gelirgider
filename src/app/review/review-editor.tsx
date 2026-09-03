import { updateReviewTransaction } from "./actions";

type ReviewEditorProps = {
  id: string;
  bank: string;
  amount: number;
  direction: "IN" | "OUT";
  categoryId: string | null;
  categories: { id: string; name: string }[];
};

export function ReviewEditor({ id, bank, amount, direction, categoryId, categories }: ReviewEditorProps) {
  return (
    <form action={updateReviewTransaction} className="mt-5 grid gap-3 border-t border-[#edf0f2] pt-4 sm:grid-cols-5">
      <input name="id" type="hidden" value={id} />
      <label className="text-[11px] text-[#718091]">Banka<input className="mt-1 w-full rounded border border-[#dce2e8] px-2 py-1.5 text-sm text-[#263441]" defaultValue={bank} name="bank" required /></label>
      <label className="text-[11px] text-[#718091]">Tutar<input className="mt-1 w-full rounded border border-[#dce2e8] px-2 py-1.5 text-sm text-[#263441]" defaultValue={amount} min="0.01" name="amount" required step="0.01" type="number" /></label>
      <label className="text-[11px] text-[#718091]">Yön<select className="mt-1 w-full rounded border border-[#dce2e8] px-2 py-1.5 text-sm text-[#263441]" defaultValue={direction} name="direction"><option value="IN">Giriş</option><option value="OUT">Çıkış</option></select></label>
      <label className="text-[11px] text-[#718091]">Kategori<select className="mt-1 w-full rounded border border-[#dce2e8] px-2 py-1.5 text-sm text-[#263441]" defaultValue={categoryId ?? ""} name="categoryId"><option value="">Kategorisiz</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <div className="flex items-end gap-2"><button className="rounded bg-[#24795f] px-3 py-2 text-xs font-semibold text-white" name="status" type="submit" value="CONFIRMED">Kaydet ve onayla</button><button className="rounded border border-[#dce2e8] px-3 py-2 text-xs font-semibold text-[#5f6d7c]" name="status" type="submit" value="IGNORED">Yok say</button></div>
    </form>
  );
}
