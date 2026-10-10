# ClubSphere frontend

React/Vite frontend following `documents/DESIGN.md`. Login and signup use Better Auth with PostgreSQL sessions, email/password credentials and an optional Google provider. Business workflows still include prototype adapters; real sign-in does not make payments, delivery or every domain action production-ready.

Start the backend first using [AUTHENTICATION_SETUP.md](../backend/AUTHENTICATION_SETUP.md), then run:

```powershell
cd frontend
npm ci
npm run dev
```

Register at `/register` with your own email and password, then sign in at `/login`. Roles come from verified server-side memberships. [ROLE_ACCESS.md](ROLE_ACCESS.md) explains access; mock emails are not login credentials. The public footer and demo account toolbar are removed.

```powershell
npm run build
npm test
npm run test:auth
npx playwright test tests/browser/landing-redesign.spec.js
```

Authentication browser checks use installed Google Chrome, local PostgreSQL, an isolated backend on port 4001 and a production preview on 4173. They create uniquely named test accounts and delete only those accounts afterward. Google consent/callback completion needs private OAuth credentials; missing-configuration behavior is verified locally.

`npm run test:e2e` contains the earlier prototype browser suite. Its demo-account fixtures predate real authentication and require migration before verifying protected screens against the current server. `npm test` retains the core workflow regression checks.

Source uses Prettier with 2-space indentation and a 100-character print width. Run `npm run format` or `npm run format:check` for formatting. Inter and JetBrains Mono are bundled. UI records and test account factories live under `src/mock/`.

Vite development and preview servers proxy `/api` to localhost:4000. `VITE_API_PROXY_TARGET` overrides that target for isolated tests. Authentication normally uses this same-origin proxy. OAuth secrets remain on the backend. Production hosting must route `/api` to the backend and configure trusted origins/HTTPS.

See SCREEN_INVENTORY.md, WORKFLOW_ASSUMPTIONS.md, FRONTEND_WORKFLOW_AUDIT.md and DESIGN_COMPLIANCE_AUDIT.md for requirements and evidence. Earlier audit sections describe the prototype at the time of verification; the latest auth and landing sections supersede those behaviors.

Commit lockfiles for reproducible installs. Git excludes dependencies, builds, local environment secrets, browser reports and traces. Audit screenshots and JSON summaries are retained as evidence.
