import { Router } from "express";
import { protect, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listProductsQuery, createProductBody, productIdParam } from "./products.schema.js";
import * as ctrl from "./products.controller.js";
export const productsRouter = Router();
// GET /api/products            — public, paginated list
productsRouter.get("/", validate({ query: listProductsQuery }), ctrl.list);
// GET /api/products/:id        — public, single
productsRouter.get("/:id", validate({ params: productIdParam }), ctrl.getOne);
// POST /api/products           — admin only
productsRouter.post("/", protect, requireRole("admin"), validate({ body: createProductBody }), ctrl.create);
