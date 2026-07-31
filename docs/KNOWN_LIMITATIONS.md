# Known Limitations

- TASK-008 workout programs, assignments, sessions and progress are not implemented. Existing public Exercises/WorkoutPrograms UI must be audited before reuse.
- AI recommendations, camera, pose estimation, automatic rep counting, medical diagnosis, nutrition, wearables and live coaching are out of scope.
- Product Order bank reconciliation and refunds are manual records; no bank/Stripe API performs settlement.
- Legacy membership payment/configuration is separate from Product Order payment.
- Product image coverage is intentionally limited to verified assets (canonical baseline: 1 ProductImages row).
- Final TASK-007 backend lint passed with 58 pre-existing warnings; frontend production build passed with a non-blocking chunk-size warning.
- Legacy operational modules remain outside TASK-008 refactoring scope and use mixed controller/service patterns.
- Authenticated Marketplace browser journeys are not automated because no safe Playwright/Cypress fixture lifecycle exists. API/security acceptance uses disposable databases; canonical credentials are never created for browser testing.
- Live Product Order SMTP is environment-dependent and was not exercised in SELLER-013. The guarded deterministic acceptance transport passed; commerce commits before best-effort delivery.
- Frontend has no lint script. Backend retains warning-only `no-explicit-any` debt and the frontend production build retains a Vite large-chunk advisory.
- Carrier integration, automated bank refund/payout, full RMA, automated clawback, Seller wallet/escrow, AI moderation and Seller review replies remain outside Marketplace MVP.
- Team Summary: `NOT FOUND`.
- Browser-local token persistence remains a deliberate compatibility constraint; XSS prevention, exact CORS allowlists and strict CSP/Helmet remain important. A future cookie-based redesign requires a separate CSRF threat-model review.

Real Gmail, Bank/QR, authenticated Customer and Admin browser flows are verified; older contrary limitations are fixed and superseded.

Auth/RBAC closure reports manual browser evidence only and does not claim Codex browser automation PASS.

The canonical post-migration smoke run confirmed health and Admin login/me, but refresh rotation/logout revocation was inconclusive and requires a clean follow-up smoke run.
Dashboard limitation: the current backend has no Coach-scoped dashboard/schedule endpoint, so the Coach dashboard intentionally renders an unavailable state instead of inventing counts or sessions. Authenticated Member, Coach and Admin desktop/mobile acceptance and account switching passed on 2026-07-16. Browser screenshot capture timed out, so visual evidence used rendered DOM, role navigation and measured overflow rather than persisted screenshots.
