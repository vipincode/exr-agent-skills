# Paradigm: OOP

Modules are classes. A repository class owns data access, a service class holds business logic, a controller class holds HTTP handlers. Dependencies are injected through the constructor. No DI framework — instances are wired by hand in `routes.ts` (simple, explicit, no magic).

Only four files change shape between paradigms — **repository, service, controller, routes**. The model, schema, mapper, `index.ts`, and tests are identical in every paradigm; see `module-builder/references/backend-anatomy.md`. Every relative import carries an explicit `.js` extension (NodeNext). All snippets compile against the scaffold as-is.

## Repository class — the only model importer

```ts
// product.repository.ts
import type { QueryFilter } from "mongoose";
import { Product, type ProductDoc } from "./product.model.js";
import type { CreateProductInput } from "./product.schema.js";

export class ProductRepository {
  async create(input: CreateProductInput): Promise<ProductDoc> {
    const doc = await Product.create(input);
    return doc.toObject();
  }

  findById(id: string): Promise<ProductDoc | null> {
    return Product.findById(id).lean<ProductDoc>().exec();
  }

  async findPage(
    filter: QueryFilter<ProductDoc>,
    page: { skip: number; limit: number },
  ): Promise<{ items: ProductDoc[]; total: number }> {
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(page.skip).limit(page.limit).lean<ProductDoc[]>().exec(),
      Product.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}
```

## Service class — constructor-injected repository

```ts
// product.service.ts
import { NotFoundError } from "../../lib/app-error.js";
import { toPageMeta, toSkip, type PageMeta } from "../../lib/pagination.js";
import type { ProductRepository } from "./product.repository.js";
import { toProductDto, type ProductDto } from "./product.mapper.js";
import { PRODUCT_NOT_FOUND } from "./product.constants.js";
import type { CreateProductInput, ListProductsQuery } from "./product.schema.js";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async create(input: CreateProductInput): Promise<ProductDto> {
    return toProductDto(await this.repository.create(input));
  }

  async getById(id: string): Promise<ProductDto> {
    const doc = await this.repository.findById(id);
    if (!doc) throw new NotFoundError(PRODUCT_NOT_FOUND);
    return toProductDto(doc);
  }

  async list(query: ListProductsQuery): Promise<{ items: ProductDto[]; meta: PageMeta }> {
    const { items, total } = await this.repository.findPage({}, { skip: toSkip(query), limit: query.limit });
    return { items: items.map(toProductDto), meta: toPageMeta(query, total) };
  }
}
```

## Controller class — arrow properties keep `this`

```ts
// product.controller.ts
import type { Response } from "express";
import { created, ok } from "../../lib/http.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import type { ProductService } from "./product.service.js";
import type { createProductRequest, getProductRequest, listProductsRequest } from "./product.schema.js";

export class ProductController {
  constructor(private readonly service: ProductService) {}

  create = async (req: ValidatedRequest<typeof createProductRequest>, res: Response) => {
    created(res, await this.service.create(req.body));
  };

  list = async (req: ValidatedRequest<typeof listProductsRequest>, res: Response) => {
    const { items, meta } = await this.service.list(req.query);
    ok(res, items, meta);
  };

  getOne = async (req: ValidatedRequest<typeof getProductRequest>, res: Response) => {
    ok(res, await this.service.getById(req.params.id));
  };
}
```

## Container — the composition root

`<name>.container.ts` is the one place instances are created, wired innermost-first. It may import the repository (it is not a controller/routes file, so the boundary lint allows it) and never imports the model.

```ts
// product.container.ts
import { ProductRepository } from "./product.repository.js";
import { ProductService } from "./product.service.js";
import { ProductController } from "./product.controller.js";

export const productService = new ProductService(new ProductRepository()); // one instance per module
export const productController = new ProductController(productService);
```

## Routes

```ts
// product.routes.ts
import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { protect } from "../../middleware/protect.js";
import { requireRole } from "../../middleware/require-role.js";
import { productController as controller } from "./product.container.js";
import { createProductRequest, getProductRequest, listProductsRequest } from "./product.schema.js";

const router = Router();

router.get("/", validate(listProductsRequest), controller.list);
router.get("/:id", validate(getProductRequest), controller.getOne);
router.post("/", validate(createProductRequest), protect, requireRole("admin"), controller.create);

export default router;
```

`index.ts` exposes the shared instance for other modules — `export { productService } from "./product.container.js";` next to `export { default as productRoutes } from "./product.routes.js";`. Another module's container passes it into its own service's constructor rather than newing a second one.

Testing: construct the service with a fake repository (`new ProductService(fakeRepo as unknown as ProductRepository)`) — that's the payoff of constructor injection. Never new-up a service inside a controller. No async wrapper — Express 5 handles rejections from the arrow-property handlers.
