# Coach2 Final Closure Progress

Closure branch: `coach2`
Execution history: `coach1`
Start commit: `4cf3cc7`
Imported Coach1 completion checkpoint: `e368d60`

## C00 — Baseline và khóa nhánh

Status: PASS

Confirmed issue:

- `coach2` was an ancestor of `coach1` and was missing the 13 Coach phase 26–29 commits.
- The branch had no unique tracked commits. A fast-forward to `e368d60` was safe because the worktree contained only user-owned untracked files outside the incoming tracked paths.
- Canonical/dev target was verified read-only as SQL Server database `GYMFIT_DB` with `NODE_ENV=development` and `DB_HOST=DESKTOP-0PI1Q6Q`.
- Migration status through `0016`: `0010` applied, `0011`–`0016` pending, zero checksum mismatches, required foundation tables present, no migration was applied in C00.

Changes:

- Fast-forwarded `coach2` from `4cf3cc7` to `e368d60`.
- Preserved all user-owned untracked files, including the root Master Task file.
- Created this progress log.

Tests:

- `git branch --show-current`: `coach2`.
- `git status --short --branch`: expected user-owned untracked files only.
- `git diff --check`: PASS.
- `npm.cmd run db:migrate:status -- --through=0016`: PASS; pending Coach migrations are `0011`–`0016`, checksum mismatches `0`.

Database:

- Canonical/dev target was read-only in C00.
- No schema or business data was changed.

Security:

- No production code, Marketplace/Seller code, or migrations `0100`–`0111` changed.
- No destructive Git or database command was used.

Commit: `e368d60` (existing fast-forward checkpoint)

Next: C01 — source re-audit.

## C01 — Source re-audit

Status: PASS

Confirmed issue:

| Audit item | Classification | Evidence |
|---|---|---|
| Membership public copy | `CONFIRMED_GAP` | `MembershipPlans.tsx` still has Monthly/Yearly, Save 20%, calculated annual price, Start Free Trial, 7-day trial and PayPal/card claims. |
| Pending Plan after Login | `CONFIRMED_GAP` | Register preserves the key, but `LoginPage.tsx` routes through `from`/role home without consuming the pending Plan contract. |
| Program Exercise reps range | `CONFIRMED_GAP` | Zod validates each reps bound independently but does not enforce `targetRepsMin <= targetRepsMax`. |
| Booking slot snapshot | `CONFIRMED_GAP` | Booking schema/controller/DTO have no `session_mode` or `location` columns or fields. |
| Schedule outcome response | `CONFIRMED_GAP` | Generator returns only legacy `inserted`, `skipped`, `requestedFromDate`, `fromDate`, `toDate` and `horizonDays`. |
| Priority booking entitlement | `SPEC_ONLY` | Historical prompt names `COACH_PRIORITY_BOOKING`, but migration `0012` and runtime entitlements contain only booking-enabled and monthly-limit keys; no priority behavior exists. |
| Canonical migrations `0011`–`0016` | `DEPLOYMENT_ONLY` | Read-only status shows all six pending with zero checksum mismatches on verified development target `GYMFIT_DB`. |
| Branch context in docs | `CONFIRMED_GAP` | Existing handover/state describe execution branch as `coach1` only and have no Coach2 closure/release state. |

Changes:

- No production code changed in C01.
- Recorded the audit and retained the historical Coach1 completion documents unchanged.

Tests:

- Targeted source search across Membership, Auth, Coach Workspace, Booking, Schedule, Entitlement and Coach docs: PASS.
- `git diff --check`: PASS.

Database:

- No database mutation in C01.

Security:

- Scope exclusions confirmed: no Marketplace/Seller backend changes and no migration `0100`–`0111` changes.

Commit: pending explicit documentation commit.

Next: C02 — truthful public Membership UI.

## C02 — Truthful public Membership UI

Status: PASS

Confirmed issue:

