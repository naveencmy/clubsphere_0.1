import { createSeed } from '../data/seed.js';
// Reproducible browser audit fixtures; never embedded in page components or tests.
export function createBrowserAuditSeed(role = 'visitor') {
  const s = createSeed();
  s.session.userId = role;
  s.orders.push({
    id: 'ORD-AUDIT',
    clubId: 'nec-cse',
    userId: 'member',
    status: 'PENDING',
    amount: 79900,
    createdAt: new Date(s.clock).toISOString(),
    reservedUntil: new Date(s.clock + 600000).toISOString(),
    pickup: 'Student Union',
    items: [{ variantId: 'hoodie-M', quantity: 1, price: 79900 }],
    history: [{ status: 'PENDING', at: new Date(s.clock).toISOString() }],
  });
  return s;
}
