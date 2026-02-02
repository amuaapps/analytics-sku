import type { EventDefinition } from "./types.js";

export const eventRegistry = {
  "web.page_viewed@1": {
    name: "web.page_viewed",
    type: "page",
    domain: "web",
  } as EventDefinition<Record<string, unknown>>,

  "web.session_started@1": {
    name: "web.session_started",
    type: "track",
    domain: "web",
  } as EventDefinition<Record<string, unknown>>,

  "web.experiment_exposed@1": {
    name: "web.experiment_exposed",
    type: "track",
    domain: "web",
  } as EventDefinition<Record<string, unknown>>,

  "checkout.payment_submitted@1": {
    name: "checkout.payment_submitted",
    type: "track",
    domain: "checkout",
  } as EventDefinition<Record<string, unknown>>,

  "checkout.purchase_completed@1": {
    name: "checkout.purchase_completed",
    type: "track",
    domain: "checkout",
  } as EventDefinition<Record<string, unknown>>,
} as const;
