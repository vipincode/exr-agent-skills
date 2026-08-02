# Coupons Module

> Source: `_docs/prd/PRD.md` §5.6 · Domain: `fullstack` · Phase: Later
> Status: Ready for planning
> Next step: run `module-planner` against this file.

## Purpose
Discount codes the Admin creates to run promotions.

## Scope
- Coupon codes: flat amount or percentage off the order subtotal.
- Expiry dates and single-use-per-customer enforcement.
- Admin CRUD for coupons with an active/inactive toggle.
- Code entry and validation at checkout.

## User stories
- As a Shopper, I can apply a coupon at checkout so that I pay less.
- As an Admin, I can create coupon codes so that I can run promotions.

## Functional requirements
1. A valid, unexpired code reduces the order total per its rule.
2. A code already used by this customer is rejected with a clear message.
3. Discount math happens server-side and appears on the order record.

## Dependencies
- **Needs:** auth (per-customer usage), orders (checkout integration)
- **Needed by:** —

## Edge cases & failure modes
- Code expires between entry and order placement.
- Discount larger than the subtotal.

## Acceptance criteria
- [ ] Applying a valid code visibly reduces the total; the discount is on the order record.
- [ ] Reusing a single-use code fails gracefully.

## Out of scope
- Automatic discounts, stacking multiple codes.
