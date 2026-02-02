import type { EventDefinition } from "../taxonomy/types.js";
import type {
  TrackEvent,
  PageEvent,
  IdentifyEvent,
  TrackOptions,
  Context,
} from "./types.js";

function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getDeviceClass(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") {
    return "desktop";
  }
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getReferrerHost(referrer: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return undefined;
  }
}

function getPrivacyMinimizedContext(): Context {
  if (typeof window === "undefined") {
    return {};
  }

  const context: Context = {
    locale: navigator.language,
    page: {
      path: window.location.pathname,
      title: document.title || undefined,
      referrer: getReferrerHost(document.referrer),
    },
    device: {
      device_class: getDeviceClass(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    },
  };

  try {
    context.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Ignore if timezone is not available
  }

  return context;
}

export function track<T extends Record<string, unknown>>(
  eventDef: EventDefinition<T>,
  properties: T,
  options: TrackOptions
): TrackEvent | PageEvent {
  const autoContext = getPrivacyMinimizedContext();
  const sessionId = options.sessionId;

  if (!sessionId) {
    throw new Error("sessionId is required for tracking events");
  }

  const source = {
    appId: options.source?.appId || "unknown",
    platform: options.source?.platform || "web",
    env: options.source?.env || "production",
    appVersion: options.source?.appVersion,
  };

  const actor = {
    userId: options.userId ?? null,
    anonymousId: options.anonymousId ?? sessionId,
  };

  if (!actor.userId && !actor.anonymousId) {
    throw new Error("Either userId or anonymousId must be provided");
  }

  const context: Context = {
    ...autoContext,
    ...options.context,
    sessionId,
  };

  const eventType = eventDef.type === "page" ? "page" : "track";

  const event: TrackEvent | PageEvent = {
    schemaVersion: "1.0.0",
    eventId: generateEventId(),
    type: eventType,
    name: eventDef.name,
    occurredAt: new Date().toISOString(),
    source,
    actor,
    context,
    properties,
  } as TrackEvent | PageEvent;

  if (options.consent) {
    event.consent = {
      analytics: options.consent.analytics ?? true,
      experimentation: options.consent.experimentation ?? false,
      personalization: options.consent.personalization ?? false,
      timestamp: new Date().toISOString(),
    };
  }

  return event;
}

export function page<T extends Record<string, unknown>>(
  eventDef: EventDefinition<T>,
  properties: T,
  options: TrackOptions
): PageEvent {
  const trackEvent = track(eventDef, properties, options);
  return {
    ...trackEvent,
    type: "page",
  } as PageEvent;
}

export function identify(
  traits: Record<string, unknown>,
  options: TrackOptions
): IdentifyEvent {
  const autoContext = getPrivacyMinimizedContext();
  const sessionId = options.sessionId;

  if (!sessionId) {
    throw new Error("sessionId is required for identify events");
  }

  const source = {
    appId: options.source?.appId || "unknown",
    platform: options.source?.platform || "web",
    env: options.source?.env || "production",
    appVersion: options.source?.appVersion,
  };

  const actor = {
    userId: options.userId ?? null,
    anonymousId: options.anonymousId ?? sessionId,
  };

  if (!actor.userId && !actor.anonymousId) {
    throw new Error("Either userId or anonymousId must be provided");
  }

  const context: Context = {
    ...autoContext,
    ...options.context,
    sessionId,
  };

  const event: IdentifyEvent = {
    schemaVersion: "1.0.0",
    eventId: generateEventId(),
    type: "identify",
    occurredAt: new Date().toISOString(),
    source,
    actor,
    context,
    traits,
  };

  if (options.consent) {
    event.consent = {
      analytics: options.consent.analytics ?? true,
      experimentation: options.consent.experimentation ?? false,
      personalization: options.consent.personalization ?? false,
      timestamp: new Date().toISOString(),
    };
  }

  return event;
}
