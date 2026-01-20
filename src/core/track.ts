import type { EventDefinition } from "../taxonomy/types.js";
import type { EventEnvelope, TrackOptions } from "./types.js";

const SPEC_VERSION = "1.0.0";

function getContext(): {
  url?: string;
  path?: string;
  referrer?: string;
  locale?: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
} {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    locale: navigator.language,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

export function track<T>(
  eventDef: EventDefinition<T>,
  payload: T,
  options?: TrackOptions
): EventEnvelope<T> {
  const autoContext = getContext();

  const envelope: EventEnvelope<T> = {
    specVersion: SPEC_VERSION,
    eventName: eventDef.eventName,
    eventVersion: eventDef.eventVersion,
    schemaId: eventDef.schemaId,
    timestamp: new Date().toISOString(),
    source: {
      application: options?.source?.application || "unknown",
      version: options?.source?.version,
      environment: options?.source?.environment,
    },
    correlation: {
      sessionId: options?.sessionId,
      userId: options?.userId,
      requestId: options?.requestId,
    },
    context: {
      ...autoContext,
      ...options?.context,
    },
    payload,
  };

  return envelope;
}
