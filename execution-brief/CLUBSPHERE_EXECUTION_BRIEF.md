Implement the complete ClubSphere React frontend specified below, with shared persistent mock services and connected student, volunteer and management workflows.

Work in D:/clubsphere_0.1. Read all required repository documents and the official problem statement before implementation. The final design compliance override takes precedence over secondary visual references.

# MASTER IMPLEMENTATION PROMPT — CLUBSPHERE COMPLETE FRONTEND

## ROLE AND OBJECTIVE

Act as a Principal Frontend Engineer, Senior React Architect, Product Designer, and UX Workflow Specialist.

Your responsibility is to design and implement the **complete, polished, responsive, fully navigable and interactive ClubSphere frontend** for the existing repository:

https://github.com/naveencmy/clubsphere_0.1

ClubSphere is a unified student organization management platform based on the official Skyline Student Association problem statement.

The product solves disconnected workflows for:

1. Membership registrations, benefits and renewals.
2. Event discovery, ticket purchases and attendance.
3. Merchandise e-commerce and stock management.
4. Announcements and member communication.
5. Volunteer tasks, fundraisers and shift coordination.
6. Expense reimbursements, financial accounting and budgets.

This is a frontend-focused implementation task.

Build a complete functional frontend prototype using a centralized mock service layer, ready for future backend integration.

**Do not implement or modify the production backend, SQL schema, database policies, or real payment infrastructure.**

Do not present simulated operations as real transactions.

The final result must look like a cohesive production-quality SaaS application, not a static design showcase.

---

# 1. MANDATORY REPOSITORY ANALYSIS

Before writing frontend code, read these files completely:

- `Student_Organization_System.pdf`
- `README.md`
- `documents/README.md`
- `documents/DESIGN.md`
- `documents/PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md`
- `documents/TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md`
- `documents/IMPLEMENTATION_PLAN.md`

Treat the latest repository documents as the authoritative source for functional behavior.

Apply this precedence:

1. Official Skyline problem statement for mandatory product scope.
2. Latest ClubSphere PRD for business requirements.
3. Latest Implementation Plan for detailed operational workflows.
4. Technical Architecture Blueprint for API contracts, entity names and integration assumptions.
5. ClubSphere DESIGN.md for branding, component design and interactions.
6. External visual references for supplementary layout inspiration only.

Where documentation conflicts, do not silently invent a different workflow. Preserve the most recent explicitly defined functional behavior and record unresolved conflicts in `frontend/WORKFLOW_ASSUMPTIONS.md`.

Before implementation, create an internal screen and feature inventory mapping each documented workflow to a frontend route and component.

All required workflows must be implemented or explicitly represented with transparent simulated behavior.

---

# 2. DESIGN SYSTEM AND VISUAL DIRECTION

## 2.1 Design reference

Review the following:

Primary:
https://getdesign.md/ibm/design-md

Secondary:
https://getdesign.md/airtable/design-md

Task interaction:
https://getdesign.md/linear.app/design-md

Study the structure and visual principles of these references.

Use:

- IBM-inspired structured dashboard organization.
- Airtable-inspired tables, filtering and data-management interactions.
- Linear-inspired Kanban and task-management usability.

Do not copy their proprietary branding or create a visually inconsistent hybrid.

**Important: Preserve the existing ClubSphere DESIGN.md as the main design authority.**

Do not overwrite the repository's DESIGN.md with an external template.

Use external references only for design inspiration.

## 2.2 Visual identity

Product name: ClubSphere

Product personality:

- Professional but student-friendly.
- Modern campus SaaS platform.
- Clean and trustworthy.
- Clear navigation and strong information hierarchy.
- Premium visual finish without excessive decoration.

Follow existing design tokens:

Primary blue: `#1A73E8`
Hover blue: `#1557B0`
Background: `#F8F9FA`
Surfaces: `#FFFFFF`
Main text: `#0F172A`
Secondary text: `#64748B`
Success: `#1E8E3E`
Warning: `#F9AB00`
Danger: `#D93025`

Typography:

- Google Sans where available, with Inter fallback.
- JetBrains Mono for reference identifiers and financial figures.
- Use consistent heading, body and caption scales from DESIGN.md.

Design rules:

- Light theme as the default.
- Restrained shadows and clean borders.
- Consistent 8px-based spacing.
- Rounded cards and accessible controls.
- Clear page headings, descriptions and primary actions.
- High information density without crowding.
- Consistent tables, drawers, modals and status badges.
- Responsive desktop and mobile layouts.
- No generic oversized gradient dashboards.
- No random decorative illustrations.
- No unnecessary animations.
- No emoji icons in place of interface icons.
- Prefer Lucide React icons.
- Respect reduced-motion preferences.
- Use semantic status colors only when meaningful.

Every route must share the same visual language.

## 2.3 Application shells

Build three primary interface shells.

### A. Public website shell

Used by visitors and non-members.

Contains:
- Brand header.
- Navigation.
- Club overview.
- Events discovery.
- Membership information.
- Merchandise catalog.
- Public announcements.
- Login and registration.
- Footer.

### B. Student and volunteer portal shell

Contains:
- Collapsible sidebar on desktop.
- Mobile navigation.
- Club switcher where authorized.
- Global search.
- Notifications.
- User profile menu.
- Breadcrumbs.
- Main content area.

### C. Club management shell

