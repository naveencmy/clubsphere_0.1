# Better Auth setup

ClubSphere uses Better Auth for email/password signup, sign-in, Google OAuth and HTTP-only database sessions. Auth routes are mounted under `/api/auth/session` before Express body parsers. Existing business endpoints remain available; their authentication middleware also accepts verified Better Auth cookies.

## Local setup

```powershell
cd backend
npm ci
# Only if the local clubsphere database does not exist:
node scripts/initializeDatabase.js
npm run dev
```

The initializer creates only the missing local `clubsphere` database and applies the unchanged `documents/schema.sql`. It refuses to modify an existing database or connect to a remote host. No demo accounts are seeded.

Set `DATABASE_URL` in the ignored `backend/.env` if PostgreSQL uses different connection details. Set a private, random `BETTER_AUTH_SECRET` of at least 32 characters, and `BETTER_AUTH_URL=http://localhost:4000`. A private local secret was generated during implementation; it is ignored by Git. Production requires an explicit secret and HTTPS URL.

Starting the server normalizes credential `account_id` values to their owning user ID for Better Auth 1.7 compatibility. Account IDs, password hashes and business records are preserved. Existing bcrypt passwords continue to work. Self-registration cannot choose a privileged role.

Run the frontend separately with `cd frontend; npm ci; npm run dev`. Sign up with a name, email and your own password, then use those credentials to sign in. Roles come from server-side club memberships, rather than the old account selector. Existing mock club workflows remain separate from authentication; real sign-in alone does not turn every prototype workflow into a production API integration.

## Google

Configure a Google OAuth Web application and add these values privately in `backend/.env`:

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Authorize `http://localhost:4000/api/auth/session/callback/google` as the redirect URI and restart the backend. For deployment, use the corresponding HTTPS server URL and frontend trusted origin. Secrets stay on the server. Without credentials, the Google button displays an unavailable message and email sign-in remains functional.

References: [Better Auth Express integration](https://better-auth.com/docs/integrations/express), [Google configuration](https://better-auth.com/docs/authentication/google), [email and password](https://better-auth.com/docs/authentication/email-password).

## Verification

```powershell
cd backend
node --test test/integration/betterAuth.test.js
cd ../frontend
npm run build
npx playwright test --config playwright.auth.config.js
```

Tests use local PostgreSQL, create uniquely named test accounts, and delete only those accounts afterward. Browser verification runs an isolated backend on port 4001 and a production preview on 4173; it does not stop an existing backend on 4000. Google account consent and external callback completion require configured OAuth credentials and are not claimed as verified.
