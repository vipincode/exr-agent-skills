# Paradigm: OOP

Modules are classes. A service class holds business logic; a controller class holds HTTP handlers and delegates to the service. Dependencies are injected through the constructor. No DI framework — wire instances by hand in `routes.ts` (simple, explicit, no magic).

## Service class

```ts
// product.service.ts
import { Product } from "./product.model";
import { NotFoundError } from "../../lib/app-error";
import type { CreateProductInput } from "./product.schema";

export class ProductService {
  async create(input: CreateProductInput) {
    return Product.create(input);
  }

  async getById(id: string) {
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }
}
```

## Controller class

Bind handlers as arrow-function class properties so `this` survives being passed to Express as a callback (avoids `.bind` noise):

```ts
// product.controller.ts
import type { Request, Response } from "express";
import { created, ok } from "../../lib/http";
import { ProductService } from "./product.service";

export class ProductController {
  constructor(private readonly service: ProductService) {}

  create = async (req: Request, res: Response) => {
    const product = await this.service.create(req.body);
    created(res, product);
  };

  getOne = async (req: Request, res: Response) => {
    const product = await this.service.getById(req.params.id);
    ok(res, product);
  };
}
```

## Routes — compose instances here

```ts
// product.routes.ts
import { Router } from "express";
import { validate } from "../../middleware/validate";
import { createProductSchema } from "./product.schema";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";

const router = Router();
const controller = new ProductController(new ProductService());

router.post("/", validate({ body: createProductSchema }), controller.create);
router.get("/:id", controller.getOne);
export default router;
```

Notes: constructor injection makes services trivially mockable in tests (pass a fake). Keep one instance per module composed in `routes.ts`; do not new-up services inside controllers. No async wrapper — Express 5 handles rejections from the arrow-property handlers.