- Public Membership UI contained unsupported yearly billing, discount, free-trial and live-payment claims.

Changes:

- Removed fake Monthly/Yearly toggle and annual price calculation.
- Cards now display backend `price`, `durationDays`, backend features and structured Coach booking entitlement values.
- Replaced unsupported comparison/trust/payment claims with a truthful activation explanation and backend-aligned FAQ.
- Kept the real flow as choose Plan → pending simulated payment → explicit confirmation → active Membership.

Tests:

- `frontend: npx.cmd tsc --noEmit`: PASS.
- `frontend: npm.cmd run build`: PASS; existing Vite large-chunk warning documented.
- `git diff --check`: PASS.

Database: No migration or database mutation.

Security: No payment provider, trial, yearly billing or client-side entitlement authorization was added.

Commit: grouped with C03 after the pending-Plan gate.

Next: C03 — pending Plan redirect after Login/Register.

## C03 — Pending Plan redirect after Login/Register

Status: PASS

Confirmed issue:

- Register preserved pending Plan state, but Login did not route a member with pending state to checkout.
- Membership Account cleared the pending key after unrelated actions and could clear it before a successful subscription/confirmation.

Changes:

- Added shared `getPendingPlanId`, `getPendingPlanCheckoutPath` and `clearPendingPlan` helpers.
- Login and Register route authenticated members to `/membership/checkout?plan_id=<id>` before normal role/home routing.
- Coach/Admin/Seller stale pending state is cleared and never enters Member checkout.
- Pending state is only cleared after successful subscription or payment confirmation; failed requests retain it.
- Destinations remain fixed internal paths, preventing open redirects.

Tests:

- Member/guest flow code paths reviewed for Plan → Register, Plan → Login, normal login and non-member stale state.
- `frontend: npx.cmd tsc --noEmit`: PASS.
- `frontend: npm.cmd run build`: PASS; existing Vite large-chunk warning documented.
- `git diff --check`: PASS.

Database: No migration or database mutation.

Security: Role policy remains backend-authoritative; pending Plan never grants membership access.

Commit: pending explicit C02/C03 commit.

Next: C04 — Program Exercise validation.

## C04 — Program Exercise validation

Status: PASS

Confirmed issue:

- Program Exercise schemas validated individual numeric fields and required a reps/duration target but accepted an inverted reps range.

Changes:

- Replaced the duplicated `.refine` checks with a shared Zod `superRefine`.
- Invalid `targetRepsMin > targetRepsMax` now produces a validation response with HTTP `400`.
- Existing bounds, Draft-only mutation and active Exercise checks remain unchanged.
- Added the inverted-range assertion to `acceptance:coach-program-versioning`.

Tests:

- `backend: npm.cmd run build`: PASS.
- `backend: npm.cmd run lint`: PASS with 0 errors and 461 existing `no-explicit-any` warnings.
- `git diff --check`: PASS.

Database: No migration or database mutation.

Security: Validation remains server-side and ownership/lifecycle checks are unchanged.

Commit: pending explicit C04 commit.

Next: C05 — Booking slot snapshot design.

## C05 — Booking slot snapshot design

Status: PASS

Confirmed issue:

- Booking rows had no durable mode/location snapshot even though Availability already resolved both values per slot.

Changes:

- Added `ADR_BOOKING_SLOT_SNAPSHOT.md`.
- Chosen minimum snapshot is `session_mode` plus `location`.
- Authority is the locked backend Availability slot; client mode/location will not be accepted as truth.
- Existing rows remain nullable and are never backfilled from current Coach profile data.

Tests:

- Reviewed Booking schema, Availability slot calculation, transaction locking and Booking API DTO flow.
- `git diff --check`: PASS.

Database: Design only; no canonical or disposable database mutation in C05.

Security: Snapshot authority is server-side and remains independent of request-body identity or display fields.

Commit: pending explicit C05 documentation commit.

Next: C06 — additive migration and disposable verification.
