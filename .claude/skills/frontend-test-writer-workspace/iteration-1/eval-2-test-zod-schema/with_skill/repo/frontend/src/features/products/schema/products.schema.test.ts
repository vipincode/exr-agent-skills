import { describe, it, expect } from "vitest";
import {
  productSchema,
  productListDataSchema,
  productsEnvelopeSchema,
  productFiltersSchema,
  createProductSchema,
} from "./products.schema";

// A minimal, valid product used as the baseline for override-based cases.
const validProduct = {
  id: "p_1",
  name: "Aero Mug",
  slug: "aero-mug",
  price: 2400, // integer cents
  currency: "USD",
  category: "drinkware",
  inStock: true,
  imageUrl: "https://cdn.example.com/aero.png",
};

describe("productSchema", () => {
  it("accepts a fully valid product", () => {
    const result = productSchema.parse(validProduct);
    expect(result).toEqual(validProduct);
  });

  it("accepts a product without the optional imageUrl", () => {
    const { imageUrl, ...withoutImage } = validProduct;
    expect(() => productSchema.parse(withoutImage)).not.toThrow();
    const parsed = productSchema.parse(withoutImage);
    expect(parsed.imageUrl).toBeUndefined();
  });

  it("rejects a non-integer price", () => {
    expect(() => productSchema.parse({ ...validProduct, price: 24.5 })).toThrow();
  });

  it("rejects a non-numeric price", () => {
    expect(() => productSchema.parse({ ...validProduct, price: "2400" })).toThrow();
  });

  it("rejects an id that is not a string", () => {
    expect(() => productSchema.parse({ ...validProduct, id: 1 })).toThrow();
  });

  it("rejects a non-boolean inStock", () => {
    expect(() => productSchema.parse({ ...validProduct, inStock: "true" })).toThrow();
  });

  it("rejects an imageUrl that is not a valid URL", () => {
    expect(() => productSchema.parse({ ...validProduct, imageUrl: "not-a-url" })).toThrow();
  });

  it.each(["id", "name", "slug", "price", "currency", "category", "inStock"])(
    "rejects a product missing the required field %s",
    (field) => {
      const incomplete: Record<string, unknown> = { ...validProduct };
      delete incomplete[field];
      expect(() => productSchema.parse(incomplete)).toThrow();
    },
  );
});

describe("productListDataSchema", () => {
  const validList = {
    items: [validProduct],
    total: 1,
    page: 1,
    limit: 20,
  };

  it("accepts a valid list payload", () => {
    expect(() => productListDataSchema.parse(validList)).not.toThrow();
  });

  it("accepts an empty items array", () => {
    const parsed = productListDataSchema.parse({ ...validList, items: [], total: 0 });
    expect(parsed.items).toEqual([]);
  });

  it("rejects items that are not products", () => {
    expect(() =>
      productListDataSchema.parse({ ...validList, items: [{ id: 1 }] }),
    ).toThrow();
  });

  it("rejects a missing pagination field", () => {
    const { total, ...withoutTotal } = validList;
    expect(() => productListDataSchema.parse(withoutTotal)).toThrow();
  });

  it("rejects a non-numeric pagination field", () => {
    expect(() => productListDataSchema.parse({ ...validList, page: "1" })).toThrow();
  });
});

describe("productsEnvelopeSchema", () => {
  const validEnvelope = {
    success: true as const,
    data: { items: [validProduct], total: 1, page: 1, limit: 20 },
    message: "ok",
  };

  it("accepts a valid envelope", () => {
    expect(() => productsEnvelopeSchema.parse(validEnvelope)).not.toThrow();
  });

  it("accepts an envelope without the optional message", () => {
    const { message, ...withoutMessage } = validEnvelope;
    expect(() => productsEnvelopeSchema.parse(withoutMessage)).not.toThrow();
  });

  it("rejects success: false (must be the literal true)", () => {
    expect(() => productsEnvelopeSchema.parse({ ...validEnvelope, success: false })).toThrow();
  });

  it("rejects a drifted data payload (malformed inner shape)", () => {
    expect(() =>
      productsEnvelopeSchema.parse({ success: true, data: { items: [{ id: 1 }] } }),
    ).toThrow();
  });
});

describe("productFiltersSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(() => productFiltersSchema.parse({})).not.toThrow();
  });

  it("accepts a fully specified filter set", () => {
    const filters = { page: 2, limit: 50, search: "mug", category: "drinkware" };
    expect(productFiltersSchema.parse(filters)).toEqual(filters);
  });

  it("rejects a non-numeric page", () => {
    expect(() => productFiltersSchema.parse({ page: "2" })).toThrow();
  });

  it("rejects a non-string search", () => {
    expect(() => productFiltersSchema.parse({ search: 123 })).toThrow();
  });
});

describe("createProductSchema", () => {
  const validInput = {
    name: "Aero Mug",
    price: 2400,
    currency: "USD",
    category: "drinkware",
    inStock: true,
    imageUrl: "https://cdn.example.com/aero.png",
  };

  it("accepts a valid create payload", () => {
    expect(() => createProductSchema.parse(validInput)).not.toThrow();
  });

  it("applies defaults for currency and inStock when omitted", () => {
    const parsed = createProductSchema.parse({
      name: "Trail Bottle",
      price: 1800,
      category: "drinkware",
    });
    expect(parsed.currency).toBe("USD");
    expect(parsed.inStock).toBe(true);
  });

  it("rejects an empty name with the schema message", () => {
    const result = createProductSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("rejects a zero or negative price with the schema message", () => {
    const result = createProductSchema.safeParse({ ...validInput, price: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Price must be greater than 0");
    }
    expect(() => createProductSchema.parse({ ...validInput, price: -5 })).toThrow();
  });

  it("rejects a non-integer price", () => {
    expect(() => createProductSchema.parse({ ...validInput, price: 24.5 })).toThrow();
  });

  it("rejects a currency that is not exactly 3 characters", () => {
    expect(() => createProductSchema.parse({ ...validInput, currency: "US" })).toThrow();
    expect(() => createProductSchema.parse({ ...validInput, currency: "USDD" })).toThrow();
  });

  it("rejects an empty category with the schema message", () => {
    const result = createProductSchema.safeParse({ ...validInput, category: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Category is required");
    }
  });

  it("rejects an invalid imageUrl", () => {
    expect(() => createProductSchema.parse({ ...validInput, imageUrl: "not-a-url" })).toThrow();
  });

  it("accepts a create payload without the optional imageUrl", () => {
    const { imageUrl, ...withoutImage } = validInput;
    expect(() => createProductSchema.parse(withoutImage)).not.toThrow();
  });
});
