import type { Request, Response } from "express";
import { ok, created } from "../../lib/app-response.js";
import { NotFoundError } from "../../lib/app-error.js";
import * as svc from "./products.service.js";
export async function list(req: Request, res: Response) {
  const data = await svc.listProducts(req.query as any);   // { items, total, page, limit }
  return ok(res, data, "Products fetched");
}
export async function getOne(req: Request, res: Response) {
  const product = await svc.getProduct(req.params.id);
  if (!product) throw new NotFoundError("Product not found");
  return ok(res, product, "Product fetched");
}
export async function create(req: Request, res: Response) {
  const product = await svc.createProduct(req.body);
  return created(res, product, "Product created");
}
