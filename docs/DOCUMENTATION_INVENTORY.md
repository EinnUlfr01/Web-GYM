# Documentation Inventory

Inventory baseline: branch `fix/vinh-coach-e2e-hardening`, source commit `21f69017b0c4f2f5933998b0382d0676b0e83a16`, audited 2026-08-03. Scope is repository Markdown in the root, `docs/**/*.md` and `logs/**/*.md`; skill bundles and third-party package contents are excluded. Prompt/package artifacts are listed so they cannot be mistaken for canonical docs.

| Path | Classification | Scope | Last verified | Evidence/reason | Action/replacement |
|---|---|---|---|---|---|
| `README.md` | CANONICAL | Project entry point | `21f6901` | Current source/build/start overview | Keep current; link `docs/README.md` |
| `ROADMAP.md` | CANONICAL | Workstreams and next gates | `21f6901` | Project sequencing | Keep current Coach E2E state |
| `PROJECT_STATUS.md` | CANONICAL | Current snapshot | `21f6901` | Status reconciled with hardening evidence | Keep current snapshot |
| `CONTRIBUTING.md` | CANONICAL | Contribution and safety rules | `21f6901` | Active contributor guidance | Keep migration/branch examples current |
| `CODEX_COMPLETE_COACH_BUSINESS_E2E.md` | GENERATED_TEMP | User task prompt | `21f6901` | Untracked prompt, not implementation source | Preserve untracked; exclude from Git |
| `CODEX_FIX_COACH_ROLE_ONLY.md` | GENERATED_TEMP | User task prompt | `21f6901` | Untracked prompt | Preserve untracked; exclude from Git |
| `CODEX_FIX_COMPLETE_COACH_E2E_HARDENING.md` | GENERATED_TEMP | User task prompt | `21f6901` | Untracked prompt | Preserve untracked; exclude from Git |
| `CODEX_FIX_COMPLETE_COACH_E2E_HARDENING_V2_DOC_CLEANUP.md` | GENERATED_TEMP | User task prompt | `21f6901` | Current task input, untracked | Preserve untracked; exclude from Git |
| `CODEX_PROMPT_COACH_ROLE_ONLY_FINAL.md` | GENERATED_TEMP | User task prompt | `21f6901` | Untracked prompt | Preserve untracked; exclude from Git |
| `docs/README.md` | CANONICAL | Documentation index | `21f6901` | Only index policy | Rewrite as index only |
| `docs/ARCHITECTURE.md` | CANONICAL | System boundaries and flows | `21f6901` | Contains stale TASK-008 boundary | Update Coach flow/current boundary |
| `docs/API_AND_AUTHORIZATION.md` | CANONICAL | Route and authorization contract | `21f6901` | Contains current and stale planned sections | Update Member Workout routes and remove contradiction |
| `docs/DATABASE_AND_MIGRATIONS.md` | CANONICAL | Schema/migration safety | `21f6901` | Contains stale migration counts | Rewrite current 0007/0008 facts |
| `docs/KNOWN_LIMITATIONS.md` | CANONICAL | Verified remaining limits | `21f6901` | Claims Workout is unimplemented | Rewrite current limits |
| `docs/DOCUMENTATION_GOVERNANCE.md` | CANONICAL | Documentation policy | `21f6901` | New policy required by cleanup gate | Keep |
| `docs/DOCUMENTATION_INVENTORY.md` | CANONICAL | Full Markdown inventory | `21f6901` | New audit evidence | Keep and update final actions |
| `docs/DOCUMENTATION_CLEANUP_REPORT.md` | CANONICAL | Evidence of cleanup | `21f6901` | Required final report | Keep final evidence report current |
| `docs/AUTH_RBAC_SECURITY_MODEL.md` | SUPPORTING | Auth and scope model | `21f6901` | Active security reference, stale TASK-008 sentence | Update stale sentence only |
| `docs/DASHBOARD_DESIGN_SYSTEM.md` | SUPPORTING | Dashboard presentation | `21f6901` | Active UI reference | Keep; no unrelated feature edits |
| `docs/DEVELOPER_WORKFLOW.md` | SUPPORTING | Local workflow | `21f6901` | Active workflow, old migration examples | Update safety examples |
| `docs/SETUP_AND_ENVIRONMENT.md` | SUPPORTING | Environment/startup | `21f6901` | Active setup reference | Keep |
| `docs/TASK-007_FINAL_HANDOFF.md` | HISTORICAL | Completed commerce evidence | `21f6901` | Historical task handoff | Keep as historical supporting evidence |
| `docs/TASK-008_DISCOVERY_CHECKLIST.md` | HISTORICAL | Completed discovery gate | `21f6901` | Superseded by implemented Coach slice | Archive under `docs/archive/2026-08/` |
| `docs/TASK-008_IMPLEMENTATION_SPEC.md` | HISTORICAL | Approved pre-implementation scope contract | `21f6901` | Migration `0006`/not-started plan is superseded | Archive under `docs/archive/2026-08/` |
| `docs/coach/COACH_ROLE_HANDOVER.md` | CANONICAL | Coach role handover | `21f6901` | Old role-only handover contradicts completed E2E | Rewrite current |
| `docs/coach/COACH_END_TO_END_HANDOVER.md` | CANONICAL | Coach/Member E2E handover | `21f6901` | Current implementation evidence | Update with hardening results |
| `docs/coach/MEMBER_WORKOUT_FLOW_DISCOVERY.md` | SUPPORTING | Member flow decisions | `21f6901` | Active contract evidence | Update applied-state/contract facts |
| `docs/coach/COACH_ROLE_DISCOVERY_REPORT.md` | HISTORICAL | Role-only discovery | `21f6901` | Superseded by E2E handover | Archive under `docs/archive/2026-08/` |
| `docs/coach/ADR_COACH_REASSIGNMENT_ASSIGNMENT_LIFECYCLE.md` | CANONICAL | Reassignment lifecycle | `21f6901` | New domain decision required | Create and keep |
| `docs/admin/ADMIN_COACH_MANAGEMENT_HANDOVER.md` | CANONICAL | Admin Coach/TASK-008 handover | `feat/vinh-admin-coach-management` | Admin status, assign/reassign, Exercise and governance | Update with final acceptance/build evidence |
| `docs/marketplace/ADR-001-MARKETPLACE-FOUNDATION-DECISIONS.md` | SUPPORTING | Marketplace decisions | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/ADR-002-SHOP-FOUNDATION-AND-PRODUCT-OWNERSHIP-BASELINE.md` | SUPPORTING | Marketplace decisions | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/ADR-003-BRAND-REQUEST-AND-MODERATION.md` | SUPPORTING | Marketplace decisions | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/ADR-004-PRODUCT-OWNERSHIP-AND-QUERY-SCOPES.md` | SUPPORTING | Marketplace decisions | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/ADR-005-SELLER-PRODUCT-MUTATION-AND-SUBMISSION.md` | SUPPORTING | Marketplace decisions | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/ADR-006-ADMIN-PRODUCT-MODERATION.md` | SUPPORTING | Marketplace decisions | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/ADR-007-MARKETPLACE-SEARCH-AND-SHOP-PAGE.md` | SUPPORTING | Marketplace decisions | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/GYMFIT_SELLER_MARKETPLACE_FULL_ROADMAP.md` | SUPPORTING | Marketplace roadmap | `21f6901` | Active marketplace source | Keep unchanged |
| `docs/marketplace/GYMFIT_SELLER_MARKETPLACE_FULL_ROADMAP_V1_BACKUP.md` | DUPLICATE/HISTORICAL | Marketplace roadmap backup | `21f6901` | Filename explicitly says backup; active roadmap supersedes it | Archive under `docs/archive/2026-08/` |
| `docs/marketplace/MARKETPLACE_FRONTEND_HANDOVER.md` | SUPPORTING | Marketplace handover | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/MARKETPLACE_MVP_FINAL_HANDOVER.md` | SUPPORTING | Marketplace handover | `21f6901` | Out-of-scope supporting doc | Keep unchanged |
| `docs/marketplace/SELLER-000-MARKETPLACE-REPOSITORY-DISCOVERY.md` | HISTORICAL | Marketplace discovery | `21f6901` | Discovery evidence, not current implementation source | Keep as supporting history |
| `logs/README.md` | SUPPORTING | Curated log policy | `21f6901` | Active policy | Update archive/index wording |
| `logs/PROJECT_HISTORY.md` | HISTORICAL | Project milestones | `21f6901` | Append-only history | Keep; not source of truth |
| `logs/AUTH_RBAC_HARDENING_COMPLETION.md` | HISTORICAL | Auth completion evidence | `21f6901` | Historical evidence | Keep |
| `logs/DASHBOARD_UI_REDESIGN_COMPLETION.md` | HISTORICAL | Dashboard completion evidence | `21f6901` | Historical evidence | Keep |
| `logs/TASK-007_COMPLETION.md` | HISTORICAL | TASK-007 evidence | `21f6901` | Historical evidence | Keep |
| `logs/TASK-008_START_CHECKPOINT.md` | HISTORICAL | Pre-implementation checkpoint | `21f6901` | Superseded and stale | Archive under `docs/archive/2026-08/` |
| `docs/archive/2026-08/coach/COACH_ROLE_DISCOVERY_REPORT.md` | HISTORICAL | Archived role-only discovery | `21f6901` | Header identifies superseding handover | Keep as evidence |
| `docs/archive/2026-08/TASK-008_DISCOVERY_CHECKLIST.md` | HISTORICAL | Archived discovery gate | `21f6901` | Header identifies superseding status/handover | Keep as evidence |
| `docs/archive/2026-08/TASK-008_IMPLEMENTATION_SPEC.md` | HISTORICAL | Archived pre-implementation specification | `21f6901` | Old migration/status plan superseded | Keep as evidence |
| `docs/archive/2026-08/logs/TASK-008_START_CHECKPOINT.md` | HISTORICAL | Archived checkpoint | `21f6901` | Old not-started snapshot | Keep as evidence |
| `docs/archive/2026-08/marketplace/GYMFIT_SELLER_MARKETPLACE_FULL_ROADMAP_V1_BACKUP.md` | DUPLICATE/HISTORICAL | Archived Marketplace backup | `21f6901` | Active roadmap supersedes explicit backup | Keep as evidence |
The three TypeScript files listed in the task are implementation debt, not documentation inventory candidates.
