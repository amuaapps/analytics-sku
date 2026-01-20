export interface EventEnvelope<T = unknown> {
  specVersion: string;
  eventName: string;
  eventVersion: number;
  schemaId: string;
  timestamp: string;
  source: EventSource;
  correlation: Correlation;
  context: EventContext;
  payload: T;
}

export interface EventSource {
  application: string;
  version?: string;
  environment?: string;
}

export interface Correlation {
  sessionId?: string;
  userId?: string;
  requestId?: string;
}

export interface EventContext {
  url?: string;
  path?: string;
  referrer?: string;
  locale?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface TrackOptions {
  sessionId?: string;
  userId?: string;
  requestId?: string;
  context?: Partial<EventContext>;
  source?: Partial<EventSource>;
}
