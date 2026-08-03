# GymFit

GymFit is a full-stack gym-management and commerce platform with Member, Coach, Admin and Seller role surfaces. The implementation source is the repository code, migration ledger and verified database state; the maintained documentation set is indexed in [`docs/README.md`](docs/README.md).

## Current status

The Coach/Member Workout business slice is implemented on the baseline `90140f5`. The current branch adds the scoped Admin Coach Management layer: Coach status, CRM assign/reassign, Admin Exercise Library, read-only Workout Governance and Admin-only routes. Video, Marketplace, Seller, Payment, Refund and Settlement remain out of scope.

The three known frontend TypeScript errors outside this scope remain intentionally untouched: `frontend/src/components/products/ProductCard.tsx`, `frontend/src/pages/reviews/ReviewsPage.tsx` and `frontend/src/services/reviewsApi.ts`.

## Technology and layout

- Frontend: React 18, TypeScript, Vite, React Router 6, Zustand, Axios and Tailwind CSS.
- Backend: Node.js, Express, TypeScript, SQL Server (`mssql`), Zod, JWT and Nodemailer.
- Database: SQL Server with ordered, checksummed migrations; Coach uses `0007`, Member Workout execution uses additive `0008`, and Admin Coach status uses additive `0009`.

```text
backend/         Express API and acceptance scripts
frontend/        React/Vite application
db/migrations/   Ordered SQL Server migrations
docs/            Canonical technical docs and archive
logs/            Curated historical project evidence
```

## Quick start

Configure local variables using [Setup and Environment](docs/SETUP_AND_ENVIRONMENT.md); never commit `.env` or secrets.

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

Use [Database and Migrations](docs/DATABASE_AND_MIGRATIONS.md) before any migration operation. The canonical database must not be used for acceptance mutations.

## Contribution

Use explicit branches and explicit staging. Do not push automatically. See [`CONTRIBUTING.md`](CONTRIBUTING.md) and the [documentation governance](docs/DOCUMENTATION_GOVERNANCE.md).
