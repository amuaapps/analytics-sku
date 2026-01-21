import type { EventDefinition } from "./types.js";
import type {
  PageViewedEvent,
  PaymentSubmittedEvent,
} from "../generated/index.js";

export const eventRegistry = {
  "web.page_viewed@1": {
    eventName: "web.page_viewed",
    eventVersion: 1,
    schemaId: "web/page_viewed@1",
    domain: "web",
  } as EventDefinition<PageViewedEvent>,

  "checkout.payment_submitted@1": {
    eventName: "checkout.payment_submitted",
    eventVersion: 1,
    schemaId: "checkout/payment_submitted@1",
    domain: "checkout",
  } as EventDefinition<PaymentSubmittedEvent>,
} as const;
