# GymFit

GymFit is a full-stack gym-management and commerce platform with Member, Coach, Admin and Seller surfaces. The maintained documentation index is [`docs/README.md`](docs/README.md); source code, migration files and verified database state are authoritative over prose.

## Roles and current status

- Member: self-scoped workout execution, session history and progress.
- Coach: Program/Day/Exercise authoring, Member assignment/schedules and scoped monitoring.
- Admin: Coach status and Member scope management, shared Exercise Library and read-only Workout Governance.
- Seller/Marketplace: maintained in the protected Marketplace documentation set and outside the Coach cleanup scope.

Coach migrations `0007`, `0008` and `0009` are applied and checksum-verified on the canonical database. Admin Coach acceptance passes on isolated data. The final visual browser check is currently blocked by missing approved browser runtime; see [`docs/coach/COACH_MODULE_HANDOVER.md`](docs/coach/COACH_MODULE_HANDOVER.md).

## Technology

- Frontend: React 18, TypeScript, Vite, React Router, Zustand, Axios and Tailwind CSS.
- Backend: Node.js, Express, TypeScript, SQL Server (`mssql`), Zod, JWT and Nodemailer.
- Database: SQL Server with ordered, checksummed migrations.

## Quick start

Configure local variables with [`docs/SETUP_AND_ENVIRONMENT.md`](docs/SETUP_AND_ENVIRONMENT.md); never commit `.env` or secrets.

```powershell
cd backend
npm install
npm run db:migrate:status
npm run dev
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Read [`docs/DATABASE_AND_MIGRATIONS.md`](docs/DATABASE_AND_MIGRATIONS.md) before migration work. Acceptance mutations must use a guarded disposable database, never the canonical database.

## Contribution and security

Use explicit branches and explicit staging. Do not push automatically. Backend authorization is authoritative; frontend guards are navigation UX only. See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/README.md`](docs/README.md).