Contains:
- Role-aware sidebar.
- Club selector.
- Overview dashboard.
- Members.
- Events and tickets.
- Door scanner.
- Merchandise.
- Tasks and fundraisers.
- Announcements.
- Expenses.
- Finance and budgets.
- Reports.
- Settings.

The President, Treasurer, Committee Lead and Volunteer must receive appropriately restricted navigation and actions.

Never rely on hiding frontend buttons as actual security enforcement. Mock permissions are for demonstration only; future real authorization must be enforced server-side.

---

# 3. TECHNOLOGY REQUIREMENTS

Use:

- React with Vite.
- JavaScript ES modules and JSX.
- React Router for navigation.
- Tailwind CSS using a compatible modern Vite setup.
- Lucide React for icons.
- Recharts for charts.
- React Hook Form and Zod for forms where appropriate.
- TanStack Table for complex data tables where useful.
- A maintainable global state approach such as Context plus reducers or Zustand.
- Existing project dependencies where suitable.

Do not introduce unnecessary large libraries.

Use reusable components rather than duplicating similar UI.

No Next.js, no TypeScript conversion, and no backend replacement.

All routes must work through client-side navigation.

The application must launch locally with normal Vite commands.

---

# 4. CRITICAL MOCK-DATA ARCHITECTURE

THIS SECTION IS MANDATORY.

**All mock data must live in a separate folder. No mock datasets may be defined inside React components, pages, hooks or JSX files.**

Create:

```text
frontend/
└── src/
    ├── app/
    │   ├── App.jsx
    │   ├── router.jsx
    │   └── providers/
    │
    ├── components/
    │   ├── common/
    │   ├── layout/
    │   ├── forms/
    │   ├── tables/
    │   ├── charts/
    │   └── feedback/
    │
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── memberships/
    │   ├── events/
    │   ├── ticketing/
    │   ├── scanner/
    │   ├── commerce/
    │   ├── fundraisers/
    │   ├── tasks/
    │   ├── broadcast/
    │   ├── expenses/
    │   ├── finance/
    │   ├── budgets/
    │   ├── reports/
    │   └── settings/
    │
    ├── mock/
    │   ├── data/
    │   │   ├── users.js
    │   │   ├── clubs.js
    │   │   ├── memberships.js
    │   │   ├── membershipPlans.js
    │   │   ├── events.js
    │   │   ├── ticketTiers.js
    │   │   ├── tickets.js
    │   │   ├── checkIns.js
    │   │   ├── products.js
    │   │   ├── productVariants.js
    │   │   ├── orders.js
    │   │   ├── tasks.js
    │   │   ├── fundraisers.js
    │   │   ├── volunteerShifts.js
    │   │   ├── announcements.js
    │   │   ├── announcementRevisions.js
    │   │   ├── announcementDeliveries.js
    │   │   ├── expenseClaims.js
    │   │   ├── budgets.js
    │   │   ├── ledgerEntries.js
    │   │   └── notifications.js
    │   │
    │   ├── services/
    │   │   ├── authMockService.js
    │   │   ├── membershipMockService.js
    │   │   ├── eventMockService.js
    │   │   ├── commerceMockService.js
    │   │   ├── taskMockService.js
    │   │   ├── broadcastMockService.js
    │   │   ├── expenseMockService.js
    │   │   ├── financeMockService.js
    │   │   └── notificationMockService.js
    │   │
    │   ├── scenarios/
    │   │   ├── demoAccounts.js
    │   │   ├── skylineScenario.js
    │   │   └── edgeCases.js
    │   │
    │   ├── fixtures/
    │   ├── mockStore.js
    │   ├── mockStorage.js
    │   └── resetMockData.js
    │
    ├── services/
    │   ├── apiClient.js
    │   ├── serviceFactory.js
    │   └── contracts/
    │
    ├── hooks/
    ├── utils/
    ├── styles/
    └── assets/
```

This is the target logical structure; it may be adapted slightly if the repository already contains a better equivalent organization.

## 4.1 Strict mock-data rules

1. Never define seed arrays of students, events, products, transactions or tasks inside `.jsx` files.
2. Never embed fake API responses inside UI components.
3. Never store multiple disconnected copies of the same domain records.
4. Never generate random demo data on every render.
5. Avoid hardcoded user IDs or organization IDs inside components.
6. Derive chart and dashboard values from shared mock records.
7. Keep scenario and edge-case fixtures in the mock folder.
8. Keep API response mapping separate from React presentation.
9. Use immutable updates or equivalent controlled state changes.
10. Keep services replaceable by real backend calls.

## 4.2 Mock service behavior

Mock service functions must:

- Return Promise-based results.
- Use realistic loading delays.
- Support deliberate failure simulation.
- Validate domain rules.
- Return predictable errors.
- Update shared mock state.
- Persist browser demo changes where appropriate.
- Survive refresh using versioned local storage or IndexedDB.
- Support a full Reset Demo Data action.
- Prevent invalid repeated state transitions.
- Work without an internet connection after dependencies/assets are available locally.

All financial amounts must be stored as integer minor units (paise) and formatted in INR for display.

Use names and example amounts that fit the Indian college demonstration, without changing the functional requirements.

## 4.3 Cross-module mock consistency

A successful simulated membership payment must:

- Activate or renew the membership.
- Update member eligibility.
- Produce a payment record.
- Update finance summaries.

A successful simulated ticket payment must:

