# Paradigm: functional

Modules are plain functions and modules of functions. No classes, no `this`, no decorators. Collaborators are imported as namespaces (`import * as productRepository`) so call sites read clearly and `vi.mock()` replaces them cleanly in tests. This is the style the shipped `health` module uses verbatim.

Only four files change shape between paradigms — **repository, service, controller, routes**. The model, schema, mapper, `index.ts`, and tests are identical in every paradigm; see `module-builder/references/backend-anatomy.md` for those. All snippets below compile against the scaffold as-is (verified with `tsc`, ESLint boundary rules, and Vitest). Note the explicit `.js` extensions on every relative import — NodeNext requires them.

## Repository — exported functions, the only model importer

```ts
// product.repository.ts
import type { QueryFilter } from "mongoose";
import { Product, type ProductDoc } from "./product.model.js";
import type { CreateProductInput, UpdateProductInput } from "./product.schema.js";

// Returns plain objects (lean), never hydrated documents.
export async function create(input: CreateProductInput): Promise<ProductDoc> {
  const doc = await Product.create(input);
  return doc.toObject();
}

export function findById(id: string): Promise<ProductDoc | null> {
  return Product.findById(id).lean<ProductDoc>().exec();
}

export async function findPage(
  filter: QueryFilter<ProductDoc>,
  page: { skip: number; limit: number },
): Promise<{ items: ProductDoc[]; total: number }> {
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(page.skip).limit(page.limit).lean<ProductDoc[]>().exec(),
    Product.countDocuments(filter).exec(),
  ]);
  return { items, total };
}

export function updateById(id: string, input: UpdateProductInput): Promise<ProductDoc | null> {
  return Product.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true })
    .lean<ProductDoc>()
    .exec();
}

export async function deleteById(id: string): Promise<boolean> {
  const result = await Product.deleteOne({ _id: id }).exec();
  return result.deletedCount === 1;
}
```

## Service — exported functions, returns DTOs

```ts
// product.service.ts
import { NotFoundError } from "../../lib/app-error.js";
import { toPageMeta, toSkip, type PageMeta } from "../../lib/pagination.js";
import * as productRepository from "./product.repository.js";
import { toProductDto, type ProductDto } from "./product.mapper.js";
import { PRODUCT_NOT_FOUND } from "./product.constants.js";
import { escapeRegex } from "./product.utils.js";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./product.schema.js";

export async function createProduct(input: CreateProductInput): Promise<ProductDto> {
  return toProductDto(await productRepository.create(input));
}

export async function getProductById(id: string): Promise<ProductDto> {
  const doc = await productRepository.findById(id);
  if (!doc) throw new NotFoundError(PRODUCT_NOT_FOUND);
  return toProductDto(doc);
}

export async function listProducts(
  query: ListProductsQuery,
): Promise<{ items: ProductDto[]; meta: PageMeta }> {
  // Build the filter from validated fields only — never pass raw query input.
  const filter = query.search ? { name: { $regex: escapeRegex(query.search), $options: "i" } } : {};
  const { items, total } = await productRepository.findPage(filter, {
    skip: toSkip(query),
    limit: query.limit,
  });
  return { items: items.map(toProductDto), meta: toPageMeta(query, total) };
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDto> {
  const doc = await productRepository.updateById(id, input);
  if (!doc) throw new NotFoundError(PRODUCT_NOT_FOUND);
  return toProductDto(doc);
}

export async function deleteProduct(id: string): Promise<void> {
  const deleted = await productRepository.deleteById(id);
  if (!deleted) throw new NotFoundError(PRODUCT_NOT_FOUND);
}
```

Calling another module: `import { getUserById } from "../user/index.js";` — its public service surface, never its repository or model.

## Controller — thin typed functions, no try/catch

```ts
// product.controller.ts
import type { Response } from "express";
import { created, noContent, ok } from "../../lib/http.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import * as productService from "./product.service.js";
import type {
  createProductRequest,
  getProductRequest,
  listProductsRequest,
  updateProductRequest,
} from "./product.schema.js";

export async function create(req: ValidatedRequest<typeof createProductRequest>, res: Response) {
  created(res, await productService.createProduct(req.body));
}

export async function list(req: ValidatedRequest<typeof listProductsRequest>, res: Response) {
  const { items, meta } = await productService.listProducts(req.query);
  ok(res, items, meta);
}

export async function getOne(req: ValidatedRequest<typeof getProductRequest>, res: Response) {
  ok(res, await productService.getProductById(req.params.id));
}

export async function update(req: ValidatedRequest<typeof updateProductRequest>, res: Response) {
  ok(res, await productService.updateProduct(req.params.id, req.body));
}

export async function remove(req: ValidatedRequest<typeof getProductRequest>, res: Response) {
  await productService.deleteProduct(req.params.id);
  noContent(res);
}
```

## Routes — validate → auth → handler

```ts
// product.routes.ts
import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { protect } from "../../middleware/protect.js";
import { requireRole } from "../../middleware/require-role.js";
import * as controller from "./product.controller.js";
import {
  createProductRequest,
  getProductRequest,
  listProductsRequest,
  updateProductRequest,
} from "./product.schema.js";

const router = Router();

router.get("/", validate(listProductsRequest), controller.list);
router.get("/:id", validate(getProductRequest), controller.getOne);
router.post("/", validate(createProductRequest), protect, requireRole("admin"), controller.create);
router.patch("/:id", validate(updateProductRequest), protect, requireRole("admin"), controller.update);
router.delete("/:id", validate(getProductRequest), protect, requireRole("admin"), controller.remove);

export default router;
```

No wrapper around async handlers — Express 5 forwards rejections.
