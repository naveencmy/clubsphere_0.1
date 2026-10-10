import { store } from '../mockStore.js';
import { demoAccounts } from '../scenarios/demoAccounts.js';
import {
  roleFor,
  eligible,
  permissions,
  managerRoles,
  financeRoles,
  staffRoles,
  taskStatuses,
} from '../../services/permissions.js';
const day = 86400000;
export class ServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function check(condition, code, message) {
  if (!condition) throw new ServiceError(code, message);
}
const id = (s, prefix) => `${prefix}-${++s.sequence}`;
const iso = (s) => new Date(s.clock).toISOString();
const actor = (s) => s.users.find((u) => u.id === s.session.userId);
const member = (s, userId = s.session.userId) =>
  s.memberships.find((m) => m.userId === userId && m.clubId === s.session.clubId);
const scoped = (s, collection, recordId) => {
  const r = s[collection].find((r) => r.id === recordId && r.clubId === s.session.clubId);
  check(r, 'NOT_FOUND', 'This record is unavailable in the selected club.');
  return r;
};
function allow(s, key) {
  check(
    permissions[key]?.includes(roleFor(s)),
    'FORBIDDEN',
    'Your role in this club does not permit this action.',
  );
}
function signedIn(s) {
  check(
    actor(s) && roleFor(s) !== 'VISITOR',
    'SESSION_REQUIRED',
    'Choose a demo account or register before continuing.',
  );
}
function owner(s, r) {
  signedIn(s);
  check(
    r.userId === s.session.userId || managerRoles.includes(roleFor(s)),
    'FORBIDDEN',
    'You can only act on your own records.',
  );
}
function assignFields(record, input) {
  for (const [key, value] of Object.entries(input))
    if (
      value !== undefined &&
      !['id', 'clubId', 'userId', 'authorId', 'history', 'status'].includes(key)
    )
      record[key] = value;
}
function money(value) {
  check(
    Number.isSafeInteger(value) && value > 0,
    'INVALID_AMOUNT',
    'Enter a positive amount with no more than two decimal places.',
  );
}
function history(s, r, status) {
  r.status = status;
  r.history ??= [];
  r.history.push({ status, at: iso(s), actorId: s.session.userId });
  if (r.eventId && ['CANCELLED', 'REFUNDED'].includes(status))
    promoteWaitlist(s, r.eventId, r.tierId);
}
function activePromotions(s, eventId) {
  return s.waitlist.filter(
    (w) =>
      w.eventId === eventId &&
      w.promotedUntil &&
      !w.claimedAt &&
      new Date(w.promotedUntil).getTime() > s.clock,
  );
}
function promoteWaitlist(s, eventId, tierId) {
  const event = s.events.find((e) => e.id === eventId);
  const tier = s.tiers.find((t) => t.id === tierId);
  const used = s.tickets.filter(
    (t) => t.eventId === eventId && ['RESERVED', 'ISSUED', 'CHECKED_IN'].includes(t.status),
  );
  const promotions = activePromotions(s, eventId);
  if (
    !event ||
    !tier ||
    used.length + promotions.length >= event.capacity ||
    used.filter((t) => t.tierId === tierId).length +
      promotions.filter((w) => w.tierId === tierId).length >=
      tier.capacity
  )
    return;
  const next = s.waitlist.find((w) => w.eventId === eventId && !w.promotedAt);
  if (!next) return;
  next.promotedAt = iso(s);
  next.promotedUntil = new Date(s.clock + 4 * 3600000).toISOString();
  next.tierId = tierId;
  // Keep the club on the notice even when a demo clock update runs in another tenant.
  s.notifications.push({
    id: id(s, 'NOT'),
    clubId: next.clubId,
    userId: next.userId,
    title: 'A ticket seat is available',
    body: 'Your exclusive four-hour booking window is open. Choose the promoted ticket tier.',
    link: `/events/${eventId}`,
    read: false,
    at: iso(s),
  });
}
function post(s, description, amount, debit, credit, reference, referenceId) {
  money(amount);
  const entryId = id(s, 'JRN');
  s.journal.push({
    id: entryId,
    number: entryId,
    clubId: s.session.clubId,
    description,
    at: iso(s),
    reference,
    referenceId,
    actorId: s.session.userId,
    lines: [
      { account: debit, debit: amount, credit: 0 },
      { account: credit, debit: 0, credit: amount },
    ],
  });
}
function paymentRecord(s, reference, referenceId, amount, status = 'SUCCEEDED') {
  s.payments.push({
    id: id(s, 'PAY'),
    clubId: s.session.clubId,
    userId: s.session.userId,
    reference,
    referenceId,
    amount,
    status,
    at: iso(s),
  });
}
function notify(s, userId, title, body, link) {
  const preferences = s.users.find((u) => u.id === userId)?.preferences;
  if (
    (link === '/portal/announcements' && preferences?.announcements === false) ||
    (/tickets|orders/.test(link) && preferences?.orderUpdates === false)
  )
    return;
  s.notifications.push({
    id: id(s, 'NOT'),
    clubId: s.session.clubId,
    userId,
    title,
    body,
    link,
    read: false,
    at: iso(s),
  });
}
function audit(s, action, resourceId, before, after) {
  s.audit.push({
    id: id(s, 'AUD'),
    clubId: s.session.clubId,
    actorId: s.session.userId,
    action,
    resourceId,
    at: iso(s),
    before,
    after,
  });
}
function expiry(s) {
  for (const m of s.memberships) {
    if (m.status === 'REVOKED' || m.status === 'PENDING_PAYMENT') continue;
    const remaining = new Date(m.validUntil).getTime() - s.clock;
    const next =
      remaining <= -14 * day
        ? 'EXPIRED'
        : remaining <= 0
          ? 'GRACE_PERIOD'
          : remaining <= 30 * day
            ? 'RENEWAL_DUE'
            : 'ACTIVE';
    if (m.status !== next) m.status = next;
    for (const milestone of s.users.find((u) => u.id === m.userId)?.preferences?.renewals === false
      ? []
      : [30, 7, 1, 0])
      if (
        remaining <= milestone * day &&
        !s.notifications.some((n) => n.membershipId === m.id && n.milestone === milestone)
      ) {
        s.notifications.push({
          id: id(s, 'NOT'),
          clubId: m.clubId,
          userId: m.userId,
          title: milestone
            ? `Membership renewal: ${milestone}-day reminder`
            : 'Your membership grace period has started',
          body: 'Renew your membership to keep your benefits. Grace-period benefits last 14 days.',
          link: '/portal/renew',
          membershipId: m.id,
          milestone,
          read: false,
          at: iso(s),
        });
      }
  }
  for (const t of s.tickets)
    if (t.status === 'RESERVED' && new Date(t.reservedUntil).getTime() <= s.clock)
      history(s, t, 'CANCELLED');
  for (const o of s.orders)
    if (o.status === 'PENDING' && new Date(o.reservedUntil).getTime() <= s.clock)
      history(s, o, 'CANCELLED');
  for (const w of s.waitlist) {
    if (
      w.promotedUntil &&
      !w.claimedAt &&
      !w.expiredAt &&
      new Date(w.promotedUntil).getTime() <= s.clock
    ) {
      w.expiredAt = iso(s);
      promoteWaitlist(s, w.eventId, w.tierId);
    }
  }
  for (const task of s.tasks) {
    const remaining = new Date(task.due).getTime() - s.clock;
    if (
      task.status !== 'IN_PROGRESS' ||
      remaining < 0 ||
      remaining >= day ||
      s.notifications.some((n) => n.taskId === task.id && n.deadline === task.due)
    )
      continue;
    const recipients = new Set([
      task.assignee,
      ...s.memberships
        .filter((m) => m.clubId === task.clubId && m.role === 'COMMITTEE_LEAD')
        .map((m) => m.userId),
    ]);
    for (const userId of recipients)
      if (userId)
        s.notifications.push({
          id: id(s, 'NOT'),
          clubId: task.clubId,
          userId,
          title: 'Task deadline needs attention',
          body: `${task.title} is due within 24 hours. Review its progress.`,
          link: `/portal/tasks/${task.id}`,
          taskId: task.id,
          deadline: task.due,
          read: false,
          at: iso(s),
        });
  }
}
export function financialSummary(s) {
  const balances = {};
  for (const j of s.journal)
    for (const l of j.lines) balances[l.account] = (balances[l.account] || 0) + l.debit - l.credit;
  const sources = [
    { name: 'Membership dues', account: '4010' },
    { name: 'Event tickets', account: '4020' },
    { name: 'Merchandise', account: '4030' },
    { name: 'Fundraisers', account: '4040' },
  ].map((x) => ({ ...x, amount: -(balances[x.account] || 0) || 0 }));
  const income = sources.reduce((a, x) => a + x.amount, 0);
  const expenses = Object.entries(balances)
    .filter(([k]) => k.startsWith('5'))
    .reduce((a, [, v]) => a + v, 0);
  const cash = ['1010', '1020', '1030'].reduce((a, k) => a + (balances[k] || 0), 0);
  const payable = -(balances['2010'] || 0) || 0;
  const paidExpenses = s.journal
    .filter((j) => j.reference === 'EXPENSE_PAYOUT')
    .flatMap((j) => j.lines)
    .filter((l) => ['1010', '1020', '1030'].includes(l.account))
    .reduce((a, l) => a + l.credit, 0);
  return {
    sources,
    income,
    expenses,
    cash,
    payable,
    paidExpenses,
    outflows: s.journal
      .flatMap((j) => j.lines)
      .filter((l) => ['1010', '1020', '1030'].includes(l.account))
      .reduce((a, l) => a + l.credit, 0),
    surplus: income - expenses,
    balances,
  };
}
export function committed(s, budgetId) {
  return s.expenses
    .filter(
      (e) =>
        (e.budgetId === budgetId && ['PRESIDENT_APPROVED', 'DISBURSED'].includes(e.status)) ||
        (e.budgetId === budgetId && e.status === 'TREASURER_APPROVED' && e.amount < 250000),
    )
    .reduce((a, e) => a + e.amount, 0);
}
export function snapshot() {
  const s = store.get(),
    role = roleFor(s),
    clubId = s.session.clubId,
    userId = s.session.userId;
  const result = {
    ...s,
    role,
    user: actor(s),
    membership: member(s),
    club: s.clubs.find((c) => c.id === clubId),
    accounts: demoAccounts,
    demoControls: import.meta.env?.VITE_DEMO_CONTROLS !== 'false',
  };
  for (const key of [
    'memberships',
    'plans',
    'events',
    'tickets',
    'products',
    'variants',
    'orders',
    'fundraisers',
    'tasks',
    'shifts',
    'announcements',
    'revisions',
    'deliveries',
    'expenses',
    'budgets',
    'journal',
    'payments',
    'waitlist',
    'audit',
    'officerHistory',
    'notifications',
  ])
    result[key] = s[key].filter((r) => r.clubId === clubId);
  result.events = result.events.filter((e) => e.published || managerRoles.includes(role));
  const finance = financeRoles.includes(role),
    manage = managerRoles.includes(role);
  if (!manage && role !== 'AUDITOR') {
    result.memberships = result.memberships.filter((m) => m.userId === userId);
    result.tickets = result.tickets.filter((t) => t.userId === userId);
    result.orders = result.orders.filter((o) => o.userId === userId);
    result.expenses = result.expenses.filter((e) => e.userId === userId);
    result.tasks = result.tasks.filter((t) => t.assignee === userId);
    result.payments = result.payments.filter((p) => p.userId === userId);
    result.audit = role === 'AUDITOR' ? result.audit : [];
  }
  if (!finance) {
    result.journal = [];
    result.budgets = [];
  }
  result.notifications = result.notifications.filter((n) => n.userId === userId);
  result.announcements = result.announcements.filter(
    (a) =>
      (a.status === 'PUBLISHED' || manage) &&
      (a.audience === 'PUBLIC' ||
        (a.audience === 'ALL_MEMBERS' && eligible(member(s), s.clock)) ||
        (a.audience === 'COMMITTEE_ONLY' && staffRoles.includes(role)) ||
        manage ||
        role === 'AUDITOR'),
  );
  result.readReceipts = s.readReceipts.filter(
    (r) =>
      result.announcements.some((a) => a.id === r.announcementId) &&
      (manage || role === 'AUDITOR' || r.userId === userId),
  );
  result.revisions = result.revisions.filter((r) =>
    result.announcements.some((a) => a.id === r.announcementId),
  );
  if (!manage && role !== 'AUDITOR') result.deliveries = [];
  result.users = s.users.filter(
    (u) => u.id === userId || s.memberships.some((m) => m.userId === u.id && m.clubId === clubId),
  );
  result.tiers = s.tiers.filter((t) => result.events.some((e) => e.id === t.eventId));
  result.availability = {};
  for (const tier of result.tiers)
    result.availability[tier.id] = Math.max(
      0,
      Math.min(
        tier.capacity -
          s.tickets.filter(
            (t) => t.tierId === tier.id && ['RESERVED', 'ISSUED', 'CHECKED_IN'].includes(t.status),
          ).length -
          activePromotions(s, tier.eventId).filter(
            (w) => w.tierId === tier.id && w.userId !== userId,
          ).length,
        result.events.find((e) => e.id === tier.eventId).capacity -
          s.tickets.filter(
            (t) =>
              t.eventId === tier.eventId && ['RESERVED', 'ISSUED', 'CHECKED_IN'].includes(t.status),
          ).length -
          activePromotions(s, tier.eventId).filter((w) => w.userId !== userId).length,
      ),
    );
  result.stock = {};
  for (const v of result.variants)
    result.stock[v.id] =
      v.stock -
      s.orders
        .filter((o) => o.status === 'PENDING')
        .flatMap((o) => o.items)
        .filter((i) => i.variantId === v.id)
        .reduce((a, i) => a + i.quantity, 0);
  result.fundraiserHealth = Object.fromEntries(
    result.fundraisers.map((f) => {
      const tasks = s.tasks.filter((t) => t.fundraiserId === f.id),
        shifts = s.shifts.filter((t) => t.fundraiserId === f.id);
      return [
        f.id,
        tasks.some(
          (t) => t.status === 'BLOCKED' || (t.status !== 'DONE' && new Date(t.due) < s.clock),
        )
          ? ['CRITICAL', 'A preparation task is blocked or overdue.']
          : !shifts.length || shifts.filter((t) => t.userId).length / shifts.length < 0.9
            ? ['AT_RISK', 'Volunteer shifts still need coverage.']
            : ['HEALTHY', 'At least 90% of shifts are filled and preparation is on schedule.'],
      ];
    }),
  );
  result.raised = {};
  for (const f of result.fundraisers)
    result.raised[f.id] = s.journal
      .filter((j) => j.clubId === clubId && j.reference === 'FUNDRAISER' && j.referenceId === f.id)
      .flatMap((j) => j.lines)
      .filter((l) => l.account === '4040')
      .reduce((a, l) => a + l.credit - l.debit, 0);
  result.financial = financialSummary({
    ...s,
    journal: s.journal.filter((j) => j.clubId === clubId),
  });
  if (!finance) result.financial = null;
  result.budgetUsage = Object.fromEntries(result.budgets.map((b) => [b.id, committed(s, b.id)]));
  result.budgetCatalog = s.budgets
    .filter((b) => b.clubId === clubId)
    .map((b) => ({ id: b.id, title: b.title, category: b.category }));
  result.scannerSamples = staffRoles.includes(role)
    ? {
        tickets: s.tickets
          .filter((t) => t.clubId === clubId)
          .map((t) => ({ code: t.code, status: t.status })),
        members: s.memberships
          .filter((m) => m.clubId === clubId)
          .map((m) => ({ code: m.passCode, status: m.status })),
      }
    : null;
  return result;
}
let queue = Promise.resolve();
async function transaction(action, fn, fast = false) {
  const run = async () => {
    await new Promise((r) => setTimeout(r, fast ? 35 : 180));
    let s = structuredClone(store.get());
    expiry(s);
    store.commit(s);
    if (s.failure && action !== 'demo.scenario' && action !== 'demo.reset') {
      const failure = s.failure;
      s.failure = null;
      store.commit(s);
      throw new ServiceError('SIMULATED_FAILURE', failure);
    }
    s = structuredClone(s);
    const before = structuredClone(s);
    const value = await fn(s);
    if (!action.startsWith('demo.') && !action.startsWith('auth.'))
      audit(s, action, value?.id || null, { sequence: before.sequence }, { sequence: s.sequence });
    store.commit(s);
    return value;
  };
  const result = queue.then(run, run);
  queue = result.catch(() => {});
  return result;
}
export const authService = {
  login: (userId) =>
    transaction('auth.login', (s) => {
      check(
        s.users.some((u) => u.id === userId),
        'INVALID_ACCOUNT',
        'Choose an available demo account.',
      );
      s.session.userId = userId;
      return actor(s);
    }),
  logout: () =>
    transaction('auth.logout', (s) => {
      s.session.userId = 'visitor';
    }),
  switchClub: (clubId) =>
    transaction('auth.club', (s) => {
      check(
        s.clubs.some((c) => c.id === clubId),
        'INVALID_CLUB',
        'Club not found.',
      );
      s.session.clubId = clubId;
    }),
  register: (input) =>
    transaction('auth.register', (s) => {
      check(
        input.name?.trim() &&
          /^SKY-\d{4}-\d{3}$/.test(input.studentId) &&
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) &&
          input.major &&
          input.emergency &&
          /^\d{10}$/.test(input.phone),
        'INVALID_PROFILE',
        'Complete your name, campus ID, email, major and emergency contact.',
      );
      check(
        !s.users.some((u) => u.email === input.email || u.studentId === input.studentId),
        'DUPLICATE_IDENTITY',
        'A profile already uses this email or campus ID.',
      );
      const u = { ...input, id: id(s, 'USR'), role: 'STUDENT' };
      s.users.push(u);
      s.session.userId = u.id;
      return u;
    }),
  savePreferences: (input) =>
    transaction('auth.preferences', (s) => {
      signedIn(s);
      actor(s).preferences = Object.fromEntries(
        ['renewals', 'announcements', 'orderUpdates'].map((key) => [key, input[key] !== false]),
      );
    }),
  updateProfile: (input) =>
    transaction('auth.profile', (s) => {
      signedIn(s);
      check(
        input.name?.trim() &&
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) &&
          /^SKY-\d{4}-\d{3}$/.test(input.studentId) &&
          /^\d{10}$/.test(input.phone),
        'INVALID_PROFILE',
        'Enter a valid name, campus email, student ID and ten-digit phone.',
      );
      check(
        !s.users.some(
          (u) =>
            u.id !== s.session.userId &&
            (u.email === input.email || u.studentId === input.studentId),
        ),
        'DUPLICATE_IDENTITY',
        'This email or student ID already belongs to another profile.',
      );
      for (const key of [
        'name',
        'email',
        'studentId',
        'phone',
        'major',
        'emergency',
        'graduation',
        'pronouns',
        'bio',
      ])
        if (key in input) actor(s)[key] = input[key];
    }),
};
export const membershipService = {
  getCurrent: async () => snapshot().membership,
  start: (planId) =>
    transaction('membership.start', (s) => {
      signedIn(s);
      const plan = scoped(s, 'plans', planId);
      let m = member(s);
      if (!m) {
        m = {
          id: id(s, 'MEM'),
          clubId: s.session.clubId,
          userId: s.session.userId,
          role: 'MEMBER',
          status: 'PENDING_PAYMENT',
          passCode: id(s, 'PASS'),
        };
        s.memberships.push(m);
      }
      m.pendingPlan = plan.id;
      return { id: m.id, amount: plan.amount };
    }),
  verify: (code) =>
    transaction(
      'membership.verify',
      (s) => {
        allow(s, 'scanner');
        let parsed;
        try {
          parsed = JSON.parse(code);
        } catch {}
        if (parsed)
          check(
            Math.abs(s.clock - parsed.timestamp) < 60000,
            'EXPIRED_PASS',
            'This rotating pass has expired. Refresh the member pass.',
          );
        const m = s.memberships.find(
          (m) => m.clubId === s.session.clubId && m.passCode === (parsed?.code || code),
        );
        check(
          eligible(m, s.clock),
          'INVALID_MEMBERSHIP',
          'Membership is expired, revoked or not registered.',
        );
        return { membership: m, user: s.users.find((u) => u.id === m.userId), tier: m.tier };
      },
      true,
    ),
  revoke: (memberId) =>
    transaction('membership.revoke', (s) => {
      allow(s, 'settings');
      const m = scoped(s, 'memberships', memberId);
      m.status = 'REVOKED';
      return m;
    }),
};
export const eventService = {
  list: async () => snapshot().events,
  reserve: ({ eventId, tierId }) =>
    transaction('ticket.reserve', (s) => {
      signedIn(s);
      const e = scoped(s, 'events', eventId);
      check(
        e.published &&
          s.clock >=
            new Date(e.salesOpen).getTime() - (eligible(member(s), s.clock) ? 48 * 3600000 : 0) &&
          s.clock < new Date(e.salesClose).getTime(),
        'SALES_CLOSED',
        'Ticket sales are closed for this event.',
      );
      const t = s.tiers.find((t) => t.id === tierId && t.eventId === e.id);
      check(t, 'INVALID_TIER', 'Choose an available ticket tier.');
      const issued = s.tickets.filter(
        (r) => r.eventId === e.id && ['RESERVED', 'ISSUED', 'CHECKED_IN'].includes(r.status),
      );
      check(
        issued.length < e.capacity && issued.filter((r) => r.tierId === t.id).length < t.capacity,
        'SOLD_OUT',
        'This tier is sold out. Join the waitlist for an opening.',
      );
      const promotions = activePromotions(s, eventId);
      const mine = promotions.find((w) => w.userId === s.session.userId && w.tierId === tierId);
      const others = promotions.filter((w) => w !== mine);
      check(
        issued.length + others.length < e.capacity &&
          issued.filter((r) => r.tierId === tierId).length +
            others.filter((w) => w.tierId === tierId).length <
            t.capacity,
        'WAITLIST_PRIORITY',
        'The released seat is reserved for the next waitlisted student during their four-hour window.',
      );
      const ticket = {
        id: id(s, 'TCK'),
        code: id(s, 'TCK-SKY'),
        clubId: s.session.clubId,
        userId: s.session.userId,
        eventId: e.id,
        tierId: t.id,
        status: 'RESERVED',
        amount: eligible(member(s), s.clock) ? t.memberPrice : t.publicPrice,
        reservedUntil: new Date(s.clock + 600000).toISOString(),
        createdAt: iso(s),
        history: [{ status: 'RESERVED', at: iso(s) }],
      };
      s.tickets.push(ticket);
      if (mine) mine.claimedAt = iso(s);
      return ticket;
    }),
  waitlist: (eventId) =>
    transaction('ticket.waitlist', (s) => {
      signedIn(s);
      scoped(s, 'events', eventId);
      check(
        !s.waitlist.some((w) => w.eventId === eventId && w.userId === s.session.userId),
        'ALREADY_WAITLISTED',
        'You are already on this waitlist.',
      );
      const w = {
        id: id(s, 'WAIT'),
        clubId: s.session.clubId,
        eventId,
        userId: s.session.userId,
        at: iso(s),
      };
      s.waitlist.push(w);
      return w;
    }),
  scan: ({ eventId, code, station = 'DOOR-01' }) =>
    transaction(
      'ticket.scan',
      (s) => {
        allow(s, 'scanner');
        const e = scoped(s, 'events', eventId);
        if (roleFor(s) === 'VOLUNTEER')
          check(
            e.scannerUsers?.includes(s.session.userId),
            'UNASSIGNED_SCANNER',
            'You are not assigned to this club event.',
          );
        let parsed;
        try {
          parsed = JSON.parse(code);
        } catch {}
        if (parsed)
          check(
            Math.abs(s.clock - parsed.timestamp) < 60000,
            'EXPIRED_PASS',
            'The rotating ticket pass is stale. Refresh it.',
          );
        const ticket = s.tickets.find(
          (t) => t.code === (parsed?.code || code) && t.clubId === s.session.clubId,
        );
        check(ticket, 'INVALID_TICKET', 'Ticket code was not found.');
        check(ticket.eventId === eventId, 'WRONG_EVENT', 'This ticket belongs to another event.');
        if (ticket.status === 'CHECKED_IN')
          return {
            duplicate: true,
            ticket,
            user: s.users.find((u) => u.id === ticket.userId),
            originalAt: ticket.checkedAt,
            station: ticket.station,
          };
        check(
          ticket.status === 'ISSUED',
          'INVALID_STATUS',
          `This ticket is ${ticket.status.toLowerCase()}. Admission is unavailable.`,
        );
        history(s, ticket, 'CHECKED_IN');
        ticket.checkedAt = iso(s);
        ticket.station = station;
        return {
          ticket,
          user: s.users.find((u) => u.id === ticket.userId),
          tier: s.tiers.find((t) => t.id === ticket.tierId)?.name,
        };
      },
      true,
    ),
  refund: (ticketId) =>
    transaction('ticket.refund', (s) => {
      const t = scoped(s, 'tickets', ticketId);
      owner(s, t);
      check(
        t.status === 'ISSUED',
        'INVALID_TRANSITION',
        'Only an unused issued ticket can be refunded.',
      );
      history(s, t, 'REFUNDED');
      if (t.amount) post(s, 'Ticket refund', t.amount, '4020', '1010', 'TICKET', t.id);
      paymentRecord(s, 'TICKET', t.id, t.amount, 'REFUNDED');
      return t;
    }),
  transfer: ({ ticketId, userId }) =>
    transaction('ticket.transfer', (s) => {
      const t = scoped(s, 'tickets', ticketId);
      owner(s, t);
      check(t.status === 'ISSUED', 'INVALID_TRANSITION', 'Only unused tickets can be transferred.');
      check(
        s.memberships.some((m) => m.userId === userId && m.clubId === s.session.clubId),
        'INVALID_ASSIGNEE',
        'Choose a verified member in this club.',
      );
      t.previousUserId = t.userId;
      t.userId = userId;
      t.history.push({ status: 'TRANSFERRED', at: iso(s) });
      return t;
    }),
  save: (input) =>
    transaction('event.save', (s) => {
      allow(s, 'manage');
      check(
        input.title?.trim() &&
          input.venue &&
          new Date(input.endsAt) > new Date(input.startsAt) &&
          new Date(input.salesClose) > new Date(input.salesOpen) &&
          new Date(input.salesClose) <= new Date(input.startsAt) &&
          Number.isInteger(input.capacity) &&
          input.capacity > 0,
        'INVALID_EVENT',
        'Complete the title, venue, valid times and capacity.',
      );
      let e = input.id ? scoped(s, 'events', input.id) : null;
      if (!e) {
        e = { id: id(s, 'EVT'), clubId: s.session.clubId, visual: 'meet' };
        s.events.push(e);
      }
      if (input.scannerUsers)
        check(
          input.scannerUsers.every((userId) =>
            s.memberships.some(
              (m) => m.userId === userId && m.clubId === s.session.clubId && m.role === 'VOLUNTEER',
            ),
          ),
          'INVALID_ASSIGNEE',
          'Scanner assignments must be volunteers in this club.',
        );
      const used = s.tickets.filter(
        (t) => t.eventId === e.id && ['RESERVED', 'ISSUED', 'CHECKED_IN'].includes(t.status),
      ).length;
      check(
        input.capacity >= used,
        'CAPACITY_RESERVED',
        'Capacity cannot be lower than current issued and reserved tickets.',
      );
      assignFields(e, input);
      if (!s.tiers.some((t) => t.eventId === e.id)) {
        const tier = {
          id: id(s, 'TIER'),
          eventId: e.id,
          name: 'General admission',
          capacity: e.capacity,
          memberPrice: input.memberPrice ?? 25000,
          publicPrice: input.publicPrice ?? 35000,
        };
        s.tiers.push(tier);
      }
      return e;
    }),
  saveTier: (input) =>
    transaction('event.tier', (s) => {
      allow(s, 'manage');
      scoped(s, 'events', input.eventId);
      check(
        Number.isInteger(input.capacity) &&
          input.capacity > 0 &&
          input.memberPrice >= 0 &&
          input.publicPrice >= input.memberPrice,
        'INVALID_TIER',
        'Tier capacity and prices are invalid.',
      );
      let t = s.tiers.find((t) => t.id === input.id && t.eventId === input.eventId);
      if (!t) {
        t = { id: id(s, 'TIER'), eventId: input.eventId };
        s.tiers.push(t);
      }
      check(
        s.tickets.filter(
          (r) => r.tierId === t.id && ['RESERVED', 'ISSUED', 'CHECKED_IN'].includes(r.status),
        ).length <= input.capacity,
        'CAPACITY_RESERVED',
        'Tier capacity is below existing reservations.',
      );
      assignFields(t, input);
      return t;
    }),
};
export const commerceService = {
  reserve: (items) =>
    transaction('order.reserve', (s) => {
      signedIn(s);
      check(items.length > 0, 'EMPTY_CART', 'Add a product to your cart.');
      const normalized = [];
      for (const item of items) {
        check(
          Number.isInteger(item.quantity) && item.quantity > 0,
          'INVALID_QUANTITY',
          'Quantity must be a positive whole number.',
        );
        const existing = normalized.find((i) => i.variantId === item.variantId);
        if (existing) existing.quantity += item.quantity;
        else normalized.push({ ...item });
      }
      for (const item of normalized) {
        const v = scoped(s, 'variants', item.variantId);
        const held = s.orders
          .filter((o) => o.status === 'PENDING')
          .flatMap((o) => o.items)
          .filter((i) => i.variantId === v.id)
          .reduce((a, i) => a + i.quantity, 0);
        check(
          v.stock - held >= item.quantity,
          'OUT_OF_STOCK',
          'A selected variant no longer has enough available stock.',
        );
        item.price = eligible(member(s), s.clock) ? v.memberPrice : v.publicPrice;
      }
      const o = {
        id: id(s, 'ORD'),
        clubId: s.session.clubId,
        userId: s.session.userId,
        status: 'PENDING',
        items: normalized,
        amount: normalized.reduce((a, i) => a + i.price * i.quantity, 0),
        createdAt: iso(s),
        reservedUntil: new Date(s.clock + 600000).toISOString(),
        pickup: s.clubs.find((c) => c.id === s.session.clubId).location,
        history: [{ status: 'PENDING', at: iso(s) }],
      };
      s.orders.push(o);
      return o;
    }),
  cancel: (orderId) =>
    transaction('order.cancel', (s) => {
      const o = scoped(s, 'orders', orderId);
      owner(s, o);
      check(
        ['PENDING', 'PAID', 'PROCESSING'].includes(o.status),
        'INVALID_TRANSITION',
        'This order can no longer be cancelled before pickup.',
      );
      const paid = o.status !== 'PENDING';
      if (paid) {
        o.items.forEach((i) => {
          scoped(s, 'variants', i.variantId).stock += i.quantity;
        });
        post(s, 'Merchandise cancellation refund', o.amount, '4030', '1010', 'ORDER', o.id);
        paymentRecord(s, 'ORDER', o.id, o.amount, 'REFUNDED');
      }
      history(s, o, 'CANCELLED');
      o.refundStatus = paid ? 'REFUNDED' : null;
      return o;
    }),
  fulfill: (orderId) =>
    transaction('order.fulfill', (s) => {
      allow(s, 'inventory');
      const o = scoped(s, 'orders', orderId);
      check(
        ['PAID', 'PROCESSING'].includes(o.status),
        'INVALID_TRANSITION',
        'Only paid or processing orders can be fulfilled.',
      );
      history(s, o, o.status === 'PAID' ? 'PROCESSING' : 'FULFILLED');
      return o;
    }),
  requestReturn: (orderId) =>
    transaction('order.return-request', (s) => {
      const o = scoped(s, 'orders', orderId);
      owner(s, o);
      check(
        o.status === 'FULFILLED' && !o.returnRequested,
        'INVALID_TRANSITION',
        'Returns are available once for fulfilled orders.',
      );
      o.returnRequested = true;
      o.history.push({ status: 'RETURN_REQUESTED', at: iso(s) });
      return o;
    }),
  inspect: ({ orderId, condition }) =>
    transaction('order.inspect', (s) => {
      allow(s, 'inventory');
      const o = scoped(s, 'orders', orderId);
      check(
        o.status === 'FULFILLED' &&
          o.returnRequested &&
          ['SELLABLE', 'DAMAGED'].includes(condition),
        'INVALID_TRANSITION',
        'Inspect a requested return and select its condition.',
      );
      o.condition = condition;
      if (condition === 'SELLABLE')
        o.items.forEach((i) => {
          scoped(s, 'variants', i.variantId).stock += i.quantity;
        });
      else {
        const cost = o.items.reduce(
          (a, i) => a + scoped(s, 'variants', i.variantId).cost * i.quantity,
          0,
        );
        post(s, 'Damaged return inventory write-off', cost, '5030', '3010', 'INVENTORY_LOSS', o.id);
      }
      post(s, 'Returned merchandise refund', o.amount, '4030', '1010', 'ORDER', o.id);
      paymentRecord(s, 'ORDER', o.id, o.amount, 'REFUNDED');
      history(s, o, 'REFUNDED');
      o.refundStatus = 'REFUNDED';
      return o;
    }),
  adjust: ({ variantId, change, reason }) =>
    transaction('inventory.adjust', (s) => {
      allow(s, 'inventory');
      const v = scoped(s, 'variants', variantId);
      check(
        Number.isInteger(change) && change !== 0 && reason?.trim(),
        'INVALID_ADJUSTMENT',
        'Provide a whole-number adjustment and a reason.',
      );
      const held = s.orders
        .filter((o) => o.status === 'PENDING')
        .flatMap((o) => o.items)
        .filter((i) => i.variantId === v.id)
        .reduce((a, i) => a + i.quantity, 0);
      check(
        v.stock + change >= held,
        'NEGATIVE_STOCK',
        'Stock cannot be below current reservations.',
      );
      const before = v.stock;
      v.stock += change;
      audit(s, 'inventory.reason', v.id, { stock: before }, { stock: v.stock, reason });
      return v;
    }),
  saveProduct: (input) =>
    transaction('product.save', (s) => {
      allow(s, 'inventory');
      check(
        input.title?.trim() && input.description,
        'INVALID_PRODUCT',
        'Title and description are required.',
      );
      let p = input.id ? scoped(s, 'products', input.id) : null;
      if (!p) {
        p = { id: id(s, 'PROD'), clubId: s.session.clubId, visual: 'tee', category: 'Apparel' };
        s.products.push(p);
      }
      assignFields(p, input);
      return p;
    }),
  saveVariant: (input) =>
    transaction('variant.save', (s) => {
      allow(s, 'inventory');
      scoped(s, 'products', input.productId);
      check(
        input.sku &&
          input.size &&
          Number.isInteger(input.stock) &&
          input.stock >= 0 &&
          Number.isInteger(input.memberPrice) &&
          input.memberPrice >= 0 &&
          input.publicPrice >= input.memberPrice,
        'INVALID_VARIANT',
        'Complete the SKU, size, stock and valid prices.',
      );
      check(
        !s.variants.some((v) => v.sku === input.sku && v.id !== input.id),
        'DUPLICATE_SKU',
        'SKU already exists.',
      );
      let v = input.id ? scoped(s, 'variants', input.id) : null;
      if (!v) {
        v = { id: id(s, 'VAR'), clubId: s.session.clubId, cost: 18000 };
        s.variants.push(v);
      }
      const held = s.orders
        .filter((o) => o.status === 'PENDING')
        .flatMap((o) => o.items)
        .filter((i) => i.variantId === v.id)
        .reduce((a, i) => a + i.quantity, 0);
      check(input.stock >= held, 'STOCK_RESERVED', 'Stock cannot be below active reservations.');
      assignFields(v, input);
      return v;
    }),
};
export const paymentService = {
  confirm: ({ kind, recordId, outcome }) =>
    transaction('payment.confirm', (s) => {
      signedIn(s);
      if (kind === 'membership') {
        const m = scoped(s, 'memberships', recordId);
        owner(s, { userId: m.userId });
        const plan = s.plans.find((p) => p.id === m.pendingPlan);
        check(plan, 'NO_CHECKOUT', 'Start a membership checkout first.');
        if (outcome !== 'success') {
          paymentRecord(s, 'MEMBERSHIP', m.id, plan.amount, outcome.toUpperCase());
          return {
            status: outcome.toUpperCase(),
            message: 'Demo payment did not complete. Your existing membership is unchanged.',
          };
        }
        const priorEnd = m.validUntil ? new Date(m.validUntil).getTime() : s.clock;
        m.validFrom = iso(s);
        m.validUntil = new Date(Math.max(s.clock, priorEnd) + 365 * day).toISOString();
        m.tier = plan.tier;
        m.dues = plan.amount;
        m.status = 'ACTIVE';
        delete m.pendingPlan;
        if (plan.amount)
          post(s, 'Membership dues payment', plan.amount, '1010', '4010', 'MEMBERSHIP', m.id);
        paymentRecord(s, 'MEMBERSHIP', m.id, plan.amount);
        notify(
          s,
          m.userId,
          'Your membership is active',
          'Your digital pass and discounts are ready.',
          '/portal/pass',
        );
        return {
          status: 'SUCCEEDED',
          id: m.id,
          message: 'Demo membership activated. Your member benefits are ready.',
        };
      }
      const collection = kind === 'ticket' ? 'tickets' : 'orders';
      const r = scoped(s, collection, recordId);
      owner(s, r);
      if (['ISSUED', 'CHECKED_IN', 'PAID', 'PROCESSING', 'FULFILLED'].includes(r.status))
        return {
          status: 'SUCCEEDED',
          id: r.id,
          message:
            'This demo payment was already processed; no duplicate charge or record was created.',
        };
      if (outcome === 'delayed' || r.status === 'CANCELLED') {
        if (
          (kind === 'ticket' && r.status === 'RESERVED') ||
          (kind === 'order' && r.status === 'PENDING')
        )
          history(s, r, 'CANCELLED');
        if (!s.payments.some((p) => p.referenceId === r.id && p.status === 'LATE_REFUNDED'))
          paymentRecord(s, kind.toUpperCase(), r.id, r.amount, 'LATE_REFUNDED');
        return {
          status: 'LATE_REFUNDED',
          id: r.id,
          message:
            'The hold expired. Demo payment automatically refunded; no ticket or order was issued.',
        };
      }
      check(
        r.status === (kind === 'ticket' ? 'RESERVED' : 'PENDING'),
        'INVALID_TRANSITION',
        'This checkout is no longer payable.',
      );
      if (outcome !== 'success') {
        paymentRecord(s, kind.toUpperCase(), r.id, r.amount, outcome.toUpperCase());
        if (outcome === 'cancelled') history(s, r, 'CANCELLED');
        return {
          status: outcome.toUpperCase(),
          id: r.id,
          message:
            outcome === 'failed'
              ? 'Demo payment failed. Retry while your reservation is active.'
              : 'Demo checkout cancelled and the hold released.',
        };
      }
      if (kind === 'order')
        r.items.forEach((i) => {
          const v = scoped(s, 'variants', i.variantId);
          check(v.stock >= i.quantity, 'OUT_OF_STOCK', 'Stock is no longer available.');
          v.stock -= i.quantity;
        });
      history(s, r, kind === 'ticket' ? 'ISSUED' : 'PAID');
      if (r.amount)
        post(
          s,
          kind === 'ticket' ? 'Event ticket payment' : 'Merchandise payment',
          r.amount,
          '1010',
          kind === 'ticket' ? '4020' : '4030',
          kind === 'ticket' ? 'TICKET' : 'ORDER',
          r.id,
        );
      paymentRecord(s, kind.toUpperCase(), r.id, r.amount);
      notify(
        s,
        r.userId,
        kind === 'ticket' ? 'Your ticket is ready' : 'Your order is confirmed',
        'Demo payment succeeded.',
        kind === 'ticket' ? `/portal/tickets/${r.id}` : `/portal/orders/${r.id}`,
      );
      return {
        status: 'SUCCEEDED',
        id: r.id,
        message:
          kind === 'ticket'
            ? 'Demo payment confirmed. Your ticket is ready.'
            : 'Demo order paid. Collect it at the club desk.',
      };
    }),
};
export const taskService = {
  save: (input) =>
    transaction('task.save', (s) => {
      allow(s, 'manage');
      check(
        input.title?.trim() &&
          taskStatuses.includes(input.status) &&
          !isNaN(new Date(input.due).getTime()),
        'INVALID_TASK',
        'Complete the title, status and due date.',
      );
      if (input.assignee)
        check(
          s.memberships.some((m) => m.clubId === s.session.clubId && m.userId === input.assignee),
          'INVALID_ASSIGNEE',
          'Assign a member of this club.',
        );
      if (input.fundraiserId) scoped(s, 'fundraisers', input.fundraiserId);
      let task = input.id ? scoped(s, 'tasks', input.id) : null;
      if (!task) {
        task = { id: id(s, 'TASK'), clubId: s.session.clubId, checklist: [] };
        s.tasks.push(task);
      }
      assignFields(task, input);
      task.status = input.status;
      return task;
    }),
  update: ({ taskId, status, checklist }) =>
    transaction('task.update', (s) => {
      const t = scoped(s, 'tasks', taskId);
      check(
        managerRoles.includes(roleFor(s)) ||
          (roleFor(s) === 'VOLUNTEER' && t.assignee === s.session.userId),
        'FORBIDDEN',
        'Volunteers can update only their assigned tasks.',
      );
      if (status) {
        check(
          taskStatuses.includes(status),
          'INVALID_STATUS',
          'Choose one of the five task states.',
        );
        t.status = status;
      }
      if (checklist) t.checklist = checklist;
      return t;
    }),
};
export const fundraiserService = {
  save: (input) =>
    transaction('fundraiser.save', (s) => {
      allow(s, 'manage');
      money(input.target);
      check(
        input.title?.trim() && new Date(input.endsAt) > new Date(input.startsAt),
        'INVALID_FUNDRAISER',
        'Enter a title and valid campaign dates.',
      );
      let f = input.id ? scoped(s, 'fundraisers', input.id) : null;
      if (!f) {
        f = { id: id(s, 'FUND'), clubId: s.session.clubId, active: true };
        s.fundraisers.push(f);
      }
      assignFields(f, input);
      return f;
    }),
  donate: ({ fundraiserId, amount, idempotencyKey }) =>
    transaction('fundraiser.donate', (s) => {
      signedIn(s);
      if (idempotencyKey) {
        const prior = s.payments.find(
          (p) =>
            p.clubId === s.session.clubId &&
            p.userId === s.session.userId &&
            p.idempotencyKey === idempotencyKey,
        );
        if (prior) return { id: prior.donationId || prior.id };
      }
      const f = scoped(s, 'fundraisers', fundraiserId);
      money(amount);
      post(s, `${f.title} · demo donation`, amount, '1010', '4040', 'FUNDRAISER', f.id);
      const pay = id(s, 'DON');
      paymentRecord(s, 'FUNDRAISER', f.id, amount);
      s.payments.at(-1).idempotencyKey = idempotencyKey;
      s.payments.at(-1).donationId = pay;
      return { id: pay };
    }),
  reverseDonation: (paymentId) =>
    transaction('fundraiser.reverse', (s) => {
      allow(s, 'finance');
      check(roleFor(s) === 'TREASURER', 'FORBIDDEN', 'Only the Treasurer can reverse donations.');
      const p = scoped(s, 'payments', paymentId);
      check(
        p.reference === 'FUNDRAISER' && p.status === 'SUCCEEDED',
        'INVALID_TRANSITION',
        'This donation is unavailable for reversal.',
      );
      post(s, 'Demo donation refund', p.amount, '4040', '1010', 'FUNDRAISER', p.referenceId);
      p.status = 'REFUNDED';
      return p;
    }),
  saveShift: (input) =>
    transaction('shift.save', (s) => {
      allow(s, 'manage');
      scoped(s, 'fundraisers', input.fundraiserId);
      check(
        input.title?.trim() && new Date(input.endsAt) > new Date(input.startsAt),
        'INVALID_SHIFT',
        'Enter a role and valid shift times.',
      );
      const shift = { ...input, id: id(s, 'SHIFT'), clubId: s.session.clubId, userId: null };
      s.shifts.push(shift);
      return shift;
    }),
  claim: (shiftId) =>
    transaction('shift.claim', (s) => {
      check(
        staffRoles.includes(roleFor(s)),
        'FORBIDDEN',
        'Only club volunteers and officers may claim shifts.',
      );
      const shift = scoped(s, 'shifts', shiftId);
      check(!shift.userId, 'SHIFT_FILLED', 'This shift has already been claimed.');
      check(
        !s.shifts.some(
          (x) =>
            x.userId === s.session.userId &&
            new Date(x.startsAt) < new Date(shift.endsAt) &&
            new Date(x.endsAt) > new Date(shift.startsAt),
        ),
        'SHIFT_CONFLICT',
        'This shift overlaps with one of your existing assignments.',
      );
      shift.userId = s.session.userId;
      return shift;
    }),
  release: (shiftId) =>
    transaction('shift.release', (s) => {
      const shift = scoped(s, 'shifts', shiftId);
      check(
        shift.userId === s.session.userId || managerRoles.includes(roleFor(s)),
        'FORBIDDEN',
        'You can release only your own shift.',
      );
      check(
        new Date(shift.startsAt) > s.clock,
        'SHIFT_STARTED',
        'A shift that has started cannot be released.',
      );
      shift.userId = null;
      return shift;
    }),
};
async function hash(value) {
  if (!globalThis.crypto?.subtle) return 'hash-unavailable';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, '0')).join('');
}
export const broadcastService = {
  save: (input) =>
    transaction('broadcast.save', async (s) => {
      allow(s, 'manage');
      check(
        input.title?.trim() &&
          input.content?.trim() &&
          ['PUBLIC', 'ALL_MEMBERS', 'COMMITTEE_ONLY'].includes(input.audience),
        'INVALID_ANNOUNCEMENT',
        'Complete the title, content and audience.',
      );
      let a = input.id ? scoped(s, 'announcements', input.id) : null;
      if (a?.status === 'PUBLISHED')
        check(
          roleFor(s) === 'PRESIDENT',
          'FORBIDDEN',
          'Only the President can revise published announcements.',
        );
      if (!a) {
        a = {
          id: id(s, 'ANN'),
          clubId: s.session.clubId,
          authorId: s.session.userId,
          status: 'DRAFT',
        };
        s.announcements.push(a);
      }
      assignFields(a, input);
      const number = s.revisions.filter((r) => r.announcementId === a.id).length + 1;
      const revision = {
        id: id(s, 'REV'),
        clubId: s.session.clubId,
        announcementId: a.id,
        number,
        title: a.title,
        content: a.content,
        at: iso(s),
        authorId: s.session.userId,
      };
      revision.hash = await hash(JSON.stringify(revision));
      s.revisions.push(revision);
      a.updatedAt = iso(s);
      return a;
    }),
  review: (announcementId) =>
    transaction('broadcast.review', (s) => {
      allow(s, 'reviewBroadcast');
      const a = scoped(s, 'announcements', announcementId);
      check(a.status === 'DRAFT', 'INVALID_TRANSITION', 'Only drafts can be reviewed.');
      a.status = 'REVIEWED';
      return a;
    }),
  publish: (announcementId) =>
    transaction('broadcast.publish', (s) => {
      allow(s, 'publish');
      const a = scoped(s, 'announcements', announcementId);
      check(
        ['DRAFT', 'REVIEWED'].includes(a.status),
        'INVALID_TRANSITION',
        'This announcement is already published.',
      );
      a.status = 'PUBLISHED';
      a.publishedAt = iso(s);
      for (const m of s.memberships.filter(
        (m) =>
          m.clubId === s.session.clubId &&
          (a.audience !== 'COMMITTEE_ONLY' || staffRoles.includes(m.role)),
      )) {
        s.deliveries.push({
          id: id(s, 'DEL'),
          clubId: s.session.clubId,
          announcementId: a.id,
          userId: m.userId,
          status: 'QUEUED',
        });
        notify(s, m.userId, a.title, a.content, '/portal/announcements');
      }
      return a;
    }),
  dispatch: (announcementId) =>
    transaction('broadcast.dispatch', (s) => {
      allow(s, 'reviewBroadcast');
      for (const d of s.deliveries.filter(
        (d) => d.announcementId === announcementId && d.clubId === s.session.clubId,
      ))
        d.status =
          d.status === 'QUEUED'
            ? 'SENT'
            : ['SENT', 'FAILED', 'BOUNCED'].includes(d.status)
              ? 'DELIVERED'
              : d.status;
      return { id: announcementId };
    }),
  read: (announcementId) =>
    transaction('broadcast.read', (s) => {
      signedIn(s);
      check(
        snapshot().announcements.some((a) => a.id === announcementId),
        'FORBIDDEN',
        'This announcement is not available to you.',
      );
      if (
        !s.readReceipts.some(
          (r) => r.announcementId === announcementId && r.userId === s.session.userId,
        )
      )
        s.readReceipts.push({ announcementId, userId: s.session.userId, at: iso(s) });
      return { id: announcementId };
    }),
  pin: (announcementId) =>
    transaction('broadcast.pin', (s) => {
      allow(s, 'publish');
      const a = scoped(s, 'announcements', announcementId);
      a.pinned = !a.pinned;
      return a;
    }),
};
export const expenseService = {
  save: (input) =>
    transaction('expense.save', (s) => {
      allow(s, 'expense');
      money(input.amount);
      check(
        input.title?.trim() &&
          input.merchant?.trim() &&
          input.purpose?.trim() &&
          input.purchaseDate &&
          input.category,
        'INVALID_EXPENSE',
        'Complete all required expense fields.',
      );
      check(
        new Date(input.purchaseDate).getTime() <= s.clock,
        'FUTURE_DATE',
        'Purchase date cannot be in the future.',
      );
      check(
        input.receipt || input.draft,
        'RECEIPT_REQUIRED',
        'Attach a receipt before submitting.',
      );
      if (input.eventId) scoped(s, 'events', input.eventId);
      if (input.fundraiserId) scoped(s, 'fundraisers', input.fundraiserId);
      if (input.budgetId) scoped(s, 'budgets', input.budgetId);
      let e = input.id ? scoped(s, 'expenses', input.id) : null;
      if (e)
        check(
          e.userId === s.session.userId && ['DRAFT', 'NEEDS_CORRECTION'].includes(e.status),
          'INVALID_TRANSITION',
          'Only your draft or correction-requested claims can be edited.',
        );
      else {
        e = { id: id(s, 'EXP'), clubId: s.session.clubId, userId: s.session.userId, history: [] };
        s.expenses.push(e);
      }
      assignFields(e, input);
      history(s, e, input.draft ? 'DRAFT' : 'SUBMITTED');
      return e;
    }),
  decision: ({ expenseId, decision, reason, override = false }) =>
    transaction('expense.decision', (s) => {
      const e = scoped(s, 'expenses', expenseId),
        role = roleFor(s);
      check(
        ['TREASURER', 'PRESIDENT'].includes(role),
        'FORBIDDEN',
        'Only the independent Treasurer or President can review expenses.',
      );
      check(
        e.userId !== s.session.userId,
        'SELF_APPROVAL',
        'You cannot review, approve or pay your own expense claim.',
      );
      const budget = e.budgetId ? s.budgets.find((b) => b.id === e.budgetId) : null;
      const final = decision === 'president' || (decision === 'treasurer' && e.amount < 250000);
      if (final && budget && committed(s, budget.id) + e.amount > budget.allocated) {
        check(
          override && role === 'PRESIDENT' && reason?.trim(),
          'BUDGET_EXCEEDED',
          'Approval exceeds this budget. Increase the envelope or record a President override with a reason.',
        );
        audit(
          s,
          'budget.override',
          budget.id,
          { allocated: budget.allocated },
          { reason, expenseId: e.id },
        );
      }
      if (decision === 'review') {
        check(
          e.status === 'SUBMITTED',
          'INVALID_TRANSITION',
          'Only submitted claims can enter review.',
        );
        history(s, e, 'UNDER_REVIEW');
      } else if (['correction', 'reject'].includes(decision)) {
        check(
          e.status === 'UNDER_REVIEW',
          'INVALID_TRANSITION',
          'Open the claim for review first.',
        );
        check(reason?.trim(), 'REASON_REQUIRED', 'Provide a reason for this decision.');
        e.reason = reason;
        history(s, e, decision === 'correction' ? 'NEEDS_CORRECTION' : 'REJECTED');
        notify(s, e.userId, 'Expense review update', reason, `/portal/expenses/${e.id}`);
      } else if (decision === 'treasurer') {
        check(
          role === 'TREASURER' && e.status === 'UNDER_REVIEW',
          'INVALID_TRANSITION',
          'Treasurer approval requires an independent claim under review.',
        );
        e.treasurerId = s.session.userId;
        history(s, e, 'TREASURER_APPROVED');
        if (final)
          post(
            s,
            e.title,
            e.amount,
            e.category === 'EVENT_PRODUCTION' ? '5010' : '5020',
            '2010',
            'EXPENSE_ACCRUAL',
            e.id,
          );
      } else if (decision === 'president') {
        check(
          role === 'PRESIDENT' && e.status === 'TREASURER_APPROVED' && e.amount >= 250000,
          'INVALID_TRANSITION',
          'President approval follows Treasurer verification for claims of ₹2,500 or more.',
        );
        check(
          e.treasurerId !== s.session.userId,
          'SELF_APPROVAL',
          'Two independent officers must approve this claim.',
        );
        e.presidentId = s.session.userId;
        history(s, e, 'PRESIDENT_APPROVED');
        post(
          s,
          e.title,
          e.amount,
          e.category === 'EVENT_PRODUCTION' ? '5010' : '5020',
          '2010',
          'EXPENSE_ACCRUAL',
          e.id,
        );
      } else if (decision === 'disburse') {
        check(
          role === 'TREASURER' &&
            (e.status === 'PRESIDENT_APPROVED' ||
              (e.status === 'TREASURER_APPROVED' && e.amount < 250000)),
          'INVALID_TRANSITION',
          'Disbursement requires final approval and the Treasurer role.',
        );
        const cash = financialSummary({
          ...s,
          journal: s.journal.filter((j) => j.clubId === s.session.clubId),
        }).cash;
        check(cash >= e.amount, 'INSUFFICIENT_FUNDS', 'Demo operating cash is insufficient.');
        history(s, e, 'DISBURSED');
        post(s, `${e.title} · payout`, e.amount, '2010', '1010', 'EXPENSE_PAYOUT', e.id);
      } else check(false, 'INVALID_DECISION', 'Unknown review action.');
      return e;
    }),
};
export const financeService = {
  getSummary: async () => {
    const s = store.get();
    allow(s, 'finance');
    return snapshot().financial;
  },
  saveBudget: (input) =>
    transaction('budget.save', (s) => {
      check(
        ['TREASURER', 'PRESIDENT'].includes(roleFor(s)),
        'FORBIDDEN',
        'Budget changes require Treasurer or President access.',
      );
      money(input.allocated);
      check(
        input.title?.trim() && input.category && input.fiscalYear,
        'INVALID_BUDGET',
        'Complete the budget title, year and category.',
      );
      let b = input.id ? scoped(s, 'budgets', input.id) : null;
      if (!b) {
        check(
          !s.budgets.some(
            (b) =>
              b.clubId === s.session.clubId &&
              b.category === input.category &&
              b.fiscalYear === input.fiscalYear &&
              (b.eventId || '') === (input.eventId || ''),
          ),
          'DUPLICATE_BUDGET',
          'An envelope already exists for this category and event.',
        );
        b = { id: id(s, 'BUD'), clubId: s.session.clubId };
        s.budgets.push(b);
      }
      assignFields(b, input);
      return b;
    }),
  adjustment: (input) =>
    transaction('ledger.adjustment', (s) => {
      check(
        roleFor(s) === 'TREASURER',
        'FORBIDDEN',
        'Only the Treasurer can post ledger adjustments.',
      );
      money(input.amount);
      check(
        input.description?.trim() &&
          input.debit !== input.credit &&
          /^\d{4}$/.test(input.debit) &&
          /^\d{4}$/.test(input.credit),
        'INVALID_JOURNAL',
        'Provide a description and two different four-digit account codes.',
      );
      post(s, input.description, input.amount, input.debit, input.credit, 'MANUAL', null);
    }),
};
export const adminService = {
  saveClub: (input) =>
    transaction('club.settings', (s) => {
      allow(s, 'settings');
      check(
        input.name?.trim() && input.description && input.fiscalYear,
        'INVALID_CLUB',
        'Name, description and fiscal year are required.',
      );
      check(
        !input.eventCapacity || (Number.isInteger(input.eventCapacity) && input.eventCapacity > 0),
        'INVALID_CAPACITY',
        'Event default capacity must be a positive whole number.',
      );
      const club = s.clubs.find((c) => c.id === s.session.clubId);
      for (const key of [
        'name',
        'description',
        'fiscalYear',
        'location',
        'initials',
        'eventCapacity',
      ])
        if (key in input) club[key] = input[key];
    }),
  savePlan: (input) =>
    transaction('membership.plan', (s) => {
      allow(s, 'settings');
      check(
        Number.isInteger(input.amount) && input.amount >= 0 && input.title?.trim(),
        'INVALID_PLAN',
        'Enter a plan title and a nonnegative dues amount.',
      );
      const p = scoped(s, 'plans', input.id);
      assignFields(p, input);
      return p;
    }),
  assignRole: ({ membershipId, role, handover = false }) =>
    transaction('role.assign', (s) => {
      allow(s, 'settings');
      check([...staffRoles, 'MEMBER'].includes(role), 'INVALID_ROLE', 'Choose a club role.');
      const m = scoped(s, 'memberships', membershipId);
      check(
        m.userId !== s.session.userId,
        'SELF_ROLE_CHANGE',
        'Ask the next President to change your role after handover.',
      );
      const previous = m.role;
      if (handover) {
        check(role === 'PRESIDENT', 'INVALID_HANDOVER', 'Handover assigns the next President.');
        const current = member(s);
        s.officerHistory.push({
          id: id(s, 'OFF'),
          clubId: s.session.clubId,
          userId: current.userId,
          role: current.role,
          until: iso(s),
        });
        current.role = 'MEMBER';
      }
      m.role = role;
      s.officerHistory.push({
        id: id(s, 'OFF'),
        clubId: s.session.clubId,
        userId: m.userId,
        role: previous,
        until: iso(s),
      });
      return m;
    }),
};
export const notificationService = {
  read: (noticeId) =>
    transaction('notification.read', (s) => {
      const n = scoped(s, 'notifications', noticeId);
      check(n.userId === s.session.userId, 'FORBIDDEN', 'Notification belongs to another user.');
      n.read = true;
      return n;
    }),
};
export const demoService = {
  reset: () =>
    transaction('demo.reset', (s) => {
      const session = { ...s.session };
      store.reset();
      Object.assign(s, structuredClone(store.get()));
      s.session = session;
      return { message: 'Demo records reset.' };
    }),
  advance: (milliseconds) =>
    transaction('demo.time', (s) => {
      check(
        Number.isFinite(milliseconds) && milliseconds >= 0,
        'INVALID_TIME',
        'Advance demo time by a nonnegative duration.',
      );
      s.clock += milliseconds;
      expiry(s);
    }),
  scenario: (name) =>
    transaction('demo.scenario', (s) => {
      const current = member(s);
      if (name === 'service-failure')
        s.failure = 'The demo service deliberately failed. Retry this action.';
      else if (name === 'session-expired') {
        s.session.userId = 'visitor';
      } else if (name === 'grace' || name === 'expired' || name === 'renewal') {
        check(current, 'MEMBERSHIP_REQUIRED', 'Choose a member account first.');
        current.validUntil = new Date(
          s.clock + (name === 'grace' ? -3 : name === 'expired' ? -20 : 7) * day,
        ).toISOString();
        expiry(s);
      } else if (name === 'sold-out') {
        const e = s.events.find((e) => e.clubId === s.session.clubId);
        const occupied = s.tickets.filter(
          (t) => t.eventId === e.id && ['RESERVED', 'ISSUED', 'CHECKED_IN'].includes(t.status),
        ).length;
        e.capacity = occupied;
      } else if (name === 'out-of-stock') {
        s.variants.filter((v) => v.clubId === s.session.clubId).forEach((v) => (v.stock = 0));
      } else if (name === 'reservation-expired' || name === 'abandoned-checkout') {
        s.clock += 601000;
        expiry(s);
      } else if (name === 'overdue-task') {
        s.tasks
          .filter((t) => t.clubId === s.session.clubId && t.status !== 'DONE')
          .forEach((t) => (t.due = new Date(s.clock - day).toISOString()));
      } else if (name === 'unfilled-shifts') {
        s.shifts.filter((t) => t.clubId === s.session.clubId).forEach((t) => (t.userId = null));
      } else if (name === 'budget-exceeded') {
        s.budgets.filter((b) => b.clubId === s.session.clubId).forEach((b) => (b.allocated = 1));
      } else if (name === 'delivery-bounced') {
        s.deliveries
          .filter((d) => d.clubId === s.session.clubId)
          .forEach((d) => (d.status = 'BOUNCED'));
      } else if (name === 'delivery-failed') {
        s.deliveries
          .filter((d) => d.clubId === s.session.clubId)
          .forEach((d) => (d.status = 'FAILED'));
      } else if (name === 'claim-correction' || name === 'claim-rejected') {
        const e = s.expenses.find((e) => e.clubId === s.session.clubId);
        check(e, 'CLAIM_REQUIRED', 'Submit an expense first.');
        history(s, e, name === 'claim-correction' ? 'NEEDS_CORRECTION' : 'REJECTED');
        e.reason = 'Demo reviewer: please provide a clearer itemized receipt.';
      } else if (name === 'duplicate-scan') {
        const t = s.tickets.find((t) => t.clubId === s.session.clubId && t.status === 'ISSUED');
        check(t, 'TICKET_REQUIRED', 'Purchase a ticket first.');
        history(s, t, 'CHECKED_IN');
        t.checkedAt = iso(s);
        t.station = 'DOOR-01';
      } else if (name === 'invalid-qr')
        return { message: 'Enter INVALID-CODE in either scanner mode to verify rejection.' };
      else if (name === 'unauthorized-approval') {
        s.session.userId = 'volunteer';
        return {
          message: 'Volunteer role selected. Approval routes and services must deny access.',
        };
      } else if (name === 'cancelled-order') {
        const v = s.variants.find((v) => v.clubId === s.session.clubId);
        const o = {
          id: id(s, 'ORD'),
          clubId: s.session.clubId,
          userId: s.session.userId,
          status: 'CANCELLED',
          amount: v.memberPrice,
          items: [{ variantId: v.id, quantity: 1, price: v.memberPrice }],
          createdAt: iso(s),
          history: [
            { status: 'PENDING', at: iso(s) },
            { status: 'CANCELLED', at: iso(s) },
          ],
        };
        s.orders.push(o);
      } else if (['refunded-order', 'damaged-return'].includes(name)) {
        const order = s.orders.find(
          (o) => o.clubId === s.session.clubId && o.status === 'FULFILLED',
        );
        check(order, 'ORDER_REQUIRED', 'Reset the demo or fulfill another order first.');
        order.returnRequested = true;
        order.condition = name === 'damaged-return' ? 'DAMAGED' : 'SELLABLE';
        if (order.condition === 'SELLABLE')
          order.items.forEach((i) => (scoped(s, 'variants', i.variantId).stock += i.quantity));
        else {
          const cost = order.items.reduce(
            (a, i) => a + scoped(s, 'variants', i.variantId).cost * i.quantity,
            0,
          );
          post(
            s,
            'Demo damaged return inventory write-off',
            cost,
            '5030',
            '3010',
            'INVENTORY_LOSS',
            order.id,
          );
        }
        post(
          s,
          'Demo returned merchandise refund',
          order.amount,
          '4030',
          '1010',
          'ORDER',
          order.id,
        );
        paymentRecord(s, 'ORDER', order.id, order.amount, 'REFUNDED');
        history(s, order, 'REFUNDED');
        order.refundStatus = 'REFUNDED';
      } else if (name === 'late-payment')
        return {
          message:
            'Reserve a ticket or order, then choose Simulate delayed confirmation in checkout.',
        };
      else check(false, 'INVALID_SCENARIO', 'Unknown demo scenario.');
      return { message: 'Scenario applied to the shared demo records.' };
    }),
};