- Confirm the ticket.
- Update seat availability.
- Update ticket history.
- Update revenue.
- Generate check-in eligibility.

A merchandise payment must:

- Confirm the order.
- Update stock.
- Update sales history.
- Update finance summaries.

An approved expense must:

- Update approval status.
- Create the appropriate simulated payable.
- Affect budget utilization.

A recorded disbursement must:

- Clear the payable.
- Reduce available funds.

A fundraiser donation must:

- Update the fundraiser's raised amount.
- Produce a matching finance record.

A refunded transaction must reverse the appropriate revenue or financial effect.

Dashboard figures must always reflect the same shared domain state used by the underlying pages.

## 4.4 Simulated payments

Build a clearly labeled demo payment flow with actions:

- Simulate Successful Payment.
- Simulate Failed Payment.
- Simulate Cancelled Payment.
- Simulate Delayed Confirmation.

Do not collect real card information.

Do not connect to actual Stripe or another payment gateway.

Do not describe demo payments as settled real funds.

The frontend must be prepared to replace this mock adapter with a real payment integration later.

---

# 5. DEMO USERS, CLUBS AND ROLE MANAGEMENT

Create realistic demo accounts in `src/mock/scenarios/demoAccounts.js`.

Include:

- Public Visitor.
- Guest Student.
- Active Club Member.
- Grace-Period Member.
- Expired Member.
- Volunteer.
- Committee Lead.
- Club Treasurer.
- Club President.
- Compliance Auditor, if the PRD includes that role.

Provide a development-only Demo Role Switcher that is clearly marked as a demo feature and can be disabled for production.

Include at least two distinct mock clubs to test club switching and data isolation.

Demonstrate that:

- A member can belong to multiple clubs.
- Each membership has club-specific eligibility.
- Club A events and financial records are separate from Club B.
- User roles can differ between clubs.
- Unauthenticated visitors can access public content.
- Unauthorized actions show an appropriate access-denied state.

Build:

- Login.
- Register.
- Logout.
- Session loading.
- Demo account selection.
- User profile.
- Edit profile.
- Change active club.
- Access-denied page.
- Not-found page.
- Session-expired feedback.

Role-specific pages and actions must remain consistent with the PRD's access-control matrix.

---

# 6. COMPLETE PUBLIC WEBSITE

Create a polished public-facing ClubSphere website.

Routes should include:

- `/`
- `/clubs`
- `/clubs/:clubSlug`
- `/events`
- `/events/:eventId`
- `/membership`
- `/store`
- `/announcements`
- `/login`
- `/register`

Home page sections:

1. Navigation and brand.
2. Concise hero explaining ClubSphere.
3. Upcoming events.
4. Featured student clubs.
5. Membership benefits.
6. Merchandise preview.
7. Latest public announcements.
8. How membership works.
9. Join-club call to action.
10. Footer.

Public visitors must be able to:

- Browse clubs.
- See public events.
- View public ticket pricing.
- Browse merchandise.
- Read public announcements.
- Understand membership benefits.
- Start registration.
- Discover why member pricing is different.

Do not make the public website a disconnected marketing mockup. It must reuse the same data as the authenticated portal.

---

# 7. STUDENT DASHBOARD

Create `/portal/dashboard`.

Include:

- Personalized greeting.
- Active club indicator.
- Membership status card.
- Membership renewal countdown.
- Digital member pass shortcut.
- Upcoming registered events.
- Available events.
- My ticket summary.
- Recent merchandise orders.
- Latest announcements.
- Unread notification count.
- Volunteer tasks, if applicable.
- Relevant quick actions.

Quick actions:

- View Membership Pass.
- Renew Membership.
- Explore Events.
- My Tickets.
- Shop Merchandise.
- View Announcements.

Every quick action must navigate to a working feature.

Do not create inert buttons.

---

# 8. MEMBERSHIP MANAGEMENT WORKFLOW

## Student screens

Implement:

- Club membership landing page.
- Select membership plan.
- Membership registration form.
- Dues payment screen.
- Payment success/failure feedback.
- Membership status details.
- Digital QR membership pass.
- Membership benefits.
- Membership renewal screen.
- Membership payment history.
- Renewal reminder notifications.

Membership lifecycle:

`PENDING_PAYMENT → ACTIVE → RENEWAL_DUE → GRACE_PERIOD → EXPIRED`

Include:

- Waived-fee or free membership when configured.
- Membership registration for existing users.
- Member ID and club details.
- Membership start and expiry dates.
- QR identity card.
- Status badge.
- Benefit eligibility.
- Renewal countdown.
- Expired-state messaging.

Reminder milestones:

- 30 days before expiry.
- 7 days before expiry.
- 1 day before expiry.
- Expiry date.
- 14-day grace period.
- Hard expiry.

Grace-period members must retain member ticket and merchandise discounts, following the current ClubSphere plan.

Expired members must lose discount eligibility.

Demo time controls can simulate lifecycle changes without waiting days.

Use a centralized eligibility function so ticketing and commerce cannot disagree.

## Admin screens

Implement:

- All Members.
- Member Details.
- Search and filters.
- Active, Pending, Grace, Expired views.
- Payment status.
- Membership plan settings.
- Renewal history.
- Member verification.
- Export members, if supported by the PRD.

Actions must update the shared mock membership records.

---

# 9. EVENT MANAGEMENT AND TICKETING

