import { beforeEach, describe, it, expect } from 'vitest';
import { store } from '../src/services/store.js';
import {
  authService,
  membershipService,
  eventService,
  paymentService,
  commerceService,
  taskService,
  fundraiserService,
  broadcastService,
  expenseService,
  financeService,
  adminService,
  demoService,
  snapshot,
} from '../src/services/serviceFactory.js';
beforeEach(() => store.reset());
const login = (id) => authService.login(id);
const summary = () => snapshot().financial;
const balanced = () =>
  store
    .get()
    .journal.every(
      (j) => j.lines.reduce((a, l) => a + l.debit, 0) === j.lines.reduce((a, l) => a + l.credit, 0),
    );
describe('Official Skyline journeys through the shared services', () => {
  it('A: registration, dues, pass, discounts and renewal lifecycle', async () => {
    const u = await authService.register({
      name: 'Test Student',
      email: 'test@skyline.edu',
      studentId: 'SKY-2026-099',
      major: 'Economics',
      graduation: 2029,
      emergency: 'Test Parent',
      phone: '9876543299',
    });
    const checkout = await membershipService.start('skyline-standard');
    const before = store.get().journal.length;
    await paymentService.confirm({ kind: 'membership', recordId: checkout.id, outcome: 'success' });
    expect(snapshot().membership.status).toBe('ACTIVE');
    expect(store.get().journal.length).toBe(before + 1);
    expect(snapshot().membership.passCode).toBeTruthy();
    const t = await eventService.reserve({ eventId: 'gala', tierId: 'gala-general' });
    expect(t.amount).toBe(25000);
    await demoService.scenario('grace');
    expect(snapshot().membership.status).toBe('GRACE_PERIOD');
    const g = await eventService.reserve({ eventId: 'gala', tierId: 'gala-general' });
    expect(g.amount).toBe(25000);
    await demoService.scenario('expired');
    const expired = await eventService.reserve({ eventId: 'gala', tierId: 'gala-general' });
    expect(expired.amount).toBe(35000);
    expect(balanced()).toBe(true);
  });
  it('B: ticket hold, idempotent payment, admission, duplicate and late refund', async () => {
    await login('president');
    const event = await eventService.save({
      ...snapshot().events.find((e) => e.id === 'gala'),
      id: undefined,
      title: 'Scenario B Spring Gala',
    });
    const tier = snapshot().tiers.find((t) => t.eventId === event.id);
    await login('member');
    const t = await eventService.reserve({ eventId: event.id, tierId: tier.id });
    await paymentService.confirm({ kind: 'ticket', recordId: t.id, outcome: 'success' });
    const journals = store.get().journal.length;
    await paymentService.confirm({ kind: 'ticket', recordId: t.id, outcome: 'success' });
    expect(store.get().journal.length).toBe(journals);
    await login('volunteer');
    const admitted = await eventService.scan({ eventId: event.id, code: t.code });
    expect(admitted.ticket.status).toBe('CHECKED_IN');
    expect((await eventService.scan({ eventId: event.id, code: t.code })).duplicate).toBe(true);
    await expect(eventService.scan({ eventId: 'design', code: t.code })).rejects.toMatchObject({
      code: 'WRONG_EVENT',
    });
    await login('member');
    const late = await eventService.reserve({ eventId: 'gala', tierId: 'gala-general' });
    await demoService.advance(601000);
    const result = await paymentService.confirm({
      kind: 'ticket',
      recordId: late.id,
      outcome: 'success',
    });
    expect(result.status).toBe('LATE_REFUNDED');
    expect(store.get().tickets.find((t) => t.id === late.id).status).toBe('CANCELLED');
    expect(balanced()).toBe(true);
  });
  it('C: draft, publish, delivery progression, append-only revision and read receipt', async () => {
    await login('lead');
    const a = await broadcastService.save({
      title: 'Club meeting',
      content: 'Meet at 4 pm.',
      audience: 'ALL_MEMBERS',
    });
    await expect(broadcastService.publish(a.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await login('treasurer');
    await broadcastService.review(a.id);
    await login('president');
    await broadcastService.publish(a.id);
    expect(
      snapshot()
        .deliveries.filter((d) => d.announcementId === a.id)
        .every((d) => d.status === 'QUEUED'),
    ).toBe(true);
    await broadcastService.dispatch(a.id);
    await broadcastService.dispatch(a.id);
    expect(
      snapshot()
        .deliveries.filter((d) => d.announcementId === a.id)
        .every((d) => d.status === 'DELIVERED'),
    ).toBe(true);
    await broadcastService.save({
      id: a.id,
      title: 'Club meeting',
      content: 'Meet at 5 pm.',
      audience: 'ALL_MEMBERS',
    });
    const revisions = snapshot().revisions.filter((r) => r.announcementId === a.id);
    expect(revisions).toHaveLength(2);
    expect(revisions[0].content).toBe('Meet at 4 pm.');
    await login('member');
    expect(snapshot().notifications.some((n) => n.title === 'Club meeting')).toBe(true);
    await broadcastService.read(a.id);
    expect(
      snapshot().readReceipts.some((r) => r.announcementId === a.id && r.userId === 'member'),
    ).toBe(true);
  });
  it('D: merchandise hold, payment, stock decrement, pickup and damaged return', async () => {
    await login('member');
    const stock = snapshot().stock['hoodie-M'];
    const o = await commerceService.reserve([{ variantId: 'hoodie-M', quantity: 1 }]);
    expect(o.amount).toBe(79900);
    expect(snapshot().stock['hoodie-M']).toBe(stock - 1);
    await paymentService.confirm({ kind: 'order', recordId: o.id, outcome: 'success' });
    expect(snapshot().variants.find((v) => v.id === 'hoodie-M').stock).toBe(stock - 1);
    await login('lead');
    await commerceService.fulfill(o.id);
    await commerceService.fulfill(o.id);
    await commerceService.requestReturn(o.id);
    await commerceService.inspect({ orderId: o.id, condition: 'DAMAGED' });
    expect(snapshot().variants.find((v) => v.id === 'hoodie-M').stock).toBe(stock - 1);
    expect(
      store.get().journal.some((j) => j.reference === 'INVENTORY_LOSS' && j.referenceId === o.id),
    ).toBe(true);
    await expect(
      commerceService.inspect({ orderId: o.id, condition: 'SELLABLE' }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    expect(balanced()).toBe(true);
  });
  it('E: fundraiser, task ownership, shifts, donation and consistent revenue', async () => {
    await login('president');
    const f = await fundraiserService.save({
      title: 'Test bake sale',
      description: 'Test',
      target: 2500000,
      startsAt: '2026-10-15T09:00:00Z',
      endsAt: '2026-10-15T17:00:00Z',
    });
    const t = await taskService.save({
      title: 'Buy cups',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: 'volunteer',
      due: '2026-10-14T10:00:00Z',
      fundraiserId: f.id,
      checklist: [{ title: 'Buy cups', done: false }],
    });
    const shift = await fundraiserService.saveShift({
      fundraiserId: f.id,
      title: 'Table duty',
      startsAt: '2026-10-15T09:00:00Z',
      endsAt: '2026-10-15T11:00:00Z',
    });
    await login('volunteer');
    await taskService.update({ taskId: t.id, status: 'DONE' });
    await fundraiserService.claim(shift.id);
    await fundraiserService.release(shift.id);
    await fundraiserService.donate({ fundraiserId: f.id, amount: 50000 });
    expect(snapshot().raised[f.id]).toBe(50000);
    await login('treasurer');
    expect(summary().sources.find((s) => s.account === '4040').amount).toBe(1300000);
    expect(balanced()).toBe(true);
  });
  it('F: corrections, two-level approval, accrual, payout and closing summary', async () => {
    await login('treasurer');
    const before = summary();
    await expenseService.decision({ expenseId: 'EXP-1001', decision: 'review' });
    await expenseService.decision({
      expenseId: 'EXP-1001',
      decision: 'correction',
      reason: 'Clarify the receipt',
    });
    await login('volunteer');
    const e = snapshot().expenses[0];
    await expenseService.save({
      ...e,
      receipt: '/receipts/receipt-aura-stage.pdf',
      purpose: 'Cups and packaging',
    });
    await login('treasurer');
    await expenseService.decision({ expenseId: e.id, decision: 'review' });
    await expenseService.decision({ expenseId: e.id, decision: 'treasurer' });
    expect(summary().expenses).toBe(before.expenses);
    expect(summary().payable).toBe(before.payable);
    await login('president');
    await expenseService.decision({ expenseId: e.id, decision: 'president' });
    expect(summary().expenses).toBe(before.expenses + 320000);
    expect(summary().cash).toBe(before.cash);
    expect(summary().payable).toBe(320000);
    expect(snapshot().budgetUsage['budget-supplies']).toBe(320000);
    await login('treasurer');
    await expenseService.decision({ expenseId: e.id, decision: 'disburse' });
    expect(summary().payable).toBe(0);
    expect(summary().cash).toBe(before.cash - 320000);
    await expect(
      expenseService.decision({ expenseId: e.id, decision: 'disburse' }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    expect(balanced()).toBe(true);
  });
});
describe('Domain safeguards', () => {
  it('prevents self-approval, unauthorized actions and tenant leakage', async () => {
    await login('volunteer');
    await expect(
      expenseService.decision({ expenseId: 'EXP-1001', decision: 'review' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(financeService.getSummary()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await login('treasurer');
    const e = await expenseService.save({
      title: 'Own claim',
      merchant: 'Test',
      purchaseDate: '2026-10-09',
      category: 'SUPPLIES',
      amount: 10000,
      purpose: 'Test',
      receipt: '/receipts/receipt-aura-stage.pdf',
    });
    await expect(
      expenseService.decision({ expenseId: e.id, decision: 'review' }),
    ).rejects.toMatchObject({ code: 'SELF_APPROVAL' });
    await authService.switchClub('makers');
    expect(snapshot().role).toBe('STUDENT');
    expect(snapshot().tickets).toHaveLength(0);
    await expect(
      eventService.reserve({ eventId: 'gala', tierId: 'gala-general' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('expires stock holds and restores cancellation stock exactly once', async () => {
    await login('member');
    const initial = snapshot().stock['hoodie-M'];
    const unpaid = await commerceService.reserve([{ variantId: 'hoodie-M', quantity: 2 }]);
    await demoService.advance(601000);
    expect(snapshot().stock['hoodie-M']).toBe(initial);
    const paid = await commerceService.reserve([{ variantId: 'hoodie-M', quantity: 1 }]);
    await paymentService.confirm({ kind: 'order', recordId: paid.id, outcome: 'success' });
    await commerceService.cancel(paid.id);
    expect(snapshot().stock['hoodie-M']).toBe(initial);
    await expect(commerceService.cancel(paid.id)).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
    expect(balanced()).toBe(true);
  });
  it('blocks budget overspending without an explicit President override', async () => {
    await login('treasurer');
    await expenseService.decision({ expenseId: 'EXP-1001', decision: 'review' });
    await expenseService.decision({ expenseId: 'EXP-1001', decision: 'treasurer' });
    await login('president');
    await financeService.saveBudget({
      id: 'budget-supplies',
      title: 'Supplies',
      category: 'SUPPLIES',
      fiscalYear: '2026–2027',
      allocated: 10000,
    });
    await expect(
      expenseService.decision({ expenseId: 'EXP-1001', decision: 'president' }),
    ).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
    await expenseService.decision({
      expenseId: 'EXP-1001',
      decision: 'president',
      override: true,
      reason: 'Campus grant confirmed',
    });
    expect(snapshot().audit.some((a) => a.action === 'budget.override')).toBe(true);
  });
  it('rejects overlapping shifts and cross-club task assignees', async () => {
    await login('president');
    await expect(
      taskService.save({
        title: 'Bad assignee',
        status: 'TODO',
        due: '2026-10-12T10:00:00Z',
        assignee: 'guest',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_ASSIGNEE' });
    const shift = await fundraiserService.saveShift({
      fundraiserId: 'bake',
      title: 'Overlapping',
      startsAt: '2026-10-18T05:00:00Z',
      endsAt: '2026-10-18T07:00:00Z',
    });
    await login('volunteer');
    await expect(fundraiserService.claim(shift.id)).rejects.toMatchObject({
      code: 'SHIFT_CONFLICT',
    });
  });
  it('recovers from deliberate service failures and resets shared records', async () => {
    await login('member');
    await demoService.scenario('service-failure');
    await expect(membershipService.start('skyline-standard')).rejects.toMatchObject({
      code: 'SIMULATED_FAILURE',
    });
    await membershipService.start('skyline-standard');
    await demoService.reset();
    expect(snapshot().session.userId).toBe('member');
    expect(snapshot().membership.pendingPlan).toBeUndefined();
    expect(store.get().sequence).toBe(2000);
  });
  it('serializes concurrent reservations and never oversells a last item', async () => {
    await login('lead');
    await commerceService.adjust({
      variantId: 'hoodie-M',
      change: 1 - snapshot().stock['hoodie-M'],
      reason: 'Last-item scenario',
    });
    const requests = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        commerceService.reserve([{ variantId: 'hoodie-M', quantity: 1 }]),
      ),
    );
    expect(requests.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(snapshot().stock['hoodie-M']).toBe(0);
  });
});
