// Feature-local, single-use: integer cents + ISO-4217 currency → display string (e.g. 2400/"USD" → "$24.00").
// Lives in the binding/mapping layer so ProductCard keeps receiving a clean pre-formatted `price` string.
export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
