# Paradigm: hybrid (default)

Use the simplest tool per layer. In practice: **functional controllers and routes** (they are just request→response wiring, classes add nothing), **service as a class only when it holds collaborators or state worth injecting** — otherwise exported functions. This is the recommended default because it avoids ceremony where there is no payoff and reserves classes for where DI genuinely helps testing.

Decision rule, applied per module:
- Service has 0–1 dependencies and no shared state → **functional service** (exported functions).
- Service depends on 2+ collaborators you'll want to mock, or coordinates transactions/caches → **class service** with constructor injection.
- Controllers and routes → **always functional**.
- Repositories/data access → fold into the service unless a module's data logic is large enough to warrant its own `*.repository.ts`; if so, match the service's style.

## Functional service (the common case)

```ts
// product.service.ts
import { Product } from "./product.model";
import { NotFoundError } from "../../lib/app-error";
import type { CreateProductInput } from "./product.schema";

export async function createProduct(input: CreateProductInput) {
  return Product.create(input);
}
export async function getProductById(id: string) {
  const p = await Product.findById(id);
  if (!p) throw new NotFoundError("Product not found");
  return p;
}
```

## Class service (when DI earns its place)

```ts
// order.service.ts
import type { ProductService } from "../product/product.service";
import type { Mailer } from "../../lib/mailer";

export class OrderService {
  constructor(
    private readonly products: ProductService,
    private readonly mailer: Mailer,
  ) {}
  // ...methods that orchestrate products + mailer
}
```

## Controllers & routes — functional regardless

```ts
// product.controller.ts
import type { Request, Response } from "express";
import { created, ok } from "../../lib/http";
import * as productService from "./product.service";

export async function create(req: Request, res: Response) {
  created(res, await productService.createProduct(req.body));
}
export async function getOne(req: Request, res: Response) {
  ok(res, await productService.getProductById(req.params.id));
}
```

The mixing rule must be written explicitly into ARCHITECTURE.md so backend-feature-planner and backend-module-builder apply the same decision rule per module rather than guessing. Consistency of *the rule* matters more than uniformity of the output.