## Admin event pages

Implement:

- Event list.
- Create event.
- Edit event.
- Event details.
- Ticket tier configuration.
- Member/non-member pricing.
- Capacity settings.
- Registration opening and closing dates.
- Publish/unpublish.
- Event booking list.
- Attendee list.
- Waitlist management.
- Attendance dashboard.
- Event reconciliation report.

## Student event pages

Implement:

- Event discovery.
- Search and filters.
- Event detail page.
- Ticket tier selection.
- Price comparison.
- Reservation summary.
- Reservation countdown.
- Demo checkout.
- Payment result.
- Ticket confirmation.
- My Tickets.
- Individual ticket details.
- QR ticket display.
- Ticket status history.

## Ticket lifecycle

Implement:

`AVAILABLE → RESERVED → PAYMENT_PENDING → ISSUED → CHECKED_IN`

Include separate handling for:

- Payment failure.
- Reservation expiry.
- Sold-out capacity.
- Cancelled booking.
- Refunded ticket.
- Duplicate payment callback.
- Late payment after reservation expiry.
- Already checked-in ticket.
- Booking after sales close.

The 10-minute reservation must be simulated using centralized mock state.

Reservation expiry must release seats.

Successful payment must issue exactly one ticket.

Late payment on an expired reservation must show a simulated refund or resolution state without overselling.

## QR scanner

Create a dedicated mobile-friendly scanner page.

Two modes:

**Mode A — Event ticket check-in**

- Select event.
- Scan or enter ticket code.
- Verify ticket.
- Display attendee details.
- Confirm admission.
- Reject duplicate admission.
- Show expired, cancelled, invalid and wrong-event states.
- Record attendance.

**Mode B — General member verification**

- Scan member pass.
- Display name, tier, photo and expiry.
- Show active, grace-period, expired and invalid states.

Support a manual code-entry fallback for demo environments without camera access.

Camera access must require permission.

If camera support is unavailable, show a helpful fallback instead of breaking the page.

Mock verification must not falsely claim production-level cryptographic security.

## Event analytics

Include:

- Total capacity.
- Reserved seats.
- Confirmed tickets.
- Actual attendance.
- Attendance percentage.
- Revenue by ticket tier.
- Event-specific approved expenses.
- Event surplus.
- Downloadable summary where practical.

Exclude unpaid, cancelled and refunded transactions from confirmed revenue.

---

# 10. MERCHANDISE AND INVENTORY

## Student storefront

Create:

- Product catalog.
- Product details.
- Size and color variant selector.
- Member/non-member price comparison.
- Product availability.
- Cart.
- Checkout.
- Order confirmation.
- My Orders.
- Order details.
- Cancellation request.
- Return request.
- Refund status.

Product variants must come from centralized mock data.

## Commerce lifecycle

Implement:

`PENDING → PAID → PROCESSING → FULFILLED`

Handle:

- Failed payment.
- Abandoned cart.
- Inventory hold expiration.
- Out-of-stock variant.
- Pre-fulfillment cancellation.
- Refund initiated.
- Refund completed.
- Post-fulfillment return.
- Sellable returned item.
- Damaged returned item.

Reservation duration: 10 minutes.

Never let the mocked inventory sell more than available.

## Inventory management

Admin pages:

- Products.
- Add/edit product.
- Product variants.
- Stock by size.
- Low-stock alerts.
- Stock adjustment.
- Orders.
- Fulfillment queue.
- Pickup details.
- Returns and inspection.

Use meaningful inventory status badges.

## Return safeguards

Before fulfillment:

- Cancel order.
- Process simulated refund.
- Release or restore stock once.

After fulfillment:

- Receive return request.
- Record inspection.
- If sellable, restore stock.
- If damaged, record write-off without restoring saleable stock.
- Record refund outcome.

All actions must update order history and financial summaries consistently.

---

# 11. VOLUNTEER TASK MANAGEMENT

Implement a five-column Kanban board:

`BACKLOG → TODO → IN_PROGRESS → BLOCKED → DONE`

Pages:

- Tasks overview.
- My Tasks.
- Event Tasks.
- Fundraiser Tasks.
- Kanban board.
- Task details.
- Create task.
- Edit task.

Features:

- Assigned volunteer.
- Creator.
- Due date.
- Priority.
- Checklist.
- Task description.
- Event association.
- Fundraiser association.
- Status changes.
- Drag-and-drop.
- List view.
- Search and filters.
- Overdue indicators.
- Unassigned task alerts.
- Completion progress.

Volunteer actions must affect admin task dashboards immediately.

Prevent invalid assignments to users outside the applicable club.

Support empty and blocked states.

---

# 12. FUNDRAISER MANAGEMENT

Build:

- Fundraiser list.
- Create fundraiser.
- Fundraiser details.
- Monetary target.
- Amount raised.
- Progress percentage.
- Linked tasks.
- Volunteer shifts.
- Volunteer signup.
- Donations and sales.
- Fundraiser expenses.
- Financial summary.
- Health indicators.

Health states:

- HEALTHY.
- AT_RISK.
- CRITICAL.

Show why a fundraiser received its health status.

## Volunteer shift workflow

Organizer creates shift → Volunteer claims shift → Assignment visible → Volunteer can release shift according to rules → Organizer monitors coverage.

Include:

- Shift date/time.
- Role title.
- Available slots.
- Assigned volunteers.
- Unfilled shifts.
- Shift conflicts.
- Volunteer schedule.

