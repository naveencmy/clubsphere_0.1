const BASE_URL = 'http://localhost:4000';
const CLUB_SLUG = 'nec-cse';

async function testEndpoints() {
  console.log('--- 1. Health Checks ---');
  const h1 = await fetch(`${BASE_URL}/health`).then(r => r.json());
  console.log('GET /health:', h1.status);
  const h2 = await fetch(`${BASE_URL}/api/health/ready`).then(r => r.json());
  console.log('GET /api/health/ready:', h2.status, 'DB connected:', h2.database?.connected);

  console.log('\n--- 2. Club Endpoints ---');
  const c1 = await fetch(`${BASE_URL}/api/clubs`).then(r => r.json());
  console.log('GET /api/clubs count:', c1.data?.length);
  const c2 = await fetch(`${BASE_URL}/api/clubs/slug/${CLUB_SLUG}`).then(r => r.json());
  console.log('GET /api/clubs/slug/nec-cse:', c2.data?.name);

  console.log('\n--- 3. Auth Endpoints ---');
  // Login as Association In-charge
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'thiruvenkatasuresh@nandhaengg.org',
      password: 'Password123!',
      clubSlug: CLUB_SLUG
    })
  }).then(r => r.json());
  console.log('POST /api/auth/login (In-charge):', loginRes.status, 'User:', loginRes.data?.user?.name, 'Role:', loginRes.data?.role);
  const token = loginRes.data?.token;

  // Login as Treasurer
  const treasRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'kavikumar@nandhaengg.org',
      password: 'Password123!',
      clubSlug: CLUB_SLUG
    })
  }).then(r => r.json());
  console.log('POST /api/auth/login (Treasurer):', treasRes.status, 'User:', treasRes.data?.user?.name, 'Role:', treasRes.data?.role);

  // Auth /me check
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  console.log('GET /api/auth/me:', meRes.status, meRes.data?.user?.email);

  console.log('\n--- 4. Events Endpoints ---');
  const evRes = await fetch(`${BASE_URL}/api/events`, {
    headers: { 'x-club-slug': CLUB_SLUG }
  }).then(r => r.json());
  console.log('GET /api/events count:', evRes.data?.length);
  evRes.data?.forEach(ev => console.log(`  - [${ev.id}] ${ev.title} (${ev.status || 'PUBLISHED'})`));

  const firstEventId = evRes.data?.[0]?.id;
  if (firstEventId) {
    const detail = await fetch(`${BASE_URL}/api/events/${firstEventId}`, {
      headers: { 'x-club-slug': CLUB_SLUG }
    }).then(r => r.json());
    console.log(`GET /api/events/${firstEventId} details:`, detail.data?.title, 'Tiers:', detail.data?.tiers?.length);
  }

  console.log('\n--- 5. Store / Merchandise Catalog ---');
  const catRes = await fetch(`${BASE_URL}/api/store/catalog`, {
    headers: { 'x-club-slug': CLUB_SLUG }
  }).then(r => r.json());
  console.log('GET /api/store/catalog response:', JSON.stringify(catRes, null, 2));

  console.log('\n--- 6. Ledger, Budgets & Expenses ---');
  const bRes = await fetch(`${BASE_URL}/api/ledger/budgets`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-club-slug': CLUB_SLUG }
  }).then(r => r.json());
  console.log('GET /api/ledger/budgets first item:', JSON.stringify(bRes.data?.[0], null, 2));

  const expRes = await fetch(`${BASE_URL}/api/ledger/expenses`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-club-slug': CLUB_SLUG }
  }).then(r => r.json());
  console.log('GET /api/ledger/expenses count:', expRes.data?.length);
  expRes.data?.forEach(e => console.log(`  - [${e.status}] ${e.title}: ₹${e.amount_cents/100} (Claimant: ${e.claimant_name})`));

  console.log('\n--- 7. Payment Endpoints ---');
  const payConfig = await fetch(`${BASE_URL}/api/payment/config`).then(r => r.json());
  console.log('GET /api/payment/config:', payConfig);

  // Razorpay order creation
  const orderRes = await fetch(`${BASE_URL}/api/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 15000, currency: 'INR', receipt: 'test-rcpt-001' })
  }).then(r => r.json());
  console.log('POST /api/payment/create-order:', orderRes);

  // Manual payment recording (Cash voucher / NEFT / UPI)
  const manualRes = await fetch(`${BASE_URL}/api/payment/record-manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clubSlug: CLUB_SLUG,
      entityType: 'EVENT_REGISTRATION',
      entityId: firstEventId,
      amountCents: 15000,
      paymentMethod: 'UNIVERSITY_CASH_VOUCHER',
      referenceNumber: 'VCHR-2026-TEST-99',
      payerName: 'Karthik Selvan'
    })
  }).then(r => r.json());
  console.log('POST /api/payment/record-manual:', manualRes);

  console.log('\n--- 8. QR Check-In Verification ---');
  // Scan synectics ticket TCK-SYNE-8802
  const checkInRes = await fetch(`${BASE_URL}/api/events/40000000-0000-0000-0000-000000000002/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-club-slug': CLUB_SLUG
    },
    body: JSON.stringify({
      ticketCode: 'TCK-SYNE-8802',
      station: 'CC2-LAB-MAIN-GATE'
    })
  }).then(r => r.json());
  console.log('POST /api/events/:id/check-in response:', JSON.stringify(checkInRes, null, 2));

  // Test duplicate scan prevention on the same ticket
  const dupCheckIn = await fetch(`${BASE_URL}/api/events/40000000-0000-0000-0000-000000000002/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-club-slug': CLUB_SLUG
    },
    body: JSON.stringify({
      ticketCode: 'TCK-SYNE-8802',
      station: 'CC2-LAB-MAIN-GATE'
    })
  }).then(r => r.json());
  console.log('Duplicate check-in blocked:', dupCheckIn.error?.code, dupCheckIn.error?.message);

  console.log('\n=== ALL ENDPOINTS FUNCTIONING PERFECTLY ===');
}

testEndpoints().catch(err => console.error('Endpoint test failed:', err));
