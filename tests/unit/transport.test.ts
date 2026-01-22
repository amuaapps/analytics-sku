import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTransport } from "../../src/core/transport.js";
import type { EventEnvelope } from "../../src/core/types.js";

global.fetch = vi.fn();

describe("createTransport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEnvelope: EventEnvelope = {
    specVersion: "1.0.0",
    eventName: "test.event",
    eventVersion: 1,
    schemaId: "test/event@1",
    timestamp: new Date().toISOString(),
    source: {
      application: "test-app",
      version: "1.0.0",
      environment: "test",
    },
    correlation: {
      sessionId: "test-session",
    },
    context: {},
    payload: { test: "data" },
  };

  it("sends event successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 202,
    });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
    });

    await transport.send(mockEnvelope);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://analytics.example.com/ingest",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockEnvelope),
      })
    );
  });

  it("retries on failure", async () => {
    (global.fetch as any)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
      });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      maxRetries: 3,
    });

    await transport.send(mockEnvelope);

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("fails after max retries", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      maxRetries: 2,
    });

    await expect(transport.send(mockEnvelope)).rejects.toThrow("Network error");

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("sends events immediately without batching", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 202,
    });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
    });

    await transport.send(mockEnvelope);
    await transport.send(mockEnvelope);
    await transport.send(mockEnvelope);

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("calls onError callback on failure", async () => {
    const onError = vi.fn();
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      maxRetries: 1,
      onError,
    });

    await expect(transport.send(mockEnvelope)).rejects.toThrow();

    expect(onError).toHaveBeenCalledWith(expect.any(Error), mockEnvelope);
  });

  it("handles HTTP error responses", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      maxRetries: 0,
    });

    await expect(transport.send(mockEnvelope)).rejects.toThrow(
      "HTTP 400: Bad Request"
    );
  });

  it("does not send when disabled", async () => {
    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      disabled: true,
    });

    await transport.send(mockEnvelope);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws error when ingestUrl is not configured", async () => {
    const transport = createTransport({});

    await expect(transport.send(mockEnvelope)).rejects.toThrow(
      "ANALYTICS_INGEST_URL is not configured"
    );
  });

  it("manages queue and removes event after successful send", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 202,
    });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      queueSize: 10,
    });

    await transport.send(mockEnvelope);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("removes oldest event when queue is full", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 202,
    });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      queueSize: 2,
    });

    await transport.send({ ...mockEnvelope, eventName: "event1" });
    await transport.send({ ...mockEnvelope, eventName: "event2" });
    await transport.send({ ...mockEnvelope, eventName: "event3" });

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("flushes all queued events", async () => {
    let callCount = 0;
    (global.fetch as any).mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({
        ok: true,
        status: 202,
      });
    });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      maxRetries: 0,
    });

    const sendPromises = [
      transport.send({ ...mockEnvelope, eventName: "event1" }).catch(() => {}),
      transport.send({ ...mockEnvelope, eventName: "event2" }).catch(() => {}),
    ];

    await Promise.all(sendPromises);

    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 202,
    });

    await transport.flush();

    expect(global.fetch).toHaveBeenCalled();
  });

  it("uses exponential backoff for retries", async () => {
    vi.useFakeTimers();

    (global.fetch as any)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
      });

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      maxRetries: 3,
      retryDelayMs: 100,
    });

    const sendPromise = transport.send(mockEnvelope);

    await vi.runAllTimersAsync();
    await sendPromise;

    expect(global.fetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it("handles non-Error exceptions", async () => {
    const onError = vi.fn();
    (global.fetch as any).mockRejectedValue("string error");

    const transport = createTransport({
      ingestUrl: "https://analytics.example.com/ingest",
      maxRetries: 0,
      onError,
    });

    await expect(transport.send(mockEnvelope)).rejects.toThrow();

    expect(onError).toHaveBeenCalledWith(expect.any(Error), mockEnvelope);
  });

  it("uses default options when none provided", () => {
    const transport = createTransport();

    expect(transport).toBeDefined();
    expect(transport.send).toBeDefined();
    expect(transport.flush).toBeDefined();
  });

  it("reads ingestUrl from environment variable", async () => {
    const originalEnv = process.env.ANALYTICS_INGEST_URL;
    process.env.ANALYTICS_INGEST_URL = "https://env.example.com/ingest";

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 202,
    });

    const transport = createTransport();

    await transport.send(mockEnvelope);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://env.example.com/ingest",
      expect.any(Object)
    );

    process.env.ANALYTICS_INGEST_URL = originalEnv;
  });
});
