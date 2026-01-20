import { describe, it, expect } from "vitest";
import { track } from "../../src/core/track.js";
import type { EventDefinition } from "../../src/taxonomy/types.js";

describe("track", () => {
  it("creates event envelope with required fields", () => {
    const eventDef: EventDefinition<{ page: string }> = {
      eventName: "web.page_viewed",
      eventVersion: 1,
      schemaId: "web/page_viewed@1",
      domain: "web",
    };

    const payload = { page: "/home" };
    const envelope = track(eventDef, payload, {
      sessionId: "test-session",
      source: { application: "test-app" },
    });

    expect(envelope.specVersion).toBe("1.0.0");
    expect(envelope.eventName).toBe("web.page_viewed");
    expect(envelope.eventVersion).toBe(1);
    expect(envelope.schemaId).toBe("web/page_viewed@1");
    expect(envelope.payload).toEqual(payload);
    expect(envelope.correlation.sessionId).toBe("test-session");
    expect(envelope.source.application).toBe("test-app");
    expect(envelope.timestamp).toBeDefined();
  });

  it("includes context when available", () => {
    const eventDef: EventDefinition = {
      eventName: "test.event",
      eventVersion: 1,
      schemaId: "test/event@1",
      domain: "test",
    };

    const envelope = track(eventDef, {}, {
      context: { locale: "en-US" },
    });

    expect(envelope.context.locale).toBe("en-US");
  });
});
