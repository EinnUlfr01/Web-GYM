# Documentation Governance

Status: CANONICAL
Last verified: 2026-08-03 on `21f69017b0c4f2f5933998b0382d0676b0e83a16`

## Authority

Source code, migration files and verified database status are authoritative for implementation facts. `README.md`, `ROADMAP.md`, `PROJECT_STATUS.md` and the files listed in `docs/DOCUMENTATION_INVENTORY.md` are the maintained project documentation set. `docs/README.md` is the only documentation index.

Historical material is evidence, not an implementation source of truth. It must carry a `HISTORICAL` header and link to the document that supersedes it. Marketplace, Video and Admin documentation remains supporting material unless explicitly changed by a scoped task.

## Update rules

- Update `PROJECT_STATUS.md` for the current snapshot only; do not append old snapshots.
- Update `ROADMAP.md` when scope, dependency, owner, gate or next action changes.
- Update API, architecture and database documents when a route, boundary or migration contract changes.
- Update the relevant Coach handover and ADR when Coach/Member Workout behavior or ownership policy changes.
- Record every Markdown file in `DOCUMENTATION_INVENTORY.md` with classification, evidence, action and replacement.
- Use relative repository links. Do not publish Windows absolute paths, credentials, tokens, raw acceptance output or `.env` content.
- Archive superseded history under `docs/archive/YYYY-MM/` instead of deleting evidence. Delete only duplicate/obsolete/generated files with an explicit evidence line in the cleanup report.
- Review links, stale claims, branch/commit references and migration counts before each handoff.

## Review gate

Before commit, run a Markdown link/path scan, `git diff --check`, a secret-pattern scan and an explicit staged-path review. Documentation changes must not broaden a code task's feature scope.
