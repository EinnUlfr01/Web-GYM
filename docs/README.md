# GymFit Documentation Index

This is the only documentation index. Current source and applied migrations override documentation if a conflict is found.

## Which file should I read?

- New teammate: [root README](../README.md), then [Developer Workflow](DEVELOPER_WORKFLOW.md).
- Current project state: [PROJECT_STATUS.md](../PROJECT_STATUS.md).
- What to build next: [ROADMAP.md](../ROADMAP.md) and [TASK-008 Implementation Specification](TASK-008_IMPLEMENTATION_SPEC.md).
- Database work: [Database and Migrations](DATABASE_AND_MIGRATIONS.md).
- API/security work: [API and Authorization](API_AND_AUTHORIZATION.md).
- Historical TASK-007 evidence: [TASK-007 Final Handoff](TASK-007_FINAL_HANDOFF.md) and [TASK-007 Completion](../logs/TASK-007_COMPLETION.md).
- Coach-only TASK-008 evidence: [Coach Discovery Report](coach/COACH_ROLE_DISCOVERY_REPORT.md) and [Coach Role Handover](coach/COACH_ROLE_HANDOVER.md).

## Canonical files

| File | Purpose | Intended reader | Update when |
|---|---|---|---|
| [Architecture](ARCHITECTURE.md) | Verified system structure and data flows | Developers/architects | Modules, integrations or boundaries change |
| [Setup and Environment](SETUP_AND_ENVIRONMENT.md) | Install, environment names and startup | New/local developers | Scripts or configuration names change |
| [Database and Migrations](DATABASE_AND_MIGRATIONS.md) | Schema ownership and migration safety | Backend/DB developers | A migration is added/applied |
| [API and Authorization](API_AND_AUTHORIZATION.md) | Current API groups and access rules | Backend/frontend/security | Routes or authorization change |
| [Developer Workflow](DEVELOPER_WORKFLOW.md) | Branch, implementation, testing and handoff workflow | Contributors | Tooling or delivery gates change |
| [Known Limitations](KNOWN_LIMITATIONS.md) | Only current verified limitations | All contributors | A limitation is added or resolved |
| [TASK-007 Final Handoff](TASK-007_FINAL_HANDOFF.md) | Official final evidence | Maintainers | Only for a verified regression/correction |
| [TASK-008 Implementation Specification](TASK-008_IMPLEMENTATION_SPEC.md) | Authoritative scope and acceptance contract | TASK-008 implementers | Approved TASK-008 decision changes |
| [TASK-008 Discovery Checklist](TASK-008_DISCOVERY_CHECKLIST.md) | First implementation gate | TASK-008 implementers | Discovery requirements change |

Curated project history is under [`logs/`](../logs/README.md). Runtime logger output belongs under ignored `backend/logs/` and is never documentation.
