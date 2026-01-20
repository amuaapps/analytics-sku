import { describe, it, expect } from "vitest";
import { validate, validateOrThrow } from "../../src/core/validation.js";

describe("validate", () => {
  describe("web.page_viewed@1", () => {
    it("validates correct payload", () => {
      const payload = {
        page: "/home",
        title: "Home Page",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("validates payload with optional fields", () => {
      const payload = {
        page: "/products",
        title: "Products",
        category: "catalog",
        properties: {
          featured: true,
        },
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(true);
    });

    it("fails when required field is missing", () => {
      const payload = {
        page: "/home",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0]?.message).toContain("required");
    });

    it("fails when field has wrong type", () => {
      const payload = {
        page: 123,
        title: "Home",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("fails when additional properties are present", () => {
      const payload = {
        page: "/home",
        title: "Home",
        invalidField: "not allowed",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("fails when field is empty string", () => {
      const payload = {
        page: "",
        title: "Home",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(false);
    });
  });

  describe("checkout.payment_submitted@1", () => {
    it("validates correct payload", () => {
      const payload = {
        orderId: "order-123",
        amount: 99.99,
        currency: "USD",
        paymentMethod: "credit_card",
      };

      const result = validate("checkout/payment_submitted@1", payload);

      expect(result.valid).toBe(true);
    });

    it("validates payload with items array", () => {
      const payload = {
        orderId: "order-456",
        amount: 149.99,
        currency: "EUR",
        paymentMethod: "paypal",
        items: [
          {
            productId: "prod-1",
            quantity: 2,
            price: 49.99,
          },
          {
            productId: "prod-2",
            quantity: 1,
            price: 50.01,
          },
        ],
      };

      const result = validate("checkout/payment_submitted@1", payload);

      expect(result.valid).toBe(true);
    });

    it("fails when amount is negative", () => {
      const payload = {
        orderId: "order-123",
        amount: -10,
        currency: "USD",
        paymentMethod: "credit_card",
      };

      const result = validate("checkout/payment_submitted@1", payload);

      expect(result.valid).toBe(false);
    });

    it("fails when currency is invalid format", () => {
      const payload = {
        orderId: "order-123",
        amount: 99.99,
        currency: "US",
        paymentMethod: "credit_card",
      };

      const result = validate("checkout/payment_submitted@1", payload);

      expect(result.valid).toBe(false);
    });

    it("fails when paymentMethod is not in enum", () => {
      const payload = {
        orderId: "order-123",
        amount: 99.99,
        currency: "USD",
        paymentMethod: "bitcoin",
      };

      const result = validate("checkout/payment_submitted@1", payload);

      expect(result.valid).toBe(false);
    });

    it("fails when item quantity is zero", () => {
      const payload = {
        orderId: "order-123",
        amount: 99.99,
        currency: "USD",
        paymentMethod: "credit_card",
        items: [
          {
            productId: "prod-1",
            quantity: 0,
            price: 99.99,
          },
        ],
      };

      const result = validate("checkout/payment_submitted@1", payload);

      expect(result.valid).toBe(false);
    });
  });

  describe("validateOrThrow", () => {
    it("does not throw for valid payload", () => {
      const payload = {
        page: "/home",
        title: "Home",
      };

      expect(() => {
        validateOrThrow("web/page_viewed@1", payload);
      }).not.toThrow();
    });

    it("throws for invalid payload", () => {
      const payload = {
        page: "/home",
      };

      expect(() => {
        validateOrThrow("web/page_viewed@1", payload);
      }).toThrow(/Validation failed/);
    });

    it("throws with descriptive error message", () => {
      const payload = {
        page: 123,
        title: "Home",
      };

      expect(() => {
        validateOrThrow("web/page_viewed@1", payload);
      }).toThrow(/web\/page_viewed@1/);
    });
  });

  describe("schema loading", () => {
    it("fails gracefully for non-existent schema", () => {
      const result = validate("nonexistent/schema@1", {});

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]?.message).toContain("Failed to load schema");
    });
  });
});
