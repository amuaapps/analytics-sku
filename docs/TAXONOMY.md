# Analytics Taxonomy & Event Catalog (Microfrontends)

## Purpose
We run multiple React microfrontends (MFE) mounted in a shell and send analytics events to a central analytics ingestion service. Teams can implement tracking independently, but **must** comply with a shared taxonomy and validation rules.

This document defines the event taxonomy, naming conventions, and domain ownership for analytics events.

## Naming Convention
---

## 1) Naming Convention

### Pattern
`<domain>.<object>_<action>[_<detail>]`

Examples:
- `checkout.flow_started`
- `auth.login_failed`
- `feed.item_impression`
- `subscription.cancel_confirmed`
- `web.page_viewed`

### Rules
- `domain`: one of the allowed domain keys (see below)
- `object`: noun describing the thing being acted on (flow, form, item, offer, session, user, etc.)
- `action`: past tense verb (`viewed`, `started`, `submitted`, `succeeded`, `failed`, `updated`, `clicked`, `confirmed`)
- optional `<detail>`: a stable qualifier (step1, otp, applepay, error_timeout) — avoid free-text.

---

## 2) Domains & Ownership

| Domain key      | Surface / Meaning                          | Owner              |
|----------------|--------------------------------------------|--------------------|
| `web`          | generic web analytics usable everywhere     | CENTRAL (package)  |
| `campaign`     | campaign landing pages, campaign CTAs       | Campaigns team     |
| `signup`       | product sign-up / onboarding flow           | Signup team        |
| `checkout`     | checkout & payment flow                     | Checkout team      |
| `profile`      | user profile & preferences                  | Profile team       |
| `auth`         | authentication: login/signup/reset          | Auth team          |
| `subscription` | subscription experience & lifecycle         | Subscriptions team |
| `crosssell`    | authenticated purchase / cross-sell flows   | Cross-sell team    |
| `feed`         | authenticated content feed interactions     | Feed team          |

---

## 3) Shared Event Envelope (Centrally Enforced)

All events MUST be sent as an envelope + payload:
- Envelope is stable and validated generically by ingestion.
- Payload is validated by schema referenced by `schemaId`.

### Required envelope fields (minimum)
- `specVersion` (e.g. "1.0")
- `eventName` (taxonomy string)
- `eventVersion` (integer)
- `schemaId` (e.g. "checkout.payment_submitted@3")
- `timestamp` (ISO 8601)
- `source.app` (microfrontend identifier)
- `source.env` (dev/stage/prod)
- `correlation.sessionId` (from shell if possible)
- `context.url` and `context.path`

---

## 4) What’s Defined Centrally vs Domain-Owned

### Defined in the shared analytics package (CENTRAL)
**a) Event envelope**
- required envelope fields and types
- context collection rules (url, referrer, locale, device hints, correlation ids)

**b) Governance & tooling**
- allowed domains list (incl. reserved `web.*`)
- TypeScript-first API (no free-form event strings)
- schema validation helpers for tests
- lint rules (e.g., forbid `track("some.string")`)

**c) Central domain (`web.*`)**
- canonical `web.*` events and their schemas/types
- shared dimensions used across domains (e.g. `contentId`, `productId` conventions if applicable)

### Owned by each domain team
- the **catalog** of events within their domain
- the **payload schema** for those events
- stable enums (step names, failure reasons, offer types, etc.)
- compatibility/versioning for their domain schemas

**Non-negotiable:** Domain teams cannot change the envelope, reserved domains, or central web events.

---

## 5) Event Catalog (Canonical Events)

This is a recommended baseline. Teams may extend within their domain, but should prefer these events first.

### 5.1 `web.*` (CENTRAL)
- `web.page_viewed`
- `web.link_clicked`
- `web.cta_clicked` (use when it’s a primary CTA)
- `web.form_started`
- `web.form_submitted`
- `web.form_validation_failed`
- `web.blog_post_viewed`
- `web.lead_signup_submitted`
- `web.error_shown`

### 5.2 `campaign.*`
- `campaign.landing_viewed`
- `campaign.cta_clicked`
- `campaign.section_viewed` (optional, if you track sections)
- `campaign.asset_downloaded` (pdf, etc.)
- `campaign.form_started` (if campaign-specific)
- `campaign.form_submitted`
- `campaign.conversion_completed` (domain-defined “conversion”)

### 5.3 `signup.*` (Product sign-up / onboarding)
- `signup.flow_started`
- `signup.step_viewed`
- `signup.step_completed`
- `signup.details_submitted`
- `signup.validation_failed`
- `signup.flow_completed`
- `signup.flow_failed`

### 5.4 `checkout.*`
- `checkout.flow_started`
- `checkout.step_viewed`
- `checkout.step_completed`
- `checkout.payment_method_selected`
- `checkout.payment_submitted`
- `checkout.payment_succeeded`
- `checkout.payment_failed`
- `checkout.order_completed`
- `checkout.promo_applied` (if applicable)

### 5.5 `profile.*` (User profile)
- `profile.page_viewed`
- `profile.section_viewed`
- `profile.details_updated`
- `profile.preferences_updated`
- `profile.payment_method_updated`
- `profile.address_updated`
- `profile.notification_settings_updated`

### 5.6 `auth.*` (Authentication)
- `auth.login_started`
- `auth.login_succeeded`
- `auth.login_failed`
- `auth.logout_completed`
- `auth.signup_started`
- `auth.signup_succeeded`
- `auth.signup_failed`
- `auth.password_reset_requested`
- `auth.password_reset_completed`
- `auth.mfa_challenge_started` (if applicable)
- `auth.mfa_challenge_succeeded`
- `auth.mfa_challenge_failed`

### 5.7 `subscription.*`
- `subscription.page_viewed`
- `subscription.plan_viewed`
- `subscription.plan_selected`
- `subscription.upgrade_started`
- `subscription.upgrade_completed`
- `subscription.downgrade_started`
- `subscription.downgrade_completed`
- `subscription.cancel_started`
- `subscription.cancel_confirmed`
- `subscription.pause_started` (if applicable)
- `subscription.pause_confirmed`

### 5.8 `crosssell.*` (Authenticated purchases)
- `crosssell.offer_impression`
- `crosssell.offer_viewed`
- `crosssell.offer_clicked`
- `crosssell.checkout_started`
- `crosssell.purchase_submitted`
- `crosssell.purchase_completed`
- `crosssell.purchase_failed`

### 5.9 `feed.*` (Content feed)
- `feed.page_viewed`
- `feed.item_impression` (rendered in viewport)
- `feed.item_viewed` (opened/expanded)
- `feed.item_clicked` (navigated away)
- `feed.item_liked`
- `feed.item_shared`
- `feed.item_saved` (bookmark)
- `feed.filter_applied`
- `feed.search_submitted`
- `feed.scroll_depth_reached` (optional; define thresholds)

---

## 6) Payload Guidelines (cross-domain conventions)
To reduce drift, prefer shared keys where possible:
- `contentId`, `contentType`
- `productId`, `productVariantId`
- `subscriptionId`
- `checkoutId` / `orderId`
- `stepName` (enum, not free-text)
- `failureReason` (enum, not stack traces)
- `value`, `currency` (for money)

---

## 7) Versioning Policy
- Non-breaking changes: add optional fields only.
- Breaking change: bump `eventVersion` and new `schemaId` (e.g. `@4`).
- Deprecation: ingestion accepts old versions for an agreed window; SDK can warn.
