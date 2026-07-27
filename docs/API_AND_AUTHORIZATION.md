# API Overview

Catalog generated from `backend/src/app.ts` and current route files on 2026-07-15. `Auth` means JWT bearer authentication; role checks shown are backend checks.

The complete six-actor authorization matrix and session/ownership rules are maintained in [AUTH_RBAC_SECURITY_MODEL.md](AUTH_RBAC_SECURITY_MODEL.md). `authenticate` validates the live session, token version, active user and current role on every protected request.

## Auth

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login` | Public | Authenticate |
| POST | `/api/auth/refresh` | Public/token | Refresh access token |
| POST | `/api/auth/logout` | Auth | Logout |
| GET/PUT | `/api/auth/me` | Auth | Read/update profile |
| POST | `/api/auth/password` | Auth | Change password |
| POST/DELETE | `/api/auth/avatar` | Auth | Upload/remove avatar |

## Public Product

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/products` | Public | Paginated/filterable products |
| GET | `/api/products/featured` | Public | Featured products |
| GET | `/api/products/new` | Public | New products |
| GET | `/api/products/sale` | Public | Sale products |
| GET | `/api/products/filters` | Public | Catalog filter values |
| GET | `/api/products/:slug` | Public | Product/variant detail; numeric ID fallback |

## Customer Order

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Auth/owner | Create variant-aware order/reservation |
| GET | `/api/orders` | Auth/owner | List own orders |
| GET | `/api/orders/:orderId` | Auth/owner | Own order detail |
| POST | `/api/orders/:orderId/payment-notification` | Auth/owner | Record customer bank-payment notification |
| PATCH | `/api/orders/:orderId/cancel` | Auth/owner | Cancel eligible own order |

## Admin commerce

All routes below are protected by `authenticate` plus `ADMIN` authorization at router level.

## Seller Application

Applicant routes are backend role-protected. Only MEMBER may create, edit, submit, resubmit, or withdraw; MEMBER and the resulting SELLER may read their own application.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/seller-applications/me` | MEMBER/SELLER owner | Read own application and history |
| POST | `/api/seller-applications` | MEMBER | Create the single DRAFT |
| PATCH | `/api/seller-applications/me` | MEMBER owner | Edit DRAFT/REJECTED/WITHDRAWN |
| POST | `/api/seller-applications/me/submit` | MEMBER owner | Move eligible application to PENDING |
| POST | `/api/seller-applications/me/withdraw` | MEMBER owner | Withdraw PENDING |
| GET | `/api/admin/seller-applications` | ADMIN | Filtered/paginated review inbox |
| GET | `/api/admin/seller-applications/:applicationId` | ADMIN | Safe applicant detail and history |
| POST | `/api/admin/seller-applications/:applicationId/approve` | ADMIN | Approve PENDING and atomically promote/revoke sessions |
| POST | `/api/admin/seller-applications/:applicationId/reject` | ADMIN | Reject PENDING with required reason |

Approval does not create a Shop. Seller Product/Order APIs do not exist in SELLER-001.

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/admin/products` | List/create products |
| GET/PATCH/DELETE | `/api/admin/products/:id` | Product detail/update/delete |
| POST | `/api/admin/products/:id/images` | Upload images |
| PATCH/DELETE | `/api/admin/products/:id/images/:imageId[/primary]` | Set primary/remove image |
| GET/POST | `/api/admin/categories`, `/api/admin/brands` | List/create catalog entities |
| GET/PATCH/DELETE | `/api/admin/categories/:id`, `/api/admin/brands/:id` | Entity detail/update/delete |
| GET/POST | `/api/admin/products/:productId/variants` | List/create variants |
| GET/PATCH/DELETE | `/api/admin/variants/:variantId` | Variant detail/update/delete |
| POST | `/api/admin/variants/:variantId/set-default` | Select default variant |
| GET | `/api/admin/inventory`, `/api/admin/inventory/low-stock` | Inventory lists |
| GET | `/api/admin/variants/:variantId/inventory` | Inventory detail |
| POST/GET | `/api/admin/variants/:variantId/inventory/adjustments` | Adjust/list history |
| PATCH | `/api/admin/variants/:variantId/inventory/threshold` | Low-stock threshold |
| GET | `/api/admin/payment-configuration` | Bank/mail readiness |
| GET | `/api/admin/orders`, `/api/admin/orders/:orderId` | Order list/detail and histories |
| PATCH | `/api/admin/orders/:orderId/status` | Order transition |
| PATCH | `/api/admin/orders/:orderId/payment-status` | Payment transition/refund record |

