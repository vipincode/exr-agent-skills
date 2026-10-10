import * as z from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * The one pagination query shape. List endpoints extend it rather than
 * re-declaring page/limit:
 *   export const listProductsQuery = paginationQuerySchema.extend({ search: z.string().trim().optional() });
 * Query strings arrive as text, hence `coerce`. `limit` is capped so no client
 * can request an unbounded page.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.output<typeof paginationQuerySchema>;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Documents to skip for the requested page (pass to the repository). */
export function toSkip({ page, limit }: PaginationQuery): number {
  return (page - 1) * limit;
}

/** The `meta` object for `ok(res, items, meta)` on every paginated list. */
export function toPageMeta({ page, limit }: PaginationQuery, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
