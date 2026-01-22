import { describe, it, expect } from "vitest";
import { eventRegistry } from "../../src/taxonomy/registry.js";

describe("eventRegistry", () => {
  it("contains web.page_viewed@1 event", () => {
    const event = eventRegistry["web.page_viewed@1"];

    expect(event).toBeDefined();
    expect(event.eventName).toBe("web.page_viewed");
    expect(event.eventVersion).toBe(1);
    expect(event.schemaId).toBe("web/page_viewed@1");
    expect(event.domain).toBe("web");
  });

  it("contains checkout.payment_submitted@1 event", () => {
    const event = eventRegistry["checkout.payment_submitted@1"];

    expect(event).toBeDefined();
    expect(event.eventName).toBe("checkout.payment_submitted");
    expect(event.eventVersion).toBe(1);
    expect(event.schemaId).toBe("checkout/payment_submitted@1");
    expect(event.domain).toBe("checkout");
  });

  it("has correct number of registered events", () => {
    const eventKeys = Object.keys(eventRegistry);
    expect(eventKeys).toHaveLength(2);
  });

  it("event definitions are type-safe", () => {
    const pageViewedEvent = eventRegistry["web.page_viewed@1"];
    const paymentEvent = eventRegistry["checkout.payment_submitted@1"];

    expect(pageViewedEvent).toHaveProperty("eventName");
    expect(pageViewedEvent).toHaveProperty("eventVersion");
    expect(pageViewedEvent).toHaveProperty("schemaId");
    expect(pageViewedEvent).toHaveProperty("domain");

    expect(paymentEvent).toHaveProperty("eventName");
    expect(paymentEvent).toHaveProperty("eventVersion");
    expect(paymentEvent).toHaveProperty("schemaId");
    expect(paymentEvent).toHaveProperty("domain");
  });
});
