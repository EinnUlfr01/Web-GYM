# GymFit

GymFit is a full-stack gym-management and commerce platform. It combines role-based member, coach, and administrator workflows with a public product catalog, variant-aware checkout, order/payment auditing, membership features, bookings, and media. The current source of truth is this branch plus the documents indexed in [`docs/README.md`](docs/README.md).

## Current status

- Overall project: **IN PROGRESS**.
- TASK-007: **COMPLETE** on `007c-order-management` at `427ad52996961648ffc622ca1bf2999a5aab3df4`; runtime, Gmail, Bank/QR, customer browser, and admin browser acceptance passed.
- TASK-008 specification: **COMPLETE**; implementation: **NOT STARTED**.
- Next action: complete the [TASK-008 Discovery Gate](docs/TASK-008_DISCOVERY_CHECKLIST.md) before designing migration `0006`.

Completed capabilities include JWT authentication and Admin/Coach/Member roles; public catalog; Admin Product/Image, Category, Brand, Variant, and Inventory management; variant-aware Cart/Checkout; customer and admin Orders; Bank QR payment notification; Gmail notifications; Payment and Order audit histories; and reservation, cancellation, expiration, delivery, and refund lifecycle handling.

## Technology

- Frontend: React 18, TypeScript, Vite, React Router 6, Zustand, Axios, Tailwind CSS, Recharts.
- Backend: Node.js, Express 4, TypeScript, SQL Server (`mssql`), Zod/express-validator, JWT, bcrypt, Nodemailer, Winston.
- Database: SQL Server; ordered, checksummed migrations `0001`-`0005` are applied to canonical database `GYMFIT_DB`.

## Repository layout

```text
backend/         Express/TypeScript API
frontend/        React/Vite application
db/migrations/   Ordered SQL Server migrations and runner guidance
docs/            Canonical technical documentation and historical archive
logs/            Policy plus curated project history (never raw runtime logs)
image/           Repository-managed static image assets
```

## Quick start

Prerequisites: Node.js, npm, and access to SQL Server. Configure local environment variables using [Setup and Environment](docs/SETUP_AND_ENVIRONMENT.md); never commit `.env` or secrets.

```bash
cd backend
npm install
npm run db:migrate:status
npm run dev
```

## Coach Member Workout Flow

The Coach E2E slice now includes the additive Member Workout API/UI: assignment and schedule read, Start Session, immutable snapshot, set logs, Complete/Abandon, and self-scoped Progress. Coach monitoring reads the resulting session, snapshot, set summary and progress facts. See [Coach end-to-end handover](docs/coach/COACH_END_TO_END_HANDOVER.md).

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Use [Database and Migrations](docs/DATABASE_AND_MIGRATIONS.md) before applying migrations. See the [documentation index](docs/README.md), [developer workflow](docs/DEVELOPER_WORKFLOW.md), and [TASK-008 specification](docs/TASK-008_IMPLEMENTATION_SPEC.md).

## Contribution workflow

Work on feature branches, stage files explicitly, update documentation with completed work, and do not push directly to `main`. See [`CONTRIBUTING.md`](CONTRIBUTING.md). Never commit `.env`, raw logs, backups, uploads, `node_modules`, `dist`, browser profiles, or acceptance artifacts.
