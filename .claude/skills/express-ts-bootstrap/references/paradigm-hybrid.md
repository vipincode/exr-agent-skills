# Paradigm: hybrid (default)

Use the simplest tool per layer: **functional by default, a class only where injection pays for itself.** This avoids ceremony where there is no payoff and reserves classes for where DI genuinely helps testing.

Decision rule, applied per module and written verbatim into ARCHITECTURE.md so planner and builder decide the same way:

| Layer | Style |
|---|---|
| Controllers, routes | **Always functional.** They are request→response wiring; classes add nothing. |
| Repository | **Functional** (exported functions). Mocked with `vi.mock("./<name>.repository.js")`. |
| Service with 0–1 collaborators besides its own repository, no shared state | **Functional** (exported functions) — the common case. |
| Service orchestrating 2+ other modules' services or infra (mailer, payment client, cache), or coordinating transactions | **Class with constructor injection**, instantiated once in `<name>.routes.ts` and exported through `index.ts`. |

Consistency of *the rule* matters more than uniformity of the output. Model, schema, mapper, `index.ts`, and tests are identical in every paradigm — see `module-builder/references/backend-anatomy.md`. Every relative import carries an explicit `.js` extension (NodeNext).

## Functional module (the common case)

Exactly the functional paradigm — repository, service, controller, and routes as in `paradigm-functional.md`. In short:

```ts
// product.service.ts
import { NotFoundError } from "../../lib/app-error.js";
import * as productRepository from "./product.repository.js";
import { toProductDto, type ProductDto } from "./product.mapper.js";
import { PRODUCT_NOT_FOUND } from "./product.constants.js";

export async function getProductById(id: string): Promise<ProductDto> {
  const doc = await productRepository.findById(id);
  if (!doc) throw new NotFoundError(PRODUCT_NOT_FOUND);
  return toProductDto(doc);
}
```

```ts
// product.controller.ts
import type { Response } from "express";
import { ok } from "../../lib/http.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import * as productService from "./product.service.js";
import type { getProductRequest } from "./product.schema.js";

export async function getOne(req: ValidatedRequest<typeof getProductRequest>, res: Response) {
  ok(res, await productService.getProductById(req.params.id));
}
```

## Class service (when DI earns its place)

Illustrative — assumes a registered `lib/mailer.ts` and an `order` module with its own model/repository/mapper.

```ts
// order.service.ts
import type { Mailer } from "../../lib/mailer.js";
import * as orderRepository from "./order.repository.js";
import { toOrderDto, type OrderDto } from "./order.mapper.js";
import type { PlaceOrderInput } from "./order.schema.js";

// Collaborators are typed by the shape this service needs, so tests pass fakes.
interface ProductLookup {
  getProductById(id: string): Promise<{ id: string; priceCents: number }>;
}

export class OrderService {
  constructor(
    private readonly products: ProductLookup,
    private readonly mailer: Mailer,
  ) {}

  async place(userId: string, input: PlaceOrderInput): Promise<OrderDto> {
    const product = await this.products.getProductById(input.productId);
    const order = await orderRepository.create({ userId, productId: product.id, totalCents: product.priceCents });
    await this.mailer.send({ to: userId, template: "order-placed" });
    return toOrderDto(order);
  }
}
```

```ts
// order.container.ts — the composition root for this module
import { getProductById } from "../product/index.js";
import { mailer } from "../../lib/mailer.js";
import { OrderService } from "./order.service.js";

export const orderService = new OrderService({ getProductById }, mailer);
```

```ts
// order.controller.ts — still functional; calls the instance from the container
import type { Response } from "express";
import { created } from "../../lib/http.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import { getAuthUser } from "../../middleware/protect.js";
import { orderService } from "./order.container.js";
import type { placeOrderRequest } from "./order.schema.js";

export async function place(req: ValidatedRequest<typeof placeOrderRequest>, res: Response) {
  created(res, await orderService.place(getAuthUser(req).id, req.body));
}
```

Routes stay functional and import the controller as usual. `index.ts` re-exports `orderService` from `./order.container.js` for other modules. A class service always lives behind a `<name>.container.ts` — never instantiate it in routes or a controller, which invites circular imports and second instances.
