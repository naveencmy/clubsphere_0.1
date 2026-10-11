/**
 * ClubSphere Central Store
 * Holds reactive client state synchronized directly from the PostgreSQL backend
 */

export function createInitialState() {
  return {
    version: 9,
    clock: Date.now(),
    sequence: 100,
    session: {
      userId: 'visitor',
      clubId: 'nec-cse',
    },
    users: [],
    clubs: [],
    memberships: [],
    plans: [
      {
        id: 'nec-cse-standard',
        clubId: 'nec-cse',
        title: 'Standard CSE Membership',
        tier: 'STANDARD',
        amount: 50000,
        benefits: [
          'Member ticket prices for all CSE events',
          'Merchandise drops discount',
          'Technical workshops & hackathon entry',
          'Digital QR membership pass',
        ],
      },
      {
        id: 'nec-cse-premium',
        clubId: 'nec-cse',
        title: 'Premium Delegate & Innovator Plan',
        tier: 'PREMIUM',
        amount: 75000,
        benefits: [
          'All Standard Membership benefits',
          'Priority hackathon team registration & fast-track mentorship',
          'Official Team MATRIX symposium lanyard pass',
          'Executive committee volunteer eligibility',
        ],
      },
    ],
    events: [],
    tiers: [],
    tickets: [],
    products: [],
    variants: [],
    orders: [],
    fundraisers: [],
    tasks: [],
    shifts: [],
    announcements: [],
    revisions: [],
    deliveries: [],
    expenses: [],
    budgets: [],
    journal: [],
    readReceipts: [],
    payments: [],
    waitlist: [],
    audit: [],
    officerHistory: [],
    notifications: [],
    failure: null,
  };
}

const KEY = 'clubsphere-nec-cse-v9';
let state;
const listeners = new Set();

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const saved = raw && JSON.parse(raw);
    return saved?.version === 9 ? saved : createInitialState();
  } catch {
    return createInitialState();
  }
}

state = load();

export const store = {
  get: () => state,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  commit(next) {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(next));
    state = next;
    listeners.forEach((fn) => fn());
  },
  reset() {
    this.commit(createInitialState());
  },
  key: KEY,
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((fn) => fn());
    }
  });
}
