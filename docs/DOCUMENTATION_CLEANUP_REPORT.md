# Documentation Cleanup Report

Audit date: 2026-08-03
Baseline: `feat/vinh-coach-member-e2e` at `21f69017b0c4f2f5933998b0382d0676b0e83a16`
Working branch: `fix/vinh-coach-e2e-hardening`

## FILES KEPT

- Canonical root, technical, Coach and governance files listed in `docs/DOCUMENTATION_INVENTORY.md`.
- Marketplace, Video and Admin supporting documentation was not feature-edited.
- Untracked user-owned prompt/package artifacts were preserved and will not be staged.

## FILES UPDATED

Root status files (`README.md`, `ROADMAP.md`, `PROJECT_STATUS.md`, `CONTRIBUTING.md`); the canonical index, architecture, API, database, limitations, auth/RBAC, dashboard, workflow and Coach handover/ADR documents; `logs/README.md`; and the governance, inventory and cleanup report. `frontend/src/pages/coaches/CoachDashboard.tsx` also had one stale UI claim removed: the dashboard now identifies Member snapshot/set data as available.

## FILES MERGED

No content merge was required. The explicit Marketplace `V1_BACKUP` duplicate was not merged into the active roadmap because the active roadmap is the maintained source; it was archived with evidence instead. No active document referenced the backup after the archive move.

## FILES ARCHIVED

Archived with evidence headers: `docs/archive/2026-08/coach/COACH_ROLE_DISCOVERY_REPORT.md`, `docs/archive/2026-08/TASK-008_DISCOVERY_CHECKLIST.md`, `docs/archive/2026-08/TASK-008_IMPLEMENTATION_SPEC.md`, `docs/archive/2026-08/logs/TASK-008_START_CHECKPOINT.md`, and `docs/archive/2026-08/marketplace/GYMFIT_SELLER_MARKETPLACE_FULL_ROADMAP_V1_BACKUP.md`. They are historical and not implementation sources of truth.

## FILES DELETED

None. Generated prompts/package artifacts are untracked user-owned files and are intentionally preserved; no blind deletion was performed.

## LINKS FIXED

The canonical index and history references were reconciled after the archive moves. A scoped scan of 47 root/`docs`/`logs` Markdown files found no broken relative links and no absolute Windows-path links.

## STALE CLAIMS REMOVED

Removed from maintained docs: TASK-008 not-started language; `0007`/`0008` pending claims; the old branch/commit as current state; `BLOCKED_BY_MEMBER_WORKOUT_FLOW`; legacy “Member flow unavailable” claims; and obsolete migration/count snapshots. Historical archive headers deliberately retain those claims as evidence and mark them non-canonical.

## PENDING DECISIONS

- Whether the preserved untracked prompt/package artifacts should be removed from the user's workspace in a separate explicit cleanup request.

## CANONICAL DOCUMENT SET

`README.md`, `ROADMAP.md`, `PROJECT_STATUS.md`, `CONTRIBUTING.md`, `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/API_AND_AUTHORIZATION.md`, `docs/DATABASE_AND_MIGRATIONS.md`, `docs/KNOWN_LIMITATIONS.md`, `docs/DOCUMENTATION_GOVERNANCE.md`, `docs/DOCUMENTATION_INVENTORY.md`, `docs/coach/COACH_ROLE_HANDOVER.md`, `docs/coach/COACH_END_TO_END_HANDOVER.md`, and `docs/coach/ADR_COACH_REASSIGNMENT_ASSIGNMENT_LIFECYCLE.md`.