## Relevant legacy modules

Mounted APIs include public/authenticated Plans, Coaches, Bookings, Videos, Exercises; and authenticated Referral, Coupons, Loyalty, CRM, Tickets, Invoices, Audit, Analytics, Revenue, Backup and Media. Their route files are authoritative. Existing Exercises provides public list/taxonomy/detail plus Admin/Coach update; it is a Discovery Gate input, not proof TASK-008 is implemented. Membership payment under Plans is separate from Product Order payment.

## Planned, not implemented

TASK-008 plans Admin/Coach Exercise and Program CRUD/builder APIs; Admin/Coach assignment APIs; Member self assignment/schedule/session/set-log APIs; and Member/Coach/Admin progress APIs. Exact paths must be finalized after Discovery and must not be advertised as current routes.

## Authorization and response principles

JWT bearer authentication supplies the authenticated identity and role (`ADMIN`, `COACH`, `MEMBER`). Backend middleware and owner-filtered service queries are authoritative; frontend guards are navigation UX only. Customer Order endpoints derive ownership from JWT and reject cross-member access. Admin override exists only in Admin routes. New TASK-008 Coach access must require an active Coach-Member scope.

Validation failures use 400-class responses, missing/invalid authentication uses 401, insufficient role/scope uses 403, missing resources use 404, business transition/concurrency conflicts use 409, and incomplete required external configuration may use 503. Central error handling owns unexpected failures. SQL inputs must remain parameterized; pagination, filtering and sorting require validation/allowlists.

Order and Payment histories are immutable normal-flow audit data. Email is attempted after committed commerce state and cannot roll back the transaction. Planned TASK-008 workout/progress APIs are **PLANNED, NOT IMPLEMENTED** and must enforce Member ownership, Coach scope, privacy and concurrency rules from the specification.

Auth/RBAC closure preserved the canonical Order and verified no acceptance fixtures remain in the canonical database.
# SELLER-002 Shop APIs

## Seller

- `GET /api/seller/shop` — SELLER only; resolves ownership exclusively from the
  authenticated user.
- `PATCH /api/seller/shop` — SELLER only; accepts only `name`, `slug`,
  `logoUrl`, `bannerUrl`, `description`, and `pickupAddress`.

Owner IDs, system identity, status, verification, aggregates and Product
ownership are rejected by strict validation. Slug conflicts return 409.

## Public

- `GET /api/shops/:shopSlug?page=&limit=` — ACTIVE Shops only. The response
  excludes owner data, pickup address and system key and includes paginated
  active Products.
- Existing public Product list/detail queries exclude Products belonging to a
  SUSPENDED Shop and include an additive safe Shop summary.

## Admin

- `GET /api/admin/shops`
- `GET /api/admin/shops/:shopId`
- `PATCH /api/admin/shops/:shopId/status`
- `PATCH /api/admin/shops/:shopId/verification`

All endpoints require ADMIN. Suspending requires a reason. Status and
verification updates lock the Shop row and write `AuditLogs`. GymFit Official
cannot be suspended or unverified. No Shop delete or owner-transfer endpoint
exists.
# SELLER-003 Brand Request APIs

- Seller: `GET/POST /api/seller/brand-requests` and
  `GET /api/seller/brand-requests/:requestId`. Ownership is resolved from the
  authenticated Seller Shop; cross-Shop IDs return 404.
- Admin: `GET /api/admin/brand-requests`,
  `GET /api/admin/brand-requests/:requestId`,
  `POST .../:requestId/approve`, and `POST .../:requestId/reject`.
- Seller create uses strict payload validation and a configurable 10/24h
  user+IP limiter. Suspended Shops cannot create requests.
- Active Brand selectors return `id`, `name`, and `isGeneric`; inactive Brands
  are excluded.

## SELLER-004 Product ownership APIs

Catalog ownership is derived exclusively from `Products.shop_id`. Child
resources inherit ownership through their Product; the backend never trusts a
client Shop or owner identifier.

| Method | Route | Authorization | Scope |
|---|---|---|---|
| GET | `/api/seller/products` | SELLER | Authenticated Seller's Shop only; includes inactive Products |
| GET | `/api/seller/products/:productId` | SELLER | Own Product only; cross-Shop returns 404 |

The Seller endpoints are read-only. Unknown list parameters and non-whitelisted
sort/filter values return 400. Public Product APIs require both an active
Product and an `ACTIVE` Shop and expose only a safe Shop summary. Admin Product
APIs retain global scope and include Shop summary metadata; create resolves
GymFit Official server-side and update cannot transfer ownership.
