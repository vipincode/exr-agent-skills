import * as z from "zod";

// Zod building blocks shared by every module. Reuse these instead of writing a
// new ObjectId regex or `{ id }` params schema per module.

/** A 24-hex-char MongoDB ObjectId string. Rejecting it here means a malformed id
 *  is a clean 400 from `validate`, before Mongoose ever sees it. */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/** Route params for `/:id` routes. */
export const idParamsSchema = z.object({ id: objectIdSchema });

export type IdParams = z.output<typeof idParamsSchema>;
