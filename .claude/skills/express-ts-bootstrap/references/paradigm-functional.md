# Paradigm: functional

Modules are plain functions and modules of functions. No classes, no `this`, no decorators. Dependencies are passed as arguments or imported directly. This is the default-friendly style and the one the shipped health module uses verbatim.

## Service — exported functions

```ts
// product.service.ts
import { Product } from "./product.model";
import { NotFoundError } from "../../lib/app-error";
import type { CreateProductInput } from "./product.schema";

export async function createProduct(input: CreateProductInput) {
  return Product.create(input);
}

export async function getProductById(id: string) {
  const product = await Product.findById(id);
  if (!product) throw new NotFoundError("Product not found");
  return product;
}
```

When a service needs collaborators (another service, a mailer), import them or accept them as parameters. Prefer dependency *injection by parameter* only where it aids testing; otherwise direct import is fine and simpler.

## Controller — thin functions, no try/catch

```ts
// product.controller.ts
import type { Request, Response } from "express";
import { created, ok } from "../../lib/http";
import * as productService from "./product.service";

export async function create(req: Request, res: Response) {
  const product = await productService.createProduct(req.body);
  created(res, product);
}

export async function getOne(req: Request, res: Response) {
  const product = await productService.getProductById(req.params.id);
  ok(res, product);
}
```

## Routes

```ts
// product.routes.ts
import { Router } from "express";
import { validate } from "../../middleware/validate";
import { createProductSchema } from "./product.schema";
import * as controller from "./product.controller";

const router = Router();
router.post("/", validate({ body: createProductSchema }), controller.create);
router.get("/:id", controller.getOne);
export default router;
```

Notes: import services as a namespace (`import * as productService`) so call sites read clearly and mocking in tests is straightforward. No wrapper around async handlers — Express 5 forwards rejections.