## Fundraiser finance workflow

A simulated confirmed donation or bake-sale transaction must:

- Create a fundraiser-linked financial record.
- Increase fundraiser income.
- Update the raised amount.
- Update the treasurer's figures.

A reversed or refunded transaction must reduce the displayed collected amount appropriately.

Never count the same payment twice.

---

# 13. ANNOUNCEMENTS AND BROADCAST HUB

Implement both student-facing and admin-facing views.

## Admin

- Announcement list.
- Create announcement.
- Rich Markdown editor.
- Target audience selector.
- Public/member/committee targeting.
- Preview.
- Publish.
- Pin/unpin.
- Announcement details.
- Edit announcement.
- Revision history.
- Delivery status tracking.
- Searchable archive.

Audience options:

- ALL_MEMBERS.
- COMMITTEE_ONLY.
- PUBLIC.

Use the latest documentation's canonical values.

## Student

- Announcement feed.
- Public announcements.
- Member-only announcements.
- Search.
- Filters.
- Read/unread state.
- Pinned posts.
- Notification details.
- Announcement history.

## Broadcast states

Simulate:

`QUEUED → SENT → DELIVERED`

Failure outcomes:

- FAILED.
- BOUNCED.

Reading an announcement is separate from email delivery.

An announcement edit must produce an additional revision rather than destroying the previous published content.

Show original publication time and most recent update time clearly.

Use mock delivery services; do not send actual email.

---

# 14. EXPENSE REIMBURSEMENT WORKFLOW

Implement a complete volunteer expense submission and approval experience.

## Volunteer pages

- My Expenses.
- New Expense.
- Edit Draft.
- Upload Receipt.
- Expense Details.
- Expense Timeline.
- Correct and Resubmit.
- Reimbursement History.

Expense form fields:

- Merchant.
- Purchase date.
- Category.
- Amount.
- Purpose.
- Club.
- Event association.
- Fundraiser association.
- Budget association.
- Receipt image or PDF.

Receipt upload must be mandatory for submitted claims.

Do not implement OCR.

## Expense lifecycle

`DRAFT → SUBMITTED → UNDER_REVIEW`

Possible decisions:

- NEEDS_CORRECTION.
- REJECTED.
- TREASURER_APPROVED.

Correction flow:

`NEEDS_CORRECTION → EDIT → RESUBMIT → SUBMITTED`

Approval rules:

For claims below ₹2,500:
- Treasurer approval is final.
- Simulated expense accrual is recorded.

For claims of ₹2,500 or more:
- Treasurer approves.
- President gives final approval.
- Expense accrual is recorded only after final approval.

Disbursement:

- Finance officer records payment.
- Expense becomes DISBURSED.
- Outstanding payable decreases.
- Cash balance decreases.

## Treasurer expense desk

Include:

- Submitted claims.
- Under review.
- Awaiting president approval.
- Approved.
- Rejected.
- Disbursed.
- Search and filters.
- Receipt image lightbox.
- Approval history.
- Rejection reason.
- Correction request.
- Payment confirmation.

Prevent users from approving their own claims.

For demo purposes, explain why an action is unavailable.

---

# 15. FINANCE AND TREASURER DASHBOARD

This is a critical module.

The treasurer needs to understand:

**What came in? What went out? How much is left?**

## Main dashboard

Show:

- Membership dues collected.
- Event ticket revenue.
- Merchandise revenue.
- Fundraiser income.
- Total income.
- Recognized expenses.
- Paid expenses.
- Outstanding reimbursements.
- Available operating cash.
- Net surplus.
- Budget utilization.

Include charts for:

- Revenue by source.
- Income vs expenses.
- Monthly transactions.
- Event performance.
- Budget consumption.

## Transaction pages

Implement:

- Transaction list.
- Transaction details.
- Search.
- Date filters.
- Income/expense filters.
- Category filters.
- Event/fundraiser association.
- Source reference.
- Payment status.
- Export CSV.

## Financial consistency

Distinguish:

- Confirmed revenue.
- Actual cash received.
- Recognized expenses.
- Accounts payable.
- Cash disbursed.
- Refunds and reversals.
- Available cash balance.

Do not use independent hardcoded dashboard totals.

Every displayed amount must be derived from shared financial records.

## Two-stage expense accounting

Stage 1 — Final approval:

Expense recognized and accounts payable increased.

Stage 2 — Disbursement:

Accounts payable reduced and operating cash reduced.

The mock state must make this distinction visible in the treasurer dashboard.

---

# 16. BUDGET ENVELOPES

Build:

- Budget overview.
- Create budget.
- Edit budget.
- Category budgets.
- Event budgets.
- Fiscal year selector.
- Allocated amount.
- Committed or spent amount.
- Remaining allocation.
- Percentage consumed.
- Budget alerts.
- Executive override UI.

Budget status:

- NORMAL below 80%.
- WARNING from 80% to below 100%.
- EXCEEDED at or above 100%.

Distinguish a budget's remaining allocation from actual available cash.

If a budget reaches its limit, demonstrate the approval restriction and authorized override with an audit entry.

Do not automatically approve overspending.

---

# 17. CLUB ADMINISTRATION AND SETTINGS

Include:

