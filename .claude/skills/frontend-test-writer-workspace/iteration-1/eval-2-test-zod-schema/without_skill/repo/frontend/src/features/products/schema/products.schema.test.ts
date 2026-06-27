import { describe, it, expect } from "vitest";
import {
  productSchema,
  productListDataSchema,
  productsEnvelopeSchema,
  productFiltersSchema,
  createProductSchema,
} from "./products.schema";

// A reusable, fully-valid product fixture.
const validProduct = {
  id: "p_1",
  name: "Mechanical Keyboard",
  slug: "mechanical-keyboard",
  price: 12999, // integer cents
  currency: "USD",
  category: "peripherals",
  inStock: true,
  imageUrl: "https://example.com/kb.png",
};

describe("productSchema", () => {
  it("parses a fully-valid product", () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validProduct);
    }
  });

  it("accepts a product without the optional imageUrl", () => {
    const { imageUrl, ...withoutImage } = validProduct;
    const result = productSchema.safeParse(withoutImage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBeUndefined();
    }
  });

  it("rejects a non-integer price", () => {
    const result = productSchema.safeParse({ ...validProduct, price: 129.99 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "price")).toBe(true);
    }
  });

  it("accepts a zero or negative integer price (no positivity constraint here)", () => {
    expect(productSchema.safeParse({ ...validProduct, price: 0 }).success).toBe(true);
    expect(productSchema.safeParse({ ...validProduct, price: -5 }).success).toBe(true);
  });

  it("rejects an invalid imageUrl", () => {
    const result = productSchema.safeParse({ ...validProduct, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "imageUrl")).toBe(true);
    }
  });

  it.each([
    ["id", undefined],
    ["name", undefined],
    ["slug", undefined],
    ["price", undefined],
    ["currency", undefined],
    ["category", undefined],
    ["inStock", undefined],
  ])("rejects when required field %s is missing", (field) => {
    const clone: Record<string, unknown> = { ...validProduct };
    delete clone[field as string];
    const result = productSchema.safeParse(clone);
    expect(result.success).toBe(false);
  });

  it.each([
    ["id", 123],
    ["name", 1],
    ["slug", true],
    ["price", "12999"],
    ["currency", 840],
    ["category", null],
    ["inStock", "yes"],
  ])("rejects wrong type for field %s", (field, badValue) => {
    const result = productSchema.safeParse({ ...validProduct, [field as string]: badValue });
    expect(result.success).toBe(false);
  });
});

describe("productListDataSchema", () => {
  const validList = {
    items: [validProduct],
    total: 1,
    page: 1,
    limit: 20,
  };

  it("parses a valid list payload", () => {
    const result = productListDataSchema.safeParse(validList);
    expect(result.success).toBe(true);
  });

  it("accepts an empty items array", () => {
    const result = productListDataSchema.safeParse({ ...validList, items: [], total: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects when an item in items is invalid", () => {
    const result = productListDataSchema.safeParse({
      ...validList,
      items: [{ ...validProduct, price: 1.5 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "items")).toBe(true);
    }
  });

  it("rejects when items is not an array", () => {
    expect(productListDataSchema.safeParse({ ...validList, items: validProduct }).success).toBe(false);
  });

  it.each(["total", "page", "limit"])("rejects non-number %s", (field) => {
    const result = productListDataSchema.safeParse({ ...validList, [field]: "1" });
    expect(result.success).toBe(false);
  });

  it.each(["items", "total", "page", "limit"])("rejects when %s is missing", (field) => {
    const clone: Record<string, unknown> = { ...validList };
    delete clone[field];
    expect(productListDataSchema.safeParse(clone).success).toBe(false);
  });
});

describe("productsEnvelopeSchema", () => {
  const validData = {
    items: [validProduct],
    total: 1,
    page: 1,
    limit: 20,
  };

  it("parses a valid envelope", () => {
    const result = productsEnvelopeSchema.safeParse({
      success: true,
      data: validData,
      message: "ok",
    });
    expect(result.success).toBe(true);
  });

  it("parses an envelope without the optional message", () => {
    const result = productsEnvelopeSchema.safeParse({ success: true, data: validData });
    expect(result.success).toBe(true);
  });

  it("rejects success: false (must be literal true)", () => {
    const result = productsEnvelopeSchema.safeParse({ success: false, data: validData });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "success")).toBe(true);
    }
  });

  it("rejects a missing success flag", () => {
    expect(productsEnvelopeSchema.safeParse({ data: validData }).success).toBe(false);
  });

  it("rejects invalid nested data", () => {
    const result = productsEnvelopeSchema.safeParse({
      success: true,
      data: { ...validData, total: "1" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-string message", () => {
    expect(
      productsEnvelopeSchema.safeParse({ success: true, data: validData, message: 5 }).success,
    ).toBe(false);
  });
});

describe("productFiltersSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = productFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("parses a fully-populated filter object", () => {
    const filters = { page: 2, limit: 50, search: "kb", category: "peripherals" };
    const result = productFiltersSchema.safeParse(filters);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(filters);
    }
  });

  it.each([
    ["page", "2"],
    ["limit", "50"],
    ["search", 1],
    ["category", true],
  ])("rejects wrong type for %s", (field, badValue) => {
    const result = productFiltersSchema.safeParse({ [field as string]: badValue });
    expect(result.success).toBe(false);
  });
});

describe("createProductSchema", () => {
  const validInput = {
    name: "New Mouse",
    price: 4999,
    currency: "USD",
    category: "peripherals",
    inStock: true,
    imageUrl: "https://example.com/mouse.png",
  };

  it("parses a fully-valid create input", () => {
    const result = createProductSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("applies defaults for currency and inStock when omitted", () => {
    const result = createProductSchema.safeParse({
      name: "New Mouse",
      price: 4999,
      category: "peripherals",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
      expect(result.data.inStock).toBe(true);
    }
  });

  it("rejects an empty name with the configured message", () => {
    const result = createProductSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameIssue?.message).toBe("Name is required");
    }
  });

  it("rejects an empty category with the configured message", () => {
    const result = createProductSchema.safeParse({ ...validInput, category: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const catIssue = result.error.issues.find((i) => i.path[0] === "category");
      expect(catIssue?.message).toBe("Category is required");
    }
  });

  it.each([
    ["zero", 0],
    ["negative", -100],
  ])("rejects a non-positive price (%s) with the configured message", (_label, price) => {
    const result = createProductSchema.safeParse({ ...validInput, price });
    expect(result.success).toBe(false);
    if (!result.success) {
      const priceIssue = result.error.issues.find((i) => i.path[0] === "price");
      expect(priceIssue?.message).toBe("Price must be greater than 0");
    }
  });

  it("rejects a non-integer price", () => {
    const result = createProductSchema.safeParse({ ...validInput, price: 49.99 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "price")).toBe(true);
    }
  });

  it("rejects a currency that is not exactly 3 characters", () => {
    expect(createProductSchema.safeParse({ ...validInput, currency: "US" }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...validInput, currency: "USDD" }).success).toBe(false);
  });

  it("rejects an invalid imageUrl", () => {
    const result = createProductSchema.safeParse({ ...validInput, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts input without the optional imageUrl", () => {
    const { imageUrl, ...withoutImage } = validInput;
    expect(createProductSchema.safeParse(withoutImage).success).toBe(true);
  });

  it.each(["name", "price", "category"])("rejects when required field %s is missing", (field) => {
    const clone: Record<string, unknown> = { ...validInput };
    delete clone[field];
    expect(createProductSchema.safeParse(clone).success).toBe(false);
  });
});
