// cart feature helper
export function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