- Club profile.
- Club branding.
- Club description.
- Officer directory.
- Member roles.
- Role assignments.
- Membership plans.
- Membership expiry policy.
- Event defaults.
- Payment configuration preview.
- Notification preferences.
- Budget settings.
- Audit activity.
- Academic year/fiscal year settings.

## Annual leadership handover

Add a lightweight club leadership transition UI:

- View current officers.
- Assign next officer.
- Confirm handover.
- Update permissions.
- Preserve historical officer records.

Do not build a full election system unless it is separately required.

This is a supporting workflow because student club leadership changes annually.

---

# 18. ROLE-SPECIFIC DASHBOARDS

## Student dashboard

Focus on membership, tickets, orders and announcements.

## Volunteer dashboard

Focus on assigned tasks, shifts, upcoming events and expense claims.

## Committee Lead dashboard

Focus on event operations, assigned volunteers, tasks, attendance and announcements.

## President dashboard

Focus on membership trends, upcoming events, fundraising health, budgets, officer actions and pending approvals.

## Treasurer dashboard

Focus on income, expenses, reimbursements, cash balance, budgets and exports.

## Auditor view

Read-only financial and activity reports with audit history.

Do not render the exact same dashboard with only a different heading for every role.

Each role must have meaningful information and legitimate actions.

---

# 19. SHARED UI COMPONENTS

Build reusable components including:

- AppSidebar.
- PublicNavbar.
- Topbar.
- ClubSwitcher.
- PageHeader.
- Breadcrumbs.
- MetricCard.
- StatusBadge.
- SearchInput.
- FilterToolbar.
- DataTable.
- Pagination.
- DateRangeFilter.
- DetailDrawer.
- ConfirmDialog.
- FormDialog.
- EmptyState.
- ErrorState.
- LoadingSkeleton.
- ToastProvider.
- NotificationBell.
- ActivityTimeline.
- Avatar.
- FileUpload.
- ReceiptPreview.
- QRDisplay.
- ScannerFrame.
- CurrencyAmount.
- StatChart.
- ProgressBar.
- BudgetProgress.
- RoleGuard.
- DemoModeBanner.

Maintain consistent spacing, typography and interaction behavior.

---

# 20. GLOBAL UX AND INTERACTION REQUIREMENTS

All forms must support:

- Validation.
- Required fields.
- Clear error messages.
- Disabled submit while processing.
- Loading indicators.
- Success confirmation.
- Cancellation.
- Keyboard interaction.

All data lists must support:

- Loading.
- Empty state.
- Search.
- Appropriate filtering.
- Pagination or manageable list size.
- Sorting where useful.
- Detail navigation.

All destructive actions must have confirmation dialogs.

All important actions must show clear feedback.

Every modal must be closable.

Every navigation link must lead somewhere meaningful.

Do not create fake-looking controls that do nothing.

If an integration cannot work without a backend, provide an honest simulated flow and label it as demo behavior.

Use responsive layouts at mobile, tablet and desktop widths.

Avoid horizontal overflow.

Financial tables must remain readable on smaller screens.

Maintain keyboard focus visibility and accessible labels.

Respect the accessibility expectations in DESIGN.md.

---

# 21. REALISTIC DEMO SCENARIOS

Build all demo fixtures separately inside `src/mock/scenarios/`.

## Scenario A — New student joins

Student registers → Pays mock dues → Membership active → Digital pass generated → Member discounts become available.

## Scenario B — Spring gala

Admin creates event → Student reserves ticket → Simulates payment → Ticket generated → Scanner records admission → Event report updates.

## Scenario C — Club meeting announcement

Officer writes announcement → Selects audience → Publishes → Member receives notification → Reads message → Archive retains publication history.

## Scenario D — Merchandise purchase

Student selects hoodie size → Member price applied → Inventory reserved → Payment confirmed → Order fulfilled → Stock and financial summaries update.

## Scenario E — Bake sale fundraiser

Organizer creates fundraiser → Assigns preparation tasks → Opens volunteer shifts → Volunteers claim shifts → Sales/donations recorded → Fundraiser progress updated.

## Scenario F — Semester financial closing

Treasurer opens financial dashboard → Reviews membership dues, ticket sales, merchandise sales and fundraiser income → Reviews expenses and reimbursements → Confirms operating balance → Exports report.

These are the six mandatory Skyline demonstrations.

## Additional negative scenarios

Include:

- Expired membership.
- Grace-period membership.
- Invalid QR pass.
- Duplicate ticket scan.
- Ticket sold out.
- Ticket reservation expired.
- Late successful payment.
- Merchandise out of stock.
- Abandoned checkout.
- Cancelled order.
- Refunded order.
- Damaged returned product.
- Overdue task.
- Unfilled volunteer shift.
- Reimbursement rejected.
- Reimbursement correction requested.
- Unauthorized approval attempt.
- Budget exceeded.
- Failed notification delivery.

Provide an easily accessible development-only Scenario Switcher for testing these states.

---

# 22. FRONTEND SERVICE INTEGRATION CONTRACT

Use a service boundary compatible with future backend integration.

Components must consume domain services, not directly import database fixtures.

Example logical usage:

```javascript
const events = await eventService.getEvents(filters);
const ticket = await ticketService.reserveTicket(input);
const membership = await membershipService.getCurrentMembership();
```

Implement a mock adapter now.

Preserve the ability to substitute real Express API calls later without rewriting page components.

Do not introduce direct SQL, Stripe credentials or database logic into the browser application.

