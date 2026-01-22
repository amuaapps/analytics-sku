import { describe, it, expect } from "vitest";
import * as coreIndex from "../../src/core/index.js";
import * as taxonomyIndex from "../../src/taxonomy/index.js";
import * as mainIndex from "../../src/index.js";

describe("core/index.ts exports", () => {
  it("exports track function", () => {
    expect(coreIndex.track).toBeDefined();
    expect(typeof coreIndex.track).toBe("function");
  });

  it("exports createTransport function", () => {
    expect(coreIndex.createTransport).toBeDefined();
    expect(typeof coreIndex.createTransport).toBe("function");
  });

  it("exports validate function", () => {
    expect(coreIndex.validate).toBeDefined();
    expect(typeof coreIndex.validate).toBe("function");
  });

  it("exports validateOrThrow function", () => {
    expect(coreIndex.validateOrThrow).toBeDefined();
    expect(typeof coreIndex.validateOrThrow).toBe("function");
  });
});

describe("taxonomy/index.ts exports", () => {
  it("exports eventRegistry", () => {
    expect(taxonomyIndex.eventRegistry).toBeDefined();
    expect(typeof taxonomyIndex.eventRegistry).toBe("object");
  });

  it("eventRegistry contains expected events", () => {
    expect(taxonomyIndex.eventRegistry["web.page_viewed@1"]).toBeDefined();
    expect(
      taxonomyIndex.eventRegistry["checkout.payment_submitted@1"]
    ).toBeDefined();
  });
});

describe("main index.ts exports", () => {
  it("re-exports track from core", () => {
    expect(mainIndex.track).toBeDefined();
    expect(mainIndex.track).toBe(coreIndex.track);
  });

  it("re-exports createTransport from core", () => {
    expect(mainIndex.createTransport).toBeDefined();
    expect(mainIndex.createTransport).toBe(coreIndex.createTransport);
  });

  it("re-exports validate from core", () => {
    expect(mainIndex.validate).toBeDefined();
    expect(mainIndex.validate).toBe(coreIndex.validate);
  });

  it("re-exports validateOrThrow from core", () => {
    expect(mainIndex.validateOrThrow).toBeDefined();
    expect(mainIndex.validateOrThrow).toBe(coreIndex.validateOrThrow);
  });

  it("re-exports eventRegistry from taxonomy", () => {
    expect(mainIndex.eventRegistry).toBeDefined();
    expect(mainIndex.eventRegistry).toBe(taxonomyIndex.eventRegistry);
  });

  it("provides complete public API", () => {
    const exports = Object.keys(mainIndex);
    expect(exports).toContain("track");
    expect(exports).toContain("createTransport");
    expect(exports).toContain("validate");
    expect(exports).toContain("validateOrThrow");
    expect(exports).toContain("eventRegistry");
  });
});
