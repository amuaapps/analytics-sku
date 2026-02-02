/* eslint-disable */
// Auto-generated index file for schema types

export type { PaymentSubmittedEvent } from "./checkout_payment_submitted_1.js";
export type { PurchaseCompletedEvent } from "./checkout_purchase_completed_1.js";
export type { ExperimentExposedEvent } from "./web_experiment_exposed_1.js";
export type { PageViewedEvent } from "./web_page_viewed_1.js";
export type { SessionStartedEvent } from "./web_session_started_1.js";

export const schemaTypes = {
  "checkout/payment_submitted@1": "PaymentSubmittedEvent",
  "checkout/purchase_completed@1": "PurchaseCompletedEvent",
  "web/experiment_exposed@1": "ExperimentExposedEvent",
  "web/page_viewed@1": "PageViewedEvent",
  "web/session_started@1": "SessionStartedEvent",
} as const;