Create a centralized error format and map service states into consistent UI feedback.

---

# 23. PAGE AND ROUTE COMPLETENESS

Before finishing, verify that the application includes working navigation for:

PUBLIC:
- Home
- Clubs
- Club Details
- Events
- Event Details
- Membership
- Store
- Announcements
- Login
- Register

STUDENT:
- Dashboard
- My Profile
- My Membership
- Digital Pass
- Renew Membership
- My Tickets
- Ticket Details
- My Orders
- Order Details
- Announcements
- Notifications

VOLUNTEER:
- Dashboard
- My Tasks
- Kanban Board
- My Shifts
- Fundraisers
- Expense Claims
- New Expense
- Expense Details

CLUB MANAGEMENT:
- Dashboard
- Members
- Member Details
- Membership Plans
- Events
- Event Editor
- Bookings
- Attendees
- Scanner
- Event Reports
- Products
- Inventory
- Orders
- Returns
- Task Board
- Fundraisers
- Volunteer Shifts
- Announcement Composer
- Broadcast History
- Delivery Reports
- Expenses
- Approvals
- Ledger
- Budgets
- Financial Reports
- Club Settings
- Role Management
- Audit History

SUPPORT:
- Unauthorized
- Not Found
- Loading
- Empty State
- Error Recovery
- Demo Settings

Routes may be nested or shared between roles where appropriate.

Avoid unnecessary duplicate screens, but do not omit a distinct user workflow merely because a related page already exists.

---

# 24. IMPLEMENTATION STRATEGY

Follow vertical feature development rather than building every page without behavior.

Recommended order:

1. Design tokens, app shells, routing and shared components.
2. Centralized mock state and service infrastructure.
3. Authentication, demo role switching and club context.
4. Public website.
5. Student portal and membership lifecycle.
6. Events, ticket booking and scanner.
7. Merchandise, cart, orders and inventory.
8. Tasks, fundraisers and volunteer shifts.
9. Announcements and broadcast workflows.
10. Expense submission, correction and approval.
11. Finance, budgets and reports.
12. Club administration and settings.
13. Cross-module integrations.
14. Responsive/accessibility refinements.
15. Functional testing and final workflow audit.

Implement each feature with its frontend pages, mock service methods, loading/error states and working interactions.

Do not stop after creating the initial dashboard.

Do not silently omit later modules.

---

# 25. AUTOMATED TESTING AND ACCEPTANCE

Add frontend tests and workflow tests using suitable React tooling, preferably Vitest, React Testing Library and Playwright where feasible.

Test:

1. Route navigation.
2. Role-specific menus.
3. Public vs restricted pages.
4. Membership registration and discounts.
5. Renewal/grace/expired states.
6. Event ticket reservation and checkout.
7. Capacity release and duplicate scan.
8. Merchandise checkout and stock updates.
9. Cancellation and return behavior.
10. Fundraiser task and shift assignments.
11. Announcement publishing, revisions and read status.
12. Expense correction and approval.
13. Treasurer summary updates.
14. Budget warning thresholds.
15. Demo data reset and persistence.
16. Mobile navigation and viewport usability.

Complete one automated or reproducible manual end-to-end test for each of the six Skyline scenarios.

For every test, report PASS, FAIL or NOT RUN truthfully.

Do not claim tests passed unless they were executed.

---

# 26. MANDATORY FINAL COMPLETENESS AUDIT

Before finishing, generate a coverage matrix with these columns:

- Official requirement.
- Module.
- Page or route.
- React component.
- Mock service.
- Demo fixture.
- Workflow demonstrated.
- Status.
- Remaining limitation.

Verify that:

- Every official Skyline scenario is covered.
- Every PRD module has a frontend experience.
- Every main implementation-plan workflow has a corresponding UI.
- Every important state has user-facing feedback.
- Every primary button performs a meaningful action.
- Every form has validation and submit behavior.
- Every cross-module transaction updates shared data.
- Every dashboard metric is derived from the mock store.
- No mock data arrays are embedded in JSX.
- No unrelated hardcoded statistics remain.
- No navigation route is broken.
- No role gains unauthorized demo actions.
- There are no uncaught rendering errors.
- The frontend starts successfully.
- Responsive views are usable.
- No workflow is marked complete without implementation evidence.

Create:

`frontend/FRONTEND_WORKFLOW_AUDIT.md`

Document incomplete features honestly and fix them before marking the work complete.

Also create:

`frontend/WORKFLOW_ASSUMPTIONS.md`

to capture any functional interpretation needed where the source documents are ambiguous.

---

# 27. STRICT CONSTRAINTS

You must follow all these instructions:

1. Do not alter the backend architecture or SQL database.
2. Do not replace the existing ClubSphere DESIGN.md.
3. Do not introduce a different project identity.
4. Do not use Next.js.
5. Do not hardcode mock datasets inside `.jsx`files.
6. Do not duplicate mock data across modules.
7. Do not fake successful payments without a clearly labeled simulation.
8. Do not create decorative charts with unrelated numbers.
9. Do not create pages with nonfunctional buttons.
10. Do not collapse all functionality into one large React component.
11. Do not skip student-facing workflows to focus only on admin dashboards.
12. Do not skip admin tools to focus only on a marketing website.
13. Do not silently remove complex but required workflows.
14. Do not use real backend services without explicit configuration.
15. Do not commit secrets or API keys.
16. Do not claim that mocked security or payment functionality is production-ready.
17. Do not claim test completion without verification.
18. Preserve existing project work when relevant.
19. Prioritize working, coherent user journeys over decorative complexity.
20. Keep the mock service layer easy to replace with real backend endpoints.

