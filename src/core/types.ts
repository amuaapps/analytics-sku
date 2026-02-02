export const SCHEMA_VERSION = "1.0.0";

export interface Source {
  appId: string;
  platform: string;
  env: string;
  appVersion?: string;
}

export interface Actor {
  userId?: string | null;
  anonymousId?: string | null;
}

export interface PageContext {
  path?: string;
  title?: string;
  referrer?: string;
}

export interface DeviceContext {
  device_class?: "mobile" | "tablet" | "desktop";
  viewport_width?: number;
  viewport_height?: number;
  [key: string]: unknown;
}

export interface Context {
  sessionId?: string;
  locale?: string;
  timezone?: string;
  page?: PageContext;
  device?: DeviceContext;
  [key: string]: unknown;
}

export interface Consent {
  analytics: boolean;
  experimentation: boolean;
  personalization: boolean;
  timestamp: string;
}

export interface BaseIngestEvent {
  schemaVersion: string;
  eventId: string;
  occurredAt: string;
  source: Source;
  actor: Actor;
  context?: Context;
  consent?: Consent;
}

export interface TrackEvent extends BaseIngestEvent {
  type: "track";
  name: string;
  properties?: Record<string, unknown>;
}

export interface PageEvent extends BaseIngestEvent {
  type: "page";
  name: string;
  properties?: Record<string, unknown>;
}

export interface IdentifyEvent extends BaseIngestEvent {
  type: "identify";
  traits?: Record<string, unknown>;
}

export type IngestEvent = TrackEvent | PageEvent | IdentifyEvent;

export interface IngestRequestEnvelope {
  schemaVersion: string;
  sentAt?: string;
  events: IngestEvent[];
}

export interface TrackOptions {
  sessionId?: string;
  userId?: string | null;
  anonymousId?: string | null;
  source?: Partial<Source>;
  context?: Partial<Context>;
  consent?: {
    analytics?: boolean;
    experimentation?: boolean;
    personalization?: boolean;
  };
}
