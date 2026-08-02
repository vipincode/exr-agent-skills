# Cart Module

> Source: `_docs/prd/PRD.md` §5.3 · Domain: `fullstack` · Phase: MVP
> Status: Ready for planning
> Next step: run `module-planner` against this file.

## Purpose
Collect items before checkout, for both guests and logged-in Shoppers.

## Scope
- Add/remove products, edit quantities.
- Cart persists across sessions for logged-in Shoppers.
- Guest cart merges into the account cart on login.
- Cart shows line totals and a subtotal (server-computed).

## User stories
- As a Shopper, I can add items to a cart so that I can buy several things at once.
- As a guest, I can build a cart before registering so that signup doesn't lose my picks.

## Functional requirements
1. A product can be added to the cart from listing and detail pages.
2. Quantity edits and removals update totals immediately.
3. On login, a guest cart merges with any existing account cart (quantities summed).
4. Out-of-stock items are flagged in the cart before checkout.

## Dependencies
- **Needs:** product-catalog (product data, stock); auth (merge on login)
- **Needed by:** orders

## Edge cases & failure modes
- Item goes out of stock while sitting in the cart.
- Merging two carts that both contain the same product.

## Acceptance criteria
- [ ] A guest's cart survives login via merge.
- [ ] Cart totals always match server-side computation.
- [ ] Out-of-stock cart items are clearly flagged and can't be checked out.

## Out of scope
- Saved-for-later.
