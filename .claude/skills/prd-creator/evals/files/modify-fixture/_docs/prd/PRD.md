# PRD — Verdant (Indoor Plant Store)

> Status: Approved · Created: 2026-06-20 · Last updated: 2026-06-20
> Owner: Vipin · Produced by prd-creator; edit freely — this file is the source of truth.

## 1. Product summary
Verdant is a single-vendor online store selling indoor plants and pots in India. Customers browse the catalog, order online, and get doorstep delivery. The owner manages products and orders through an admin panel.

## 2. Goals & non-goals
- **Goals**
  - Customers can find and buy a plant in under 5 minutes.
  - The owner can run the store (products, orders, stock) without developer help.
  - Order status is visible to the customer end-to-end.
- **Non-goals**
  - No multi-vendor marketplace.
  - No mobile app in v1 (responsive web only).
  - No international shipping.

## 3. Target users
- **Shopper** — browses, buys, tracks orders.
- **Admin** — the store owner; manages catalog, orders, and stock.

## 4. Decisions
| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | Registration | Open, email + password | user |
| 2 | Guest checkout | Yes, with account nudge after purchase | user (accepted suggestion) |
| 3 | Currency | Single (INR) | user |
| 4 | Payments | Razorpay; webhooks are source of truth | user (accepted suggestion) |
| 5 | Discounts | Coupon codes at checkout, flat & percentage | user |

## 5. Feature modules

### 5.1 Auth `fullstack` `MVP`
- **Purpose** — Accounts, sessions, and the Shopper/Admin role split.
- **Includes** — Registration, login, password reset, profile with saved addresses.
- **User stories**
  - As a Shopper, I can create an account so that my orders and addresses are saved.
  - As an Admin, I can log in so that I can manage the store.
- **Excludes** — Social login (Later).

### 5.2 Product catalog `fullstack` `MVP`
- **Purpose** — What's for sale and how customers find it.
- **Includes** — Products with photos and care info, categories (plants, pots, accessories), search, stock tracking.
- **User stories**
  - As a Shopper, I can browse by category and search so that I find the right plant.
  - As an Admin, I can create and edit products so that the catalog stays current.
- **Excludes** — Product variants (Later), reviews (Later).

### 5.3 Cart `fullstack` `MVP`
- **Purpose** — Collect items before checkout.
- **Includes** — Persistent cart, guest cart merged on login, quantity edits.
- **User stories**
  - As a Shopper, I can add items to a cart so that I can buy several things at once.
- **Excludes** — Saved-for-later.

### 5.4 Orders & checkout `fullstack` `MVP`
- **Purpose** — Turn a cart into a delivered order.
- **Includes** — Address + delivery choice, order placement, history, status tracking (placed → shipped → delivered), cancellation before shipping.
- **User stories**
  - As a Shopper, I can place an order and track its status so that I know when my plant arrives.
- **Excludes** — Returns/exchanges (Later).

### 5.5 Payments `fullstack` `MVP`
- **Purpose** — Collect money safely via Razorpay.
- **Includes** — Payment at checkout, webhook-driven status, refunds on cancellation.
- **User stories**
  - As a Shopper, I can pay online so that my order is confirmed instantly.
- **Excludes** — COD (Later), EMI.

### 5.6 Coupons `fullstack` `Later`
- **Purpose** — Discount codes to drive sales.
- **Includes** — Flat and percentage codes, expiry dates, single-use-per-customer rule, admin CRUD.
- **User stories**
  - As a Shopper, I can apply a coupon at checkout so that I pay less.
  - As an Admin, I can create coupon codes so that I can run promotions.
- **Excludes** — Automatic discounts, stacking.

### 5.7 Admin panel `fullstack` `MVP`
- **Purpose** — Run the store without touching the database.
- **Includes** — Product CRUD, order management, stock alerts, basic sales view.
- **User stories**
  - As an Admin, I can update order statuses so that customers see accurate tracking.
- **Excludes** — Analytics dashboards (Later).

## 6. Standard production rules
- Totals computed server-side; client prices never trusted.
- Stock checked at checkout, not only at add-to-cart.
- Orders immutable once placed; changes via cancellation/refund flows only.
- Razorpay webhooks are the source of truth for payment status.
- All input validated; errors returned in a consistent, user-readable shape.
- Transactional emails: welcome, order confirmation, shipping update, refund confirmation.
- Privacy policy and terms pages; account deletion supported.
- Responsive, mobile-first UI.

## 7. Module map
| Module | Folder | Domain | Phase | Depends on |
|--------|--------|--------|-------|------------|
| Auth | `_docs/features/auth/` | fullstack | MVP | — |
| Product catalog | `_docs/features/product-catalog/` | fullstack | MVP | auth (admin CRUD) |
| Cart | `_docs/features/cart/` | fullstack | MVP | product-catalog |
| Orders & checkout | `_docs/features/orders/` | fullstack | MVP | auth, cart |
| Payments | `_docs/features/payments/` | fullstack | MVP | orders |
| Coupons | `_docs/features/coupons/` | fullstack | Later | orders |
| Admin panel | `_docs/features/admin/` | fullstack | MVP | auth, product-catalog, orders |

**Suggested build order:** auth → product-catalog → cart → orders → payments → admin → coupons

## 8. Out of scope
- Multi-vendor marketplace — single owner by design.
- Mobile app — responsive web covers v1.
- International shipping — India only for now.
- Subscription/plant-care plans — revisit after launch.

## 9. Open questions
_None._

## 10. Changelog
| Date | Change | Reason |
|------|--------|--------|
| 2026-06-20 | Initial PRD | — |
