/**
 * ClubSphere Central Store
 * Holds reactive client state synchronized directly from the PostgreSQL backend
 */

export const DEFAULT_CLUB = {
  id: 'nec-cse',
  backendId: 'c0000000-0000-0000-0000-000000000001',
  slug: 'nec-cse',
  name: 'Computer Science Association (Team MATRIX)',
  description: 'Department of Computer Science and Engineering Collegiate Association',
  initials: 'CSE',
  category: 'Department Association',
  fiscalYear: '2026–2027',
  location: 'CS Block, NEC Campus',
  logoUrl: '/images/clubsphere-logo.png',
  bannerUrl: '/images/banner.jpg',
  primaryColor: '#1a73e8',
  annualDuesCents: 50000,
};

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
    clubs: [DEFAULT_CLUB],
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
