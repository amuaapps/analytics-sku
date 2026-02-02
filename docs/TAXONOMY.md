# Analytics Taxonomy & Event Catalog (Microfrontends)
Version: 2.0.0

## Purpose
We run multiple React microfrontends (MFE) mounted in a shell and send analytics events to a central analytics ingestion service. Teams can implement tracking independently, but **must** comply with a shared taxonomy and validation rules.

This document defines the event taxonomy, naming conventions, envelope requirements, and domain ownership for analytics events.

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
- `web.session_started`
- `web.experiment_exposed`

### Rules
- **lowercase only**
- **snake_case** for each segment
- dot (`.`) namespaces allowed
- `domain`: one of the allowed domain keys (see below)
- `object`: noun describing the thing being acted on (flow, form, item, offer, session, user, etc.)
- `action`: past tense verb (`viewed`, `started`, `submitted`, `succeeded`, `failed`, `updated`, `clicked`, `confirmed`)
- optional `<detail>`: a stable qualifier (e.g., `step1`, `otp`, `applepay`, `error_timeout`) — avoid free-text

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

## 3) Ingestion Contract (Centrally Enforced)

Events are sent to ingestion as a **batch envelope** containing **event envelopes**.

### 3.1 Batch envelope (HTTP request body)

```json
{
  "schemaVersion": "1.0.0",
  "sentAt": "2026-02-02T10:15:23.456Z",
  "events": [ /* IngestEvent[] */ ]
}
```

- `schemaVersion`: **must** be `"1.0.0"`
- `sentAt`: optional ISO 8601 timestamp for when the batch was sent
- `events`: array of event envelopes

### 3.2 Event envelope (per event)

#### Track / Page events

```json
{
  "schemaVersion": "1.0.0",
  "eventId": "uuid-v4",
  "type": "track",
  "name": "web.page_viewed",
  "occurredAt": "2026-02-02T10:15:23.456Z",

  "source": {
    "appId": "wv360-web",
    "platform": "web",
    "env": "prod",
    "appVersion": "1.32.0"
  },

  "actor": {
    "userId": null,
    "anonymousId": "ephemeral-session-or-anon-id"
  },

  "context": {
    "sessionId": "ephemeral-session-id",
    "locale": "en-CA",
    "timezone": "America/Toronto",
    "page": {
      "path": "/donate",
      "title": "Donate",
      "referrer": "google.com"
    },
    "device": {
      "device_class": "desktop",
      "viewport_width": 1440,
      "viewport_height": 900
    }
  },

  "consent": {
    "analytics": true,
    "experimentation": false,
    "personalization": false,
    "timestamp": "2026-02-02T10:15:23.456Z"
  },

  "properties": { }
}
```

#### Identify events

```json
{
  "schemaVersion": "1.0.0",
  "eventId": "uuid-v4",
  "type": "identify",
  "occurredAt": "2026-02-02T10:15:23.456Z",

  "source": { "appId": "wv360-web", "platform": "web", "env": "prod" },

  "actor": {
    "userId": "internal_user_id",
    "anonymousId": "ephemeral-session-or-anon-id"
  },

  "context": { "sessionId": "ephemeral-session-id" },

  "consent": {
    "analytics": true,
    "experimentation": false,
    "personalization": true,
    "timestamp": "2026-02-02T10:15:23.456Z"
  },

  "traits": { }
}
```

### 3.3 Required fields (minimum)

**Batch**
- `schemaVersion`
- `events[]`

**Per event**
- `schemaVersion`
- `eventId` (UUID)
- `type` (`track` | `page` | `identify`)
- `occurredAt` (ISO 8601)
- `source.appId`, `source.platform`, `source.env`
- `actor.userId` OR `actor.anonymousId` (at least one must be present)

**For session stitching (recommended / web)**
- `context.sessionId` (required to connect events within a session)

### 3.4 Field rules & safety

**Property / trait keys**
- must be lowercase snake_case (dot namespaces allowed)
- must not start with `_`

**Web context collection defaults (privacy-minimized)**
- `context.page.path` (no querystring)
- `context.page.referrer` **host only** (e.g., `google.com`)
- do **not** include `context.page.url` by default
- do **not** include `context.userAgent` by default
- include only coarse device hints (e.g., `device_class`, viewport)

---

## 4) What’s Defined Centrally vs Domain-Owned

### Defined in the shared analytics package (CENTRAL)

**a) Ingestion contract + envelope**
- batch and event envelope types
- context collection defaults (privacy-minimized)
- consent fields and defaults
- ID generation rules (`eventId`, `sessionId`)

**b) Governance & tooling**
- allowed domains list (incl. reserved `web.*`)
- TypeScript-first API (no free-form event strings)
- shared validation helpers (envelope + property-key rules)
- lint rules (e.g., forbid `track("some.string")`)

**c) Central domain (`web.*`)**
- canonical `web.*` events and their recommended properties

### Owned by each domain team
- the **catalog** of events within their domain
- the **properties** (payload) they send for those events
- stable enums (step names, failure reasons, offer types, etc.)

**Non-negotiable:** Domain teams cannot change the envelope, reserved domains, or central `web.*` definitions.

---

## 5) Event Catalog (Canonical Events)

### 5.1 `web.*` (CENTRAL)
- `web.session_started` (captures attribution once per session)
- `web.page_viewed` (SPA route change)
- `web.link_clicked`
- `web.cta_clicked` (use when it’s a primary CTA)
- `web.form_started`
- `web.form_submitted`
- `web.form_validation_failed`
- `web.error_shown`
- `web.experiment_exposed` (A/B test exposure event)

### 5.2 `campaign.*`
- `campaign.landing_viewed`
- `campaign.cta_clicked`
- `campaign.section_viewed` (optional)
- `campaign.asset_downloaded` (pdf, etc.)
- `campaign.form_started` (if campaign-specific)
- `campaign.form_submitted`
- `campaign.conversion_completed` (domain-defined “conversion”)

### 5.3 `signup.*`
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
- `checkout.purchase_completed`
- `checkout.promo_applied` (if applicable)

### 5.5 `profile.*`
- `profile.page_viewed`
- `profile.section_viewed`
- `profile.details_updated`
- `profile.preferences_updated`
- `profile.payment_method_updated`
- `profile.address_updated`
- `profile.notification_settings_updated`

### 5.6 `auth.*`
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

### 5.8 `crosssell.*`
- `crosssell.offer_impression`
- `crosssell.offer_viewed`
- `crosssell.offer_clicked`
- `crosssell.checkout_started`
- `crosssell.purchase_submitted`
- `crosssell.purchase_completed`
- `crosssell.purchase_failed`

### 5.9 `feed.*`
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

Prefer shared keys to reduce drift (all keys snake_case):
- `content_id`, `content_type`
- `product_id`, `product_variant_id`
- `subscription_id`
- `order_id`
- `step_name` (enum, not free-text)
- `failure_reason` (enum, not stack traces)
- `value`, `currency` (for money)

---

## 7) Versioning Policy

This ingestion contract does **not** include `eventVersion` or `schemaId`.

- **Non-breaking change**: add optional fields in `properties` only.
- **Breaking change**: change the event `name` to a new name (recommended suffix pattern: `.v2`, e.g., `web.page_viewed.v2`) and update docs + producers accordingly.
- **Deprecation**: ingestion accepts both names during an agreed window; SDK can warn.
