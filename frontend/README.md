# ClubSphere frontend

Local React/Vite prototype implementing the documented ClubSphere workflows. Production backend and SQL remain unchanged. All payments, delivery, identity verification and permissions are demonstrations.

```powershell
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. Use the labeled demo account selector to explore Student, Member, Volunteer, Committee Lead, Treasurer, President and Auditor experiences. The active club selector demonstrates club-specific roles and record isolation. The first account is a public visitor.

```powershell
npm run build
npm test
npm run test:e2e
npm run format:check
```

Source code uses Prettier with 2-space indentation and a 100-character print width. Run `npm run format` to format JSX, JavaScript, CSS and tests. Generated bundles, lockfiles and browser artifacts are excluded.

Browser tests use installed Google Chrome (`channel: chrome`). Install Chrome first, or change `playwright.config.js` to your installed browser channel.
`npm run test:e2e` builds the app first and tests the production preview on port 4173, so development reloads cannot interrupt rendered audits.

State persists under `clubsphere-demo-v1` in local browser storage. Demo Settings provides negative scenarios, time advance and reset. Receipts are stored locally; uploads are capped at 3 MB. Inter and JetBrains Mono are bundled with the build. Runtime assets do not depend on external CDNs.

Set `VITE_DEMO_CONTROLS=false` before building to hide scenario/account controls. The entire application still uses the mock adapter: disabling controls does not make authentication or payments production-ready.

UI imports `src/services/serviceFactory.js`. Replace its adapter with real API implementations when backend integration is configured. `apiClient.js` provides an optional REST transport; it is not invoked by the prototype. All seed records are under `src/mock/`.

See SCREEN_INVENTORY.md, WORKFLOW_ASSUMPTIONS.md, FRONTEND_WORKFLOW_AUDIT.md and DESIGN_COMPLIANCE_AUDIT.md for requirements, decisions and executed verification evidence.

Commit `package-lock.json` for reproducible dependency installation. Git excludes local dependencies, build output, environment secrets, browser reports and traces. Audit screenshots and JSON summaries are retained as verification evidence.
