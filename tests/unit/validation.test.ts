import { describe, it, expect } from "vitest";
import { validate, validateOrThrow } from "../../src/core/validation.js";

describe("validate", () => {
  describe("web.page_viewed@1", () => {
    it("validates correct payload with snake_case keys", () => {
      const payload = {
        page_path: "/home",
        page_title: "Home Page",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("validates payload with navigation object", () => {
      const payload = {
        page_path: "/products",
        page_title: "Products",
        page_category: "catalog",
        navigation: {
          from_path: "/home",
          referrer_host: "google.com",
        },
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(true);
    });

    it("validates empty payload (all fields optional)", () => {
      const payload = {};

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(true);
    });

    it("allows additional properties", () => {
      const payload = {
        page_path: "/home",
        custom_field: "allowed",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(true);
    });

    it("fails when field has wrong type", () => {
      const payload = {
        page_path: 123,
        page_title: "Home",
      };

      const result = validate("web/page_viewed@1", payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
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
        page_path: "/home",
        page_title: "Home",
      };

      expect(() => {
        validateOrThrow("web/page_viewed@1", payload);
      }).not.toThrow();
    });

    it("throws for invalid payload with wrong type", () => {
      const payload = {
        page_path: 123,
        page_title: "Home",
      };

      expect(() => {
        validateOrThrow("web/page_viewed@1", payload);
      }).toThrow(/Validation failed/);
    });

    it("throws with descriptive error message", () => {
      const payload = {
        page_path: 123,
        page_title: "Home",
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
