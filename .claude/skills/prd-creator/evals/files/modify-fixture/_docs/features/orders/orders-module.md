# Orders & Checkout Module

> Source: `_docs/prd/PRD.md` §5.4 · Domain: `fullstack` · Phase: MVP
> Status: Ready for planning
> Next step: run `module-planner` against this file.

## Purpose
Turn a cart into a delivered order, with status the customer can follow.

## Scope
- Checkout: delivery address, delivery option, order review, place order.
- Order history and detail pages for Shoppers.
- Status flow: placed → shipped → delivered; Admin updates statuses.
- Customer cancellation while status is "placed".
- Coupon code entry at checkout (validation rules live in the coupons module).

## User stories
- As a Shopper, I can place an order and track its status so that I know when my plant arrives.
- As a Shopper, I can cancel an unshipped order so that I'm not charged for a mistake.

## Functional requirements
1. Checkout requires a valid delivery address and recomputes all totals server-side.
2. Stock is verified at order placement; insufficient stock blocks the order with a clear message.
3. An order, once placed, is immutable; changes happen via cancellation.
4. Cancellation of a paid order triggers a refund (payments module).

## Dependencies
- **Needs:** auth (addresses, identity), cart (line items), coupons (code validation at checkout)
- **Needed by:** payments, admin

## Edge cases & failure modes
- Stock ran out between cart and checkout.
- Payment succeeded but order confirmation failed — must reconcile via webhook.

## Acceptance criteria
- [ ] A Shopper can complete checkout and immediately see the order in history.
- [ ] Order status changes made by Admin are visible to the Shopper.
- [ ] Cancelling a "placed" paid order results in a refund record.

## Out of scope
- Returns/exchanges (Later).
- Partial shipments.
