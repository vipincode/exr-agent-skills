// NOTE: there is a second, near-identical date helper in services/report.service.ts
export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
