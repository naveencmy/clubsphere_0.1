import { beforeEach, it, expect } from 'vitest';
import { store } from '../src/services/store.js';
import {
  authService,
  eventService,
  paymentService,
  commerceService,
  fundraiserService,
  adminService,
  demoService,
  snapshot,
  expenseService,
  broadcastService,
  taskService,
  financeService,
} from '../src/services/serviceFactory.js';
beforeEach(() => store.reset());
it('waitlist promotions protect a released seat for four hours and advance the queue', async () => {
  await authService.login('president');
  await eventService.save({ ...snapshot().events.find((e) => e.id === 'gala'), capacity: 2 });
  await authService.login('guest');
  await eventService.waitlist('gala');
  await authService.login('grace');
  await eventService.waitlist('gala');
  await authService.login('member');
  await eventService.refund('TCK-1001');
  await authService.login('president');
  await expect(
    eventService.reserve({ eventId: 'gala', tierId: 'gala-general' }),
  ).rejects.toMatchObject({ code: 'WAITLIST_PRIORITY' });
  await demoService.advance(4 * 3600000 + 1);
  const next = store.get().waitlist.find((w) => w.userId === 'grace');
  expect(next.promotedUntil).toBeTruthy();
  await authService.login('grace');
  await eventService.reserve({ eventId: 'gala', tierId: 'gala-general' });
  expect(store.get().waitlist.find((w) => w.userId === 'grace').claimedAt).toBeTruthy();
});
it('active and grace memberships receive the documented 48-hour early booking window', async () => {
  const s = structuredClone(store.get());
  s.events.find((e) => e.id === 'gala').salesOpen = new Date(s.clock + 86400000).toISOString();
  store.commit(s);
  await authService.login('guest');
  await expect(
    eventService.reserve({ eventId: 'gala', tierId: 'gala-general' }),
  ).rejects.toMatchObject({ code: 'SALES_CLOSED' });
  await authService.login('member');
  expect((await eventService.reserve({ eventId: 'gala', tierId: 'gala-general' })).status).toBe(
    'RESERVED',
  );
});
it('profile edits cannot grant a role or overwrite identity keys', async () => {
  await authService.login('member');
  const user = snapshot().user;
  await authService.updateProfile({
    ...user,
    id: 'president',
    role: 'AUDITOR',
    name: 'Updated student',
  });
  expect(snapshot().user.id).toBe('member');
  expect(snapshot().role).toBe('MEMBER');
  expect(snapshot().user.name).toBe('Updated student');
});
it('late payment callbacks refund once without duplicate payment records', async () => {
  await authService.login('member');
  const t = await eventService.reserve({ eventId: 'gala', tierId: 'gala-general' });
  await demoService.advance(601000);
  await paymentService.confirm({ kind: 'ticket', recordId: t.id, outcome: 'success' });
  await paymentService.confirm({ kind: 'ticket', recordId: t.id, outcome: 'success' });
  expect(store.get().payments.filter((p) => p.referenceId === t.id)).toHaveLength(1);
});
it('editing inventory cannot erase active reservations', async () => {
  await authService.login('lead');
  await commerceService.reserve([{ variantId: 'hoodie-M', quantity: 2 }]);
  const v = snapshot().variants.find((v) => v.id === 'hoodie-M');
  await expect(commerceService.saveVariant({ ...v, stock: 1 })).rejects.toMatchObject({
    code: 'STOCK_RESERVED',
  });
});
it('volunteers are denied scanning unassigned events', async () => {
  await authService.login('volunteer');
  await expect(eventService.scan({ eventId: 'meet', code: 'TCK-SKY-1001' })).rejects.toMatchObject({
    code: 'UNASSIGNED_SCANNER',
  });
});
it('a repeated fundraiser payment request counts only once', async () => {
  await authService.login('volunteer');
  const initial = snapshot().raised.bake;
  const input = { fundraiserId: 'bake', amount: 10000, idempotencyKey: 'donation-request' };
  await fundraiserService.donate(input);
  await fundraiserService.donate(input);
  expect(snapshot().raised.bake).toBe(initial + 10000);
});
it('handover changes authority and preserves historical officers', async () => {
  await authService.login('president');
  const target = snapshot().memberships.find((m) => m.userId === 'lead');
  await adminService.assignRole({ membershipId: target.id, role: 'PRESIDENT', handover: true });
  expect(snapshot().role).toBe('MEMBER');
  expect(
    store.get().officerHistory.some((o) => o.userId === 'president' && o.role === 'PRESIDENT'),
  ).toBe(true);
  await authService.login('lead');
  expect(snapshot().role).toBe('PRESIDENT');
});
it('negative merchandise scenarios show actual terminal states and balanced reversals', async () => {
  await authService.login('member');
  await demoService.scenario('cancelled-order');
  expect(snapshot().orders.some((o) => o.status === 'CANCELLED')).toBe(true);
  await demoService.scenario('damaged-return');
  const returned = snapshot().orders.find((o) => o.id === 'ORD-1001');
  expect(returned.status).toBe('REFUNDED');
  expect(returned.condition).toBe('DAMAGED');
  expect(
    store.get().journal.every((j) => j.lines.reduce((a, l) => a + l.debit - l.credit, 0) === 0),
  ).toBe(true);
});
it('fundraiser health is consistent between volunteer and executive views', async () => {
  await authService.login('president');
  const executive = snapshot().fundraiserHealth;
  await authService.login('volunteer');
  expect(snapshot().fundraiserHealth).toEqual(executive);
});
it('create-form payloads with undefined IDs preserve service-generated identities', async () => {
  await authService.login('president');
  const announcement = await broadcastService.save({
    id: undefined,
    title: 'Meeting',
    content: 'Bring ideas',
    audience: 'ALL_MEMBERS',
  });
  const task = await taskService.save({
    id: undefined,
    title: 'Preparation',
    status: 'TODO',
    due: '2026-10-15T10:00:00Z',
  });
  const fundraiser = await fundraiserService.save({
    id: undefined,
    title: 'Campaign',
    target: 100000,
    startsAt: '2026-10-15T10:00:00Z',
    endsAt: '2026-10-15T12:00:00Z',
  });
  const expense = await expenseService.save({
    id: undefined,
    title: 'Paper',
    merchant: 'Shop',
    purchaseDate: '2026-10-09',
    amount: 10000,
    category: 'SUPPLIES',
    purpose: 'Workshop',
    receipt: '/receipts/receipt-aura-stage.pdf',
  });
  const budget = await financeService.saveBudget({
    id: undefined,
    title: 'Travel',
    allocated: 50000,
    category: 'TRAVEL',
    fiscalYear: '2026–2027',
  });
  const event = await eventService.save({
    id: undefined,
    title: 'New event',
    venue: 'Campus',
    capacity: 40,
    startsAt: '2026-10-15T10:00:00Z',
    endsAt: '2026-10-15T12:00:00Z',
    salesOpen: '2026-10-10T10:00:00Z',
    salesClose: '2026-10-14T10:00:00Z',
  });
  for (const record of [announcement, task, fundraiser, expense, budget, event])
    expect(record.id).toMatch(/^[A-Z]+-\d+$/);
  expect(snapshot().expenses.some((e) => e.id === expense.id)).toBe(true);
});
