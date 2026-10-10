# Account and role access

Open `/register` to create an account with your name, email and password. Open `/login` to sign in with those credentials, or use Google once the server's OAuth provider is configured.

The demo account selector is removed. Mock profile emails are not login credentials. No shared role passwords or privileged accounts are created automatically. New accounts receive the default student system role. Volunteer, Committee Lead, Treasurer, Coordinator and Incharge access requires the corresponding server-side club membership; Auditor access requires the server-assigned campus auditor role.

Better Auth verifies the account and session. The frontend loads role assignments from `/api/auth/workspace` and uses no email-based mapping to grant a seeded role.

See [authentication setup](../backend/AUTHENTICATION_SETUP.md) for server configuration and Google redirect settings. The separate club workflow prototype retains its mock data and services.
