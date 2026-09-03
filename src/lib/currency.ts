const currencyAliases: Record<string, string> = {
  TL: "TRY",
  TRY: "TRY",
  "₺": "TRY",
  EUR: "EUR",
  "€": "EUR",
  USD: "USD",
  "$": "USD",
};

export function normalizeCurrency(value?: string): string {
  return currencyAliases[value?.trim().toUpperCase() ?? ""] ?? "TRY";
}