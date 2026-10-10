import * as z from "zod";

// The backend's response envelope, mirrored once so every feature parses it the
// same way. Matches express-ts-bootstrap: success → { success: true, data, meta? },
// lists → data is an array and meta is the pagination block. A feature's request
// fn calls parseData / parsePaginated with its own schema, so contract drift
// throws (and surfaces as a query error) instead of rendering garbage.

/** Pagination meta — the backend's `toPageMeta()` output on every paginated list. */
export const pageMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export type PageMeta = z.infer<typeof pageMetaSchema>;

/** A parsed page of results: what list request fns and hooks return. */
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** `{ success: true, data }` around any data schema. */
export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), data });
}

/** `{ success: true, data: T[], meta }` for paginated lists. */
export function paginatedEnvelopeSchema<T extends z.ZodType>(item: T) {
  return z.object({ success: z.literal(true), data: z.array(item), meta: pageMetaSchema });
}

// Zod can't resolve the envelope's keys while T is still generic, so the parsed
// result is narrowed explicitly — `.parse()` has already validated the shape.

/** Validate a single-resource response body and return its `data`. */
export function parseData<T extends z.ZodType>(schema: T, body: unknown): z.output<T> {
  const parsed = envelopeSchema(schema).parse(body) as { data: z.output<T> };
  return parsed.data;
}

/** Validate a paginated response body and return `{ items, meta }`. */
export function parsePaginated<T extends z.ZodType>(item: T, body: unknown): Paginated<z.output<T>> {
  const parsed = paginatedEnvelopeSchema(item).parse(body) as { data: z.output<T>[]; meta: PageMeta };
  return { items: parsed.data, meta: parsed.meta };
}
