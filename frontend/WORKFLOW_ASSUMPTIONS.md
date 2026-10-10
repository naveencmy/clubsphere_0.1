# Workflow decisions

The official PDF defines six semester scenarios. The attached frontend specification and its design override define the prototype deliverables. Repository documents remain unchanged.

- DESIGN.md overrides the PRD's embedded alternative radius/shadow tokens and the plan's conflicting scanner tones: use 440 Hz sine, 50 ms success vibration, 1,200 ms reset; rejection uses a low 180 Hz buzz and the documented triple vibration, with explicit dismissal.
- The implementation plan supplies the latest canonical ticket RESERVED and expense UNDER_REVIEW / NEEDS_CORRECTION states, although older embedded DDL omits them.
- A claim of exactly ₹2,500 requires President approval. No accrual occurs at Treasurer approval for these claims. Budget commitment follows final approval, rather than older views that count all Treasurer approvals.
- Cash clearing account 1010 represents simulated cash. Revenue uses 4010–4040. Supplies use 5020 as specified in the implementation plan; damaged merchandise uses 5030. These are prototype accounting conventions, not modifications to the SQL chart.
- Grace lasts 14 complete days after expiry. ACTIVE, RENEWAL_DUE and GRACE_PERIOD retain discounts; EXPIRED and REVOKED do not. Renewal extends from the later of expiry or current demo date.
- Committee Leads draft announcements, Treasurers review drafts, Presidents publish, following the blueprint's restrictive action matrix. Auditors are read-only.
- Payment, mail delivery, membership QR identity and authorization are local simulations. No card details, real payments, real emails, database or production backend are used. QR payloads rotate but are explicitly not cryptographically secure.
- The prototype uses versioned browser storage. All mutations run through Promise-based services, immutable transactions and permission checks. Single-browser concurrency is serialized; multi-device concurrency requires the future backend.
- Cameras request an ideal 60 fps; actual frame rate depends on the device. BarcodeDetector is feature-detected with manual entry as a fallback. Hardware camera/audio/haptics require separate device verification.
- Two clubs share the platform but isolate records. Demo accounts have club-specific roles. Visitor content uses the selected club; account/club/scenario controls are explicitly demo controls and can be disabled with VITE_DEMO_CONTROLS=false.
- Fonts are bundled locally (Inter and JetBrains Mono). Google Sans is preferred if installed. No network font dependency is required at runtime.
- Eligible members receive the PRD's 48-hour early ticket sales window. Released seats promote the next waiting student into an exclusive four-hour booking window; expired windows advance the queue, and reserved holds release through the shared demo clock.
- Primary and status tokens are retained exactly. Small colored text uses documented darker brand/neutral colors when needed for WCAG contrast; warning uses dark text on the amber surface. Contrast is verified separately from token presence.

Unresolved production concerns: secure rotating signed passes, server-enforced RBAC/RLS, real delivery/payment integrations, browser-independent QR decoding, production cache synchronization and authoritative multi-device locking are outside this frontend task.
