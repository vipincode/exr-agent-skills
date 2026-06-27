// Transform the backend's integer-cents `price` + `currency` into a display string,
// e.g. (2400, "USD") -> "$24.00". The built ProductCard expects a pre-formatted string.
export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
