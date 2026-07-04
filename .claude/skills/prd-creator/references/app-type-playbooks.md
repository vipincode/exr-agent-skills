# App-Type Playbooks

Pattern knowledge for the Step 2 keep-or-reject pass and the Step 3 questions. Read the
**Universal baseline** always, plus the playbook(s) nearest to the user's app type. Hybrid
apps read multiple (a recipe community = blog/CMS + social; a course platform = SaaS +
e-commerce). If no playbook fits, the universal baseline plus your own judgment is enough —
these are calibration, not a cage.

Each playbook has three parts:
- **Standard modules** — what apps of this type ship with; suggest the ones the user didn't mention.
- **Production rules** — the cross-cutting baseline; feeds PRD §6.
- **Decision questions** — the product choices that reshape the PRD; feeds Step 3 (ask only unanswered ones).

## Table of contents
1. [Universal baseline (every production app)](#universal-baseline)
2. [E-commerce](#e-commerce)
3. [Blog / CMS / Content site](#blog--cms)
4. [SaaS / Subscription product](#saas)
5. [Marketplace (multi-vendor)](#marketplace)
6. [Social / Community](#social--community)
7. [Booking / Scheduling](#booking--scheduling)
8. [Internal tool / Admin dashboard](#internal-tool--dashboard)

---

## Universal baseline

Every production app, regardless of type. Suggest whichever of these the user's idea implies
but their message didn't cover.

**Standard modules**
- **Auth & accounts** — registration, login, password reset, profile management, session/token handling. Nearly always the first module built; almost everything depends on it.
- **Admin panel** — the owner needs to manage users and content without touching the database. Solo founders forget this one most often.
- **Notifications** — at minimum transactional email (welcome, password reset, receipts). In-app/push only if the product needs it.

**Production rules** (PRD §6 candidates)
- Role-based access: even "just users" apps have at least user + admin.
- All input validated; all errors returned in a consistent, user-readable shape.
- Legal pages: privacy policy, terms of service; cookie consent where applicable.
- Responsive UI (mobile-first if the audience skews mobile), and basic accessibility.
- Basic analytics/observability: know what users do and when the app breaks.
- Data lifecycle: account deletion, and what happens to the user's content when they go.

**Decision questions**
- Who are the user types/roles, and can one person hold multiple?
- Registration: open, invite-only, or admin-created?
- Social login (Google etc.) or email/password only?
- Rough scale expectation — hobby, hundreds, or "we hope it explodes"? (Changes MVP scope, not stack.)

---

## E-commerce

**Standard modules**
- **Product catalog** — products, categories, variants (size/color), images, search & filters, inventory/stock.
- **Cart** — persistent across sessions; guest cart that merges on login.
- **Checkout & orders** — address, shipping choice, order placement, order history, status tracking (placed → shipped → delivered), cancellation.
- **Payments** — gateway integration, payment status handling, refunds. Suggest keeping it a separate module from orders — different failure modes, different compliance surface.
- **Reviews & ratings** — usually MVP-worthy for trust; verified-purchase gating is the standard rule.
- **Discounts/coupons** — commonly requested v1.5; suggest as *Later* unless the user insists.
- **Wishlist** — cheap and expected; *Later* is fine.
- **Admin: store management** — product CRUD, order management, stock alerts, basic sales dashboard.

**Production rules**
- Never trust client-side prices — totals computed server-side.
- Stock checked at checkout, not just at add-to-cart.
- Orders immutable once placed; changes happen via cancellation/refund flows.
- Payment webhooks are the source of truth for payment status, not the redirect.
- Emails: order confirmation, shipping update, refund confirmation.

**Decision questions**
- Guest checkout or account required?
- Single-vendor (you sell) or multi-vendor (→ read the Marketplace playbook instead)?
- Physical goods (shipping, addresses) or digital (delivery by download/email)?
- Payment region/gateway preference, and single or multi currency?
- Product variants needed in v1?

---

## Blog / CMS

**Standard modules**
- **Content authoring** — posts with rich text/markdown, drafts, scheduled publishing, cover images, edit history if multi-author.
- **Taxonomy** — categories and/or tags; decide which (or both) up front.
- **Public site** — post listing, detail pages, search, archive, RSS feed.
- **Comments** — the classic scope trap: suggest deciding early between none, third-party, or native-with-moderation. Native comments drag in auth + moderation + spam.
- **Media library** — image upload and management; grows into a real module for content-heavy sites.
- **Newsletter/subscriptions** — audience ownership; commonly *Later*.
- **Admin/editorial** — author management, content moderation, publishing workflow.

**Production rules**
- SEO is a feature, not polish: clean URLs (slugs), meta/OG tags, sitemap, canonical URLs.
- Drafts never leak: unpublished content is invisible to the public and to search engines.
- Published URLs are permanent — slug changes redirect, not 404.
- Content renders safely (sanitized rich text — XSS via post body is the classic CMS hole).

**Decision questions**
- Single author or multi-author? If multi: is there an editorial workflow (draft → review → publish) or does everyone publish directly?
- Comments: none / third-party / native? If native, who moderates?
- Is the audience anonymous readers, or do readers have accounts too (bookmarks, reactions)?
- Monetization: none, ads, memberships/paywall? (Paywall reshapes the whole PRD.)

---

## SaaS

**Standard modules**
- **The core product** — whatever the SaaS does; force clarity here first, everything else is scaffolding around it.
- **Plans & billing** — subscription tiers, trial, upgrade/downgrade, payment method management, invoices, dunning (failed-payment retries).
- **Workspace/organization & teams** — if B2B: org accounts, member invites, per-org roles. The single biggest architectural fork — ask early.
- **Feature gating** — plan limits enforced server-side (seats, usage, features).
- **Onboarding** — first-run experience; empty states that teach.
- **Admin: operations** — customer lookup, plan overrides, usage metrics, churn view.

**Production rules**
- Gating enforced on the server; the UI hiding a button is not enforcement.
- Billing webhooks drive entitlement state; handle grace periods for failed payments.
- Data isolation between tenants is absolute and tested.
- Cancellation is self-serve; export-your-data is the trust baseline.

**Decision questions**
- B2C (individual accounts) or B2B (team workspaces)? This is the fork that matters most.
- Free tier / trial / paid-only?
- What exactly does the plan limit — seats, usage volume, features?
- Is there a public marketing site in scope, or product only?

---

## Marketplace

Everything in **E-commerce**, plus the two-sided dynamics:

**Standard modules**
- **Vendor accounts & onboarding** — vendor registration, approval/KYC flow, vendor profile/storefront.
- **Vendor dashboard** — their products, their orders, their earnings.
- **Commission & payouts** — the platform's cut, payout schedule, statements. Suggest keeping this separate from customer payments.
- **Order splitting** — one customer cart, multiple vendors → per-vendor sub-orders with independent statuses.
- **Disputes & platform moderation** — customer↔vendor conflict lands on the platform; someone must have tools to resolve it.

**Production rules**
- Vendors see only their own data — isolation is a security rule, not a filter default.
- Vendor approval gates listing: unapproved vendors can't sell.
- Money math (commission, refunds across split orders) is defined in the PRD, not improvised later.

**Decision questions**
- Who sets prices and handles shipping — vendor or platform?
- Vendor approval: automatic or reviewed?
- Commission model: flat fee, percentage, tiered?
- Can customers buy from multiple vendors in one checkout?

---

## Social / Community

**Standard modules**
- **Profiles** — public identity, avatars, bios.
- **Content & feed** — posts (define the atom: text? images? links?), a feed (chronological is a fine MVP; algorithmic is a *Later* at best), detail pages.
- **Interactions** — likes/reactions, comments, shares/reposts — pick the minimal set.
- **Follow/connections** — follow (asymmetric) vs friend (symmetric); changes the whole privacy model.
- **Moderation & safety** — report content, block users, admin review queue. Not optional for anything with user-generated content; suggest it firmly.
- **Notifications** — in-app at minimum; the engagement engine.

**Production rules**
- Report/block exist from day one on every content type and on users.
- Privacy model decided up front: public, followers-only, private accounts?
- Deleted content is gone from all surfaces (feeds, notifications, search).
- Rate limiting on content creation — spam arrives with user #10.

**Decision questions**
- What is the atomic content unit, exactly?
- Follow model: asymmetric, symmetric, or none (open forum)?
- Public-readable or login-walled?
- Who moderates, with what tools, at MVP scale?

---

## Booking / Scheduling

**Standard modules**
- **Inventory of bookables** — services/rooms/tables/slots, with capacity and pricing.
- **Availability engine** — schedules, working hours, blackout dates, buffer times. The hidden-complexity module; keep its scope explicit.
- **Booking flow** — browse → pick slot → confirm; hold-then-confirm if payment is involved.
- **Manage bookings** — customer reschedule/cancel (with policy), provider calendar view.
- **Reminders** — email/SMS before the appointment; the no-show killer.
- **Payments/deposits** — if prepayment: deposits, cancellation fees, refund policy.

**Production rules**
- Double-booking is impossible by design, stated as a requirement.
- Cancellation/reschedule policy (how late, what penalty) is a PRD decision, not a support improvisation.
- Time zones handled explicitly if either side can be remote.

**Decision questions**
- Who/what is being booked — one provider, many staff, physical resources?
- Fixed slots or free-form durations?
- Prepayment/deposit or pay-at-service?
- Walk-in/manual bookings by the owner alongside online ones?

---

## Internal tool / Dashboard

**Standard modules**
- **Auth via the org's identity** — SSO/Google Workspace beats a new password system for internal tools.
- **The core views** — data tables (filter/sort/search/export) and detail pages; define the top 3–5 jobs the tool does.
- **Audit log** — who changed what, when. Internal tools mutate real data; this earns its MVP slot.
- **Permissions** — viewer vs operator vs admin at minimum.

**Production rules**
- Every mutation attributable (audit trail) and, where feasible, reversible.
- Destructive actions confirm and are permission-gated.
- Exports (CSV) exist for whatever people currently do in spreadsheets.

**Decision questions**
- Who are the users, and what do they do today without the tool?
- Read-mostly (reporting) or write-heavy (operations)?
- What's the source of the data — this tool's own DB, or another system's API?
- How fresh must the data be — live, or synced daily?
