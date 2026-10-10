# Frontend screen and workflow inventory

Created before React implementation. Nested details and shared role screens avoid unnecessary duplication; role permissions are checked at routes and service mutations.

| Workflow | Routes | Planned component | Service |
|---|---|---|---|
| Public discovery, club details, benefits | /, /clubs, /clubs/:slug, /membership | PublicPages, Membership | discovery, membership |
| Login, registration, profile, logout | /login, /register, /portal/profile | AuthPages, Profile | auth |
| Student / volunteer / executive overview | /portal/dashboard, /dashboard/:club | Dashboard | dashboard |
| Membership payment, renewal, pass and history | /portal/membership, /portal/pass, /portal/renew | Membership | membership, payment |
| Member roster, detail and plans | /dashboard/:club/members, /members/:id, /plans | MemberAdmin | membership, admin |
| Event discovery/detail, tier/reservation/checkout | /events, /events/:id, /checkout/ticket/:id | Events, Checkout | events, payment |
| Tickets, details, refunds and transfers | /portal/tickets, /portal/tickets/:id | Tickets | events |
| Event editor, booking list, attendees and reconciliation | /dashboard/:club/events, /events/new, /events/:id/edit, /bookings, /attendees, /event-reports | Events, EventEditor, EventOperations | events |
| Ticket and member door verification | /scanner/:eventId | Scanner | scanner |
| Merchandise variants, details, cart, checkout | /store, /store/:id, /cart, /checkout/order/:id | Commerce, Checkout | commerce, payment |
| Personal orders, cancellation, returns | /portal/orders, /portal/orders/:id | Orders | commerce |
| Products, inventory, fulfillment, return inspection | /dashboard/:club/products, /inventory, /orders, /returns | Inventory, Orders | commerce, admin |
| Five-state board, own tasks, list/detail/create/edit | /portal/tasks, /dashboard/:club/tasks, /tasks/:id | Tasks | tasks |
| Fundraiser creation, progress, donations, shifts | /portal/fundraisers, /portal/shifts, /dashboard/:club/fundraisers, /shifts | Fundraisers | fundraisers |
| Announcement feed, read receipt, archive | /announcements, /portal/announcements | Announcements | broadcast |
| Composer, revisions, broadcast history and delivery reports | /dashboard/:club/announcements, /broadcasts, /deliveries | Announcements | broadcast |
| Expense form, receipt, draft/correction and detail | /portal/expenses, /portal/expenses/new, /portal/expenses/:id | Expenses | expenses |
| Review, correction, rejection, two-level approval and payout | /dashboard/:club/expenses, /approvals | Expenses | expenses |
| Treasurer dashboard, ledger/details, reports/export | /dashboard/:club/finance, /ledger, /reports | Finance | finance |
| Budget categories/event envelopes, edit and override | /dashboard/:club/budgets | Budgets | finance |
| Settings, roles, handover, audit history | /dashboard/:club/settings, /roles, /audit | Administration | admin |
| Notifications/read state and demo scenarios/reset/time | /portal/notifications, /demo | Notifications, DemoSettings | notifications, demo |
| Forbidden/not found/loading/empty/error recovery | /unauthorized, /support/:state, * | Support | shared feedback |

Six required journeys: join → membership → pass; event → ticket → scanner → reconciliation; announcement → notification → read/archive; merchandise → stock hold → payment → fulfillment; fundraiser → tasks → shifts → donation; Treasurer → revenue/expense/payable/cash → export.
