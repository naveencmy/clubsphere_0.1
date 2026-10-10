/**
 * ClubSphere Real Gateway API Bridge
 * Connects the React UI directly to the Express + PostgreSQL Backend Gateway on /api
 */

import { store } from '../mock/mockStore.js';

const API_BASE = '/api';

export async function syncFromBackend(clubSlug = 'nec-cse', token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'x-club-slug': clubSlug,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 1. Fetch club info
    const clubRes = await fetch(`${API_BASE}/clubs/slug/${clubSlug}`, { headers }).catch(() => null);
    const clubData = clubRes && clubRes.ok ? (await clubRes.json()).data : null;

    // 2. Fetch events
    const eventsRes = await fetch(`${API_BASE}/events`, { headers }).catch(() => null);
    const eventsData = eventsRes && eventsRes.ok ? (await eventsRes.json()).data : null;

    // 3. Fetch merchandise catalog
    const catalogRes = await fetch(`${API_BASE}/store/catalog`, { headers }).catch(() => null);
    const catalogData = catalogRes && catalogRes.ok ? (await catalogRes.json()).data : null;

    // 4. Update the reactive in-memory state with real backend records
    const s = store.get();
    let updated = false;

    if (clubData && s.clubs) {
      const idx = s.clubs.findIndex(c => c.slug === clubSlug || c.id === clubData.id);
      if (idx !== -1) {
        s.clubs[idx].name = clubData.name;
        s.clubs[idx].description = clubData.description;
      }
      updated = true;
    }

    if (eventsData && Array.isArray(eventsData) && eventsData.length > 0) {
      // Map backend events into frontend event model
      const mapped = eventsData.map(ev => ({
        id: ev.slug || ev.id,
        backendId: ev.id,
        clubId: ev.club_id || s.session.clubId,
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        venue: ev.venue_name || ev.venueAddress || 'Campus Auditorium',
        published: ev.is_published ?? true,
        startsAt: ev.starts_at,
        endsAt: ev.ends_at,
        salesOpen: ev.starts_at ? new Date(new Date(ev.starts_at).getTime() - 14 * 86400000).toISOString() : '2025-10-01T00:00:00Z',
        salesClose: ev.ends_at || '2026-12-31T23:59:59Z',
        capacity: ev.capacity_limit || 300,
        tags: ev.tags || ['symposium', 'technical', 'nec-cse'],
        tiers: ev.tiers ? ev.tiers.map(t => ({
          id: t.id,
          eventId: ev.slug || ev.id,
          name: t.name,
          title: t.name,
          memberPrice: t.member_price_cents ?? t.memberPriceCents ?? 0,
          publicPrice: t.non_member_price_cents ?? t.nonMemberPriceCents ?? 0,
          capacity: t.allocation_limit ?? 100,
        })) : [],
      }));

      // Merge backend events into s.events
      for (const bEv of mapped) {
        const existIdx = s.events.findIndex(e => e.id === bEv.id || e.slug === bEv.slug);
        if (existIdx !== -1) {
          s.events[existIdx] = { ...s.events[existIdx], ...bEv };
        } else {
          s.events.unshift(bEv);
        }
      }
      updated = true;
    }

    if (catalogData?.products && Array.isArray(catalogData.products)) {
      for (const prod of catalogData.products) {
        const existIdx = s.products.findIndex(p => p.id === prod.slug || p.id === prod.id || p.title === prod.title);
        const mappedProduct = {
          id: prod.slug || prod.id,
          backendId: prod.id,
          clubId: s.session.clubId,
          title: prod.title,
          description: prod.description,
          memberPrice: prod.variants?.[0]?.memberPriceCents ?? 75000,
          publicPrice: prod.variants?.[0]?.nonMemberPriceCents ?? 85000,
          active: true,
          variants: (prod.variants || []).map(v => ({
            id: v.sku || v.id,
            sku: v.sku,
            label: v.title || v.attributes?.size || 'Standard',
            title: v.title || v.attributes?.size || 'Standard',
            stock: v.availableStock ?? 50,
          })),
        };

        if (existIdx !== -1) {
          s.products[existIdx] = { ...s.products[existIdx], ...mappedProduct };
        } else {
          s.products.unshift(mappedProduct);
        }
      }
      updated = true;
    }

    if (updated) {
      store.commit(s);
    }
    return { success: true };
  } catch (err) {
    console.warn('Real API sync fallback notice:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Creates a real Razorpay checkout order via backend gateway
 */
export async function createGatewayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const res = await fetch(`${API_BASE}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to create payment order');
  return data.data;
}

/**
 * Verifies Razorpay checkout signature via backend gateway
 */
export async function verifyGatewayPayment(paymentPayload) {
  const res = await fetch(`${API_BASE}/payment/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentPayload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Payment signature verification failed');
  return data.data;
}

/**
 * Records manual offline payment (University Cash Voucher, Bank Transfer NEFT, Direct UPI)
 */
export async function recordManualGatewayPayment(paymentData) {
  const res = await fetch(`${API_BASE}/payment/record-manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to record manual payment');
  return data.data;
}

/**
 * Validates door QR check-in via backend gateway
 */
export async function checkInGatewayDoor({ eventId, rawQrString, ticketCode, station = 'DOOR-01', token = null }) {
  const headers = {
    'Content-Type': 'application/json',
    'x-club-slug': 'nec-cse',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/events/${eventId}/check-in`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ rawQrString, ticketCode, station }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Door check-in rejected');
  return data.data;
}

/**
 * Retrieves payment gateway operational configuration and health status.
 */
export async function getGatewayConfig() {
  try {
    const res = await fetch(`${API_BASE}/payment/config`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Failed to fetch gateway config:', err.message);
    return null;
  }
}

/**
 * Confirms ticket status and posts double-entry transaction in PostgreSQL backend.
 */
export async function confirmGatewayTicketPayment(ticketId, paymentDetails = {}) {
  try {
    const res = await fetch(`${API_BASE}/events/tickets/${ticketId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-club-slug': 'nec-cse',
      },
      body: JSON.stringify(paymentDetails),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Backend ticket confirmation note:', err.message);
    return null;
  }
}
