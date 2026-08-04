# UI Visual QA V4

## P16_PUBLIC_VISUAL_QA_PASS (public shell and controls)

- Browser: Codex In-app Browser against the local Vite server at `http://127.0.0.1:5173`.
- Public Home was opened and inspected at `375x812`, `768x1024`, and `1440x900`.
- At all three sizes: no horizontal overflow, header remains within the viewport, hamburger remains visible/clickable, and the public drawer width stays within the requested limit.
- The 375px screenshot was inspected with the drawer open: overlay, tonal surfaces, icon menu items, active Home state, and account group are visible without clipping.
- Drawer interaction verified: hamburger opens, overlay closes, Escape closes, body scroll is restored, focus returns to the hamburger, and the drawer contains Home, Shop, Exercises, Coaches, Videos, Pricing, Blog, About, Kênh người bán, and Dashboard with the source routes.
- Edge hover was intentionally skipped for usability; hamburger remains the primary and predictable open gesture on desktop and touch.
- SPA history verified: drawer Shop navigates to `/products`; browser Back returns to `/`; browser Forward returns to `/products`.
- Public login controls were inspected at `375x812`: email/password controls have dark background, readable primary text, visible border, and muted placeholder; no white-on-white control was observed.
- Browser console contained only existing React Router future-flag warnings; no runtime error was observed for the public shell.

## Protected-page limitation

- The browser had no authenticated test session and no credentials were provided. Opening `/settings` rendered the existing login guard, so authenticated visual verification of Complaint, Seller Application, Referral, Settings, and Member/Coach/Admin/Seller Dashboard content was not possible without transmitting credentials or changing auth state.
- Those pages were reviewed through source and shared styling changes; their API/submit/business flows were not exercised.

## QA result

- Public responsive shell: PASS
- Public drawer interaction: PASS
- Public form-control visibility: PASS
- Authenticated target-page visual QA: NOT RUN — requires a supplied test session
- Full P16 verdict: PARTIALLY_COMPLETE because protected target pages require a supplied test session.
