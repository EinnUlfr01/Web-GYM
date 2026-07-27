# Database and Migrations

GymFit uses SQL Server. The canonical database is `GYMFIT_DB`; acceptance must never mutate it.

The runner in `backend/src/scripts/migrate.ts` reads ordered `db/migrations/NNNN_description.sql` files, applies each in a transaction, and records filename/version/SHA-256 in `SchemaMigrations`. `npm run db:migrate:status` is read-only. A changed checksum for an applied migration is an integrity failure; never edit migrations `0001`-`0005`.

Filenames must match `NNNN_description.sql` and execute lexicographically. Each migration and its tracking row commit in one transaction. A line containing only `GO` is a supported SQL batch separator. Apply mode must stop when required foundation tables are absent or stock backfill is ambiguous; destructive reset/bootstrap is not a fallback.

| Migration | Purpose |
|---|---|
| 0001 | Commerce catalog foundation: variants/options/images and canonical per-variant Inventory |
| 0002 | Default variants, low-stock threshold and InventoryAdjustments |
| 0003 | Orders, OrderItems and OrderStatusHistory |
| 0004 | PaymentStatusHistory |
| 0005 | Reservation expiration metadata/index |
| 0006 | Auth session security: `Users.token_version`, hashed rotating `AuthSessions`, and active booking-slot uniqueness |
| 0100 | Seller Application and `seller` primary-role foundation |

Verified canonical baseline after auth-session closure: Products 167, ProductVariants 167, Inventory 167, ProductImages 1, Users 15, Orders 1, PaymentStatusHistory 0, active AuthSessions 0. Inventory enforces non-negative `on_hand`, `0 <= reserved <= on_hand`, and computed `available = on_hand - reserved`. Products own variants/images; variants own inventory; Orders own item snapshots and immutable status/payment history. Expiration releases eligible unpaid reservations; delivery consumes reserved/on-hand stock.

Before applying a migration: confirm target identity, create a canonical backup using the established backup process, verify that backup, review SQL and checksum/status, then apply once. Never include passwords, credential-bearing connection strings or sensitive backup names in documentation/logs.

Acceptance uses an isolated database such as `GYMFIT_DB_TASK008_ACCEPTANCE_<timestamp>` restored from a verified baseline. Verify identity before mutation, run acceptance there, clean up, and re-check canonical counts/integrity.

TASK-008 is not started and may not reuse `0006`; any future numbering must be chosen only after its Discovery Gate. See the [full specification](TASK-008_IMPLEMENTATION_SPEC.md).

Marketplace allocation is reserved as Coach `0007`–`0049`, shared `0050`–`0099`, and Seller `0100`–`0199`. SELLER-001 uses `0100`; applied migrations must never be renumbered or edited. `SellerApplications` owns one mutable application per User while `SellerApplicationStatusHistory` is append-only.

SELLER-004 requires no database migration. Migration `0101` already provides
the authoritative `Products.shop_id` NOT NULL foreign key and
`IX_Products_Shop_Active`; its backfill assigned the legacy catalog to GymFit
Official. ProductVariants, ProductImages, and Inventory intentionally do not
duplicate `shop_id` because they inherit ownership through Product. The
canonical state therefore remains nine applied migrations with no `0103`.

SELLER-004 acceptance databases require `SELLER004_ACCEPTANCE=1`, use the
`GYMFIT_DB_SELLER004_ACCEPTANCE_` prefix, and apply the existing `0001`–`0102`
chain before tests.

SELLER-005 uses `0103_seller_product_mutation_and_submission.sql`. It adds the
Product moderation foundation, submitted/review fields, and nullable
BrandRequest FK, with constraints enforcing lifecycle consistency and exactly
one Brand source. Existing Products are backfilled to PUBLISHED without
changing catalog IDs or child data. Indexes support Shop moderation lists and
the future Admin review queue. SELLER-005 acceptance requires
`SELLER005_ACCEPTANCE=1`, an isolated
`GYMFIT_DB_SELLER005_ACCEPTANCE_` database, and an isolated upload directory.

Auth/RBAC closure verified canonical Products 167, ProductVariants 167, Inventory 167, ProductImages 1, Users 15, Orders 1, PaymentStatusHistory 0, and active AuthSessions 0; the existing Order was preserved. Refresh uses JSON `{refreshToken}` with opaque hashed rotating sessions; replay revokes the family and logout revokes the current session. Isolated database `GYMFIT_DB_AUTH_RBAC_ACCEPTANCE_1784111000000` was dropped and confirmed absent; no acceptance fixtures remain canonically. TASK-008 is unblocked and starts from migration `0007` after its Discovery Gate.

Canonical migration `0006_auth_session_security.sql` applied successfully via the migration runner with checksum `e6608c0d29d163f4f4a6627e8e1f34fa22f642bbec1f3cea5ac01cc31982dd74`; pending migrations are `0` and checksum mismatches are `0`. Backup and `RESTORE VERIFYONLY WITH CHECKSUM` passed before mutation.
# Migration 0101 — Shop ownership baseline

`0101_shop_foundation_and_product_ownership_baseline.sql` creates `Shops`, the
GymFit Official system row, Seller Shop backfill and mandatory
`Products.shop_id`.

Key invariants:

- filtered unique indexes enforce one Shop per non-null owner and unique
  `system_key`;
- Shop slug is unique;
- system Shops have no owner and non-system Shops require an owner;
- Shop status is ACTIVE or SUSPENDED and aggregate placeholders are bounded;
- every Product has a non-null, FK-backed Shop;
- all Products that existed before 0101, including Product ID 0, belong to
  `system_key=GYMFIT_OFFICIAL`;
- Product, ProductVariant, Inventory and ProductImage identities and counts are
  not rewritten.

SELLER-002 acceptance databases must start with
`GYMFIT_DB_SELLER002_ACCEPTANCE_` and require `SELLER002_ACCEPTANCE=1`.
Canonical `GYMFIT_DB` is explicitly refused by the acceptance runner.
# Migration 0102 — Brand Request and moderation

Migration 0102 adds unique `Brands.normalized_name`, protected `is_generic`,
the Generic Brand, transactional `BrandRequests`, and immutable
`BrandRequestStatusHistory`. It preserves existing Brand IDs and every
`Products.brand_id` reference. A filtered unique index permits only one global
PENDING request per normalized name.
# SELLER-006 / Migration 0104

`0104_admin_product_moderation.sql` adds nullable current-decision fields to Products and append-only `ProductModerationHistory`. Existing GymFit Official Products retain null `reviewed_at`, `published_at`, and `reviewed_by_user_id`; migration 0104 does not fabricate legacy history. The history table has Product/User foreign keys, lifecycle/reason checks, inbox/history indexes, and an UPDATE/DELETE rejection trigger.
