import { describe, it, expect } from "vitest";
import { track, page, identify } from "../../src/core/track.js";
import type { EventDefinition } from "../../src/taxonomy/types.js";

describe("track", () => {
  it("creates track event with required fields", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const properties = { utm_source: "google" };
    const event = track(eventDef, properties, {
      sessionId: "test-session",
      source: { appId: "test-app", platform: "web", env: "test" },
    });

    expect(event.schemaVersion).toBe("1.0.0");
    expect(event.type).toBe("track");
    expect(event.name).toBe("web.session_started");
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeDefined();
    expect(event.properties).toEqual(properties);
    expect(event.context?.sessionId).toBe("test-session");
    expect(event.source.appId).toBe("test-app");
    expect(event.actor.anonymousId).toBe("test-session");
  });

  it("creates page event when type is page", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.page_viewed",
      type: "page",
      domain: "web",
    };

    const properties = { page_path: "/home" };
    const event = track(eventDef, properties, {
      sessionId: "test-session",
      source: { appId: "test-app", platform: "web", env: "test" },
    });

    expect(event.type).toBe("page");
    expect(event.name).toBe("web.page_viewed");
  });

  it("includes userId when provided", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
        userId: "user-123",
        source: { appId: "test-app", platform: "web", env: "test" },
      }
    );

    expect(event.actor.userId).toBe("user-123");
    expect(event.actor.anonymousId).toBe("test-session");
  });

  it("includes consent when provided", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
        source: { appId: "test-app", platform: "web", env: "test" },
        consent: {
          analytics: true,
          experimentation: false,
          personalization: true,
        },
      }
    );

    expect(event.consent).toBeDefined();
    expect(event.consent?.analytics).toBe(true);
    expect(event.consent?.experimentation).toBe(false);
    expect(event.consent?.personalization).toBe(true);
  });

  it("throws error when sessionId is missing", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    expect(() => {
      track(eventDef, {}, {
        source: { appId: "test-app", platform: "web", env: "test" },
      } as any);
    }).toThrow("sessionId is required");
  });

  it("merges custom context with auto context", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
        source: { appId: "test-app", platform: "web", env: "test" },
        context: { locale: "fr-CA" },
      }
    );

    expect(event.context?.locale).toBe("fr-CA");
    expect(event.context?.sessionId).toBe("test-session");
  });
});

describe("page", () => {
  it("creates page event", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.page_viewed",
      type: "page",
      domain: "web",
    };

    const properties = { page_path: "/products" };
    const event = page(eventDef, properties, {
      sessionId: "test-session",
      source: { appId: "test-app", platform: "web", env: "test" },
    });

    expect(event.type).toBe("page");
    expect(event.name).toBe("web.page_viewed");
    expect(event.properties).toEqual(properties);
  });
});

describe("identify", () => {
  it("creates identify event", () => {
    const traits = { email: "user@example.com", name: "Test User" };
    const event = identify(traits, {
      sessionId: "test-session",
      userId: "user-123",
      source: { appId: "test-app", platform: "web", env: "test" },
    });

    expect(event.type).toBe("identify");
    expect(event.eventId).toBeDefined();
    expect(event.traits).toEqual(traits);
    expect(event.actor.userId).toBe("user-123");
  });

  it("throws error when sessionId is missing", () => {
    expect(() => {
      identify({}, {
        userId: "user-123",
        source: { appId: "test-app", platform: "web", env: "test" },
      } as any);
    }).toThrow("sessionId is required");
  });

  it("includes consent when provided", () => {
    const event = identify(
      { email: "user@example.com" },
      {
        sessionId: "test-session",
        userId: "user-123",
        source: { appId: "test-app", platform: "web", env: "test" },
        consent: {
          analytics: true,
          experimentation: true,
          personalization: false,
        },
      }
    );

    expect(event.consent).toBeDefined();
    expect(event.consent?.analytics).toBe(true);
    expect(event.consent?.experimentation).toBe(true);
    expect(event.consent?.personalization).toBe(false);
  });
});

describe("edge cases and fallbacks", () => {
  it("generates valid UUID format", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
        source: { appId: "test-app", platform: "web", env: "test" },
      }
    );

    expect(event.eventId).toBeDefined();
    expect(event.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("handles missing anonymousId by using sessionId", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
        source: { appId: "test-app", platform: "web", env: "test" },
      }
    );

    expect(event.actor.anonymousId).toBe("test-session");
  });

  it("uses provided anonymousId over sessionId", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
        anonymousId: "custom-anon-id",
        source: { appId: "test-app", platform: "web", env: "test" },
      }
    );

    expect(event.actor.anonymousId).toBe("custom-anon-id");
  });

  it("sets userId to null when not provided", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
        source: { appId: "test-app", platform: "web", env: "test" },
      }
    );

    expect(event.actor.userId).toBeNull();
  });

  it("uses default source values when not provided", () => {
    const eventDef: EventDefinition<Record<string, unknown>> = {
      name: "web.session_started",
      type: "track",
      domain: "web",
    };

    const event = track(
      eventDef,
      {},
      {
        sessionId: "test-session",
      }
    );

    expect(event.source.appId).toBe("unknown");
    expect(event.source.platform).toBe("web");
    expect(event.source.env).toBe("production");
  });
});