---

# 28. EXPECTED FINAL DELIVERABLE

Deliver a complete ClubSphere React frontend with:

- Consistent design system.
- Responsive public website.
- Student/member portal.
- Role-based club management dashboards.
- Membership management.
- Ticketing and QR check-in demo.
- Merchandise storefront.
- Inventory management.
- Volunteer tasks and fundraiser workflows.
- Broadcast and announcements.
- Expense reimbursement workflow.
- Financial dashboard.
- Budget tracking.
- Reports.
- Club settings.
- Centralized mock datasets.
- Replaceable mock service architecture.
- Persistent demo state.
- Demo role/scenario switching.
- Working interactive flows.
- Workflow coverage report.
- Local setup instructions.
- Verified build and tests.

**FINAL SUCCESS CONDITION**

A jury member must be able to launch ClubSphere, switch between Student, Volunteer, President and Treasurer roles, complete realistic organization workflows and observe consistent changes across all connected modules.

No page should rely on independent fake data unrelated to the central ClubSphere state.

The result must resemble a complete student organization management product, not a static collection of React templates.

Begin by examining the repository documents and establishing the full screen/workflow inventory. Then implement the frontend systematically and verify it against the documented requirements.

Do not ask for additional clarification when the repository documents provide the answer.

Do not declare completion until the required frontend coverage audit has been performed.

## MANDATORY DESIGN.MD COMPLIANCE OVERRIDE

Before generating any React UI, read `documents/DESIGN.md` completely.

The existing ClubSphere DESIGN.md is the authoritative source for all UI design decisions.

Use IBM, Airtable and Linear only as secondary structural inspiration. Their visual styling must never override ClubSphere's documented colors, typography, spacing, component states or accessibility rules.

### Exact design compliance requirements

1. Implement all color, typography, spacing, elevation, radius and breakpoint tokens defined in `documents/DESIGN.md`. Use centralized CSS variables or Tailwind theme tokens.
2. For the Rapid Door Scanner:
   - Full-screen camera with a dark translucent mask.
   - Centered 280×280px scan reticle.
   - 16px corner indicators.
   - Animated blue scanning line.
   - Green success feedback with a bottom attendee card.
   - Red duplicate/rejected state with persistent warning modal.
   - Use the exact scanner audio, vibration and dismissal behavior from DESIGN.md where the device supports it.
   - Provide reduced-motion and manual-entry alternatives.
3. For the Financial Ledger:
   - Use the exact documented column order and alignment.
   - Right-align debit and credit amounts.
   - Use monospaced currency figures.
   - Apply the documented default, hover and selected row treatments.
4. For the Kanban Board:
   - Exactly five columns: BACKLOG, TODO, IN_PROGRESS, BLOCKED, DONE.
   - Priority badges.
   - Task title and checklist progress.
   - Assignee avatar.
   - Due-date countdown with appropriate warning state.
   - Documented drag-and-drop lift and drop-zone feedback.
5. For responsiveness and accessibility:
   - Follow the mobile, tablet, desktop and wide breakpoints from DESIGN.md.
   - Maintain at least 48×48px interactive touch targets on mobile.
   - Provide visible 2px primary-blue focus outlines with 2px offsets.
   - Meet the documented contrast requirements.
   - Use appropriate ARIA live regions for scanner results.
   - Use semantic article/time elements for announcements.
6. Do not invent different styles for each module. Every ClubSphere screen must follow the same design tokens and component conventions.
7. Keep all mock datasets in `src/mock/`. Do not create mock user, event, ticket, merchandise, fundraiser, announcement or financial records inside React components.

### Mandatory final visual audit

After implementation, compare the actual rendered frontend with DESIGN.md.

Check representative screens for:

- Public landing page.
- Student dashboard.
- Membership card.
- Event booking and ticket details.
- QR scanner success and rejection states.
- Merchandise catalog and checkout.
- Kanban board.
- Announcement hub.
- Expense submission and review.
- Financial ledger and treasurer dashboard.

Check each screen at desktop and mobile widths.

Create `frontend/DESIGN_COMPLIANCE_AUDIT.md` with:

- Design requirement.
- Corresponding token or component.
- Actual implementation location.
- Verification result: PASS, FAIL or NOT VERIFIED.
- Necessary correction.

Fix verified design mismatches before declaring the frontend visually complete.

Do not mark design compliance as PASS solely because the required tokens appear in source code. Verify rendered appearance and interactions.

Evidence must come from executed workflows and the actual rendered frontend. Token presence alone is insufficient. Preserve all acceptance requirements in the source specification.

Deliver the frontend, local setup instructions, frontend/WORKFLOW_ASSUMPTIONS.md, frontend/FRONTEND_WORKFLOW_AUDIT.md and frontend/DESIGN_COMPLIANCE_AUDIT.md with honest verification results.

Follow the documented vertical feature order, starting with repository analysis and a route/workflow inventory. Preserve existing relevant work and keep changes within the frontend scope.

Execute the required six Skyline scenarios and applicable build/tests; inspect every listed representative screen at desktop and mobile widths, fix observed mismatches and record remaining limitations.
