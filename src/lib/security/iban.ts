export function maskIban(rawIban: string): string {
  const normalized = rawIban.replace(/\s+/g, "").toUpperCase();
  if (normalized.length < 6) return "*".repeat(normalized.length);
  const country = normalized.slice(0, 2);
  const lastTwo = normalized.slice(-2);
  const middleLength = Math.max(normalized.length - 6, 0);
  const masked = `${country}**${"*".repeat(middleLength)}${lastTwo}`;
  return masked.match(/.{1,4}/g)?.join(" ") ?? masked;
}
