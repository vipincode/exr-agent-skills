import * as z from "zod";
export const productSchema = z.object({ name: z.string().min(1), price: z.number().positive() });
export type ProductInput = z.infer<typeof productSchema>;
