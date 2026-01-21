import type { EventEnvelope } from "./types.js";

export interface TransportOptions {
  ingestUrl?: string;
  disabled?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  queueSize?: number;
  onError?: (error: Error, event: EventEnvelope) => void;
}

export interface Transport {
  send: (event: EventEnvelope) => Promise<void>;
  flush: () => Promise<void>;
}

export function createTransport(options: TransportOptions = {}): Transport {
  const {
    ingestUrl = process.env.ANALYTICS_INGEST_URL,
    disabled = false,
    maxRetries = 3,
    retryDelayMs = 1000,
    queueSize = 100,
    onError,
  } = options;

  const queue: EventEnvelope[] = [];

  async function sendWithRetry(
    event: EventEnvelope,
    attempt = 0
  ): Promise<void> {
    if (disabled) {
      return;
    }

    if (!ingestUrl) {
      throw new Error("ANALYTICS_INGEST_URL is not configured");
    }

    try {
      const response = await fetch(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelayMs * Math.pow(2, attempt))
        );
        return sendWithRetry(event, attempt + 1);
      }

      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err, event);
      }
      throw err;
    }
  }

  return {
    async send(event: EventEnvelope): Promise<void> {
      if (queue.length >= queueSize) {
        queue.shift();
      }

      queue.push(event);

      await sendWithRetry(event);

      const index = queue.indexOf(event);
      if (index > -1) {
        queue.splice(index, 1);
      }
    },

    async flush(): Promise<void> {
      const events = [...queue];
      queue.length = 0;

      await Promise.all(events.map((event) => sendWithRetry(event)));
    },
  };
}
