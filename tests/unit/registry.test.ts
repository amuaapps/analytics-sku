import { describe, it, expect } from "vitest";
import { eventRegistry } from "../../src/taxonomy/registry.js";

describe("eventRegistry", () => {
  it("contains web.page_viewed@1 event", () => {
    const event = eventRegistry["web.page_viewed@1"];

    expect(event).toBeDefined();
    expect(event.name).toBe("web.page_viewed");
    expect(event.type).toBe("page");
    expect(event.domain).toBe("web");
  });

  it("contains web.session_started@1 event", () => {
    const event = eventRegistry["web.session_started@1"];

    expect(event).toBeDefined();
    expect(event.name).toBe("web.session_started");
    expect(event.type).toBe("track");
    expect(event.domain).toBe("web");
  });

  it("contains web.experiment_exposed@1 event", () => {
    const event = eventRegistry["web.experiment_exposed@1"];

    expect(event).toBeDefined();
    expect(event.name).toBe("web.experiment_exposed");
    expect(event.type).toBe("track");
    expect(event.domain).toBe("web");
  });

  it("contains checkout.payment_submitted@1 event", () => {
    const event = eventRegistry["checkout.payment_submitted@1"];

    expect(event).toBeDefined();
    expect(event.name).toBe("checkout.payment_submitted");
    expect(event.type).toBe("track");
    expect(event.domain).toBe("checkout");
  });

  it("contains checkout.purchase_completed@1 event", () => {
    const event = eventRegistry["checkout.purchase_completed@1"];

    expect(event).toBeDefined();
    expect(event.name).toBe("checkout.purchase_completed");
    expect(event.type).toBe("track");
    expect(event.domain).toBe("checkout");
  });

  it("has correct number of registered events", () => {
    const eventKeys = Object.keys(eventRegistry);
    expect(eventKeys).toHaveLength(5);
  });

  it("event definitions have required properties", () => {
    const pageViewedEvent = eventRegistry["web.page_viewed@1"];
    const paymentEvent = eventRegistry["checkout.payment_submitted@1"];

    expect(pageViewedEvent).toHaveProperty("name");
    expect(pageViewedEvent).toHaveProperty("type");
    expect(pageViewedEvent).toHaveProperty("domain");

    expect(paymentEvent).toHaveProperty("name");
    expect(paymentEvent).toHaveProperty("type");
    expect(paymentEvent).toHaveProperty("domain");
  });
});
