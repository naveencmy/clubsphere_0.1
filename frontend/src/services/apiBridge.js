/**
 * ClubSphere Real Gateway API Bridge
 * Connects the React UI directly to the Express + PostgreSQL Backend Gateway on /api
 */

import { store } from './store.js';

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
    const clubRes = await fetch(`${API_BASE}/clubs/slug/${clubSlug}`, { headers, credentials: 'include' }).catch(() => null);
    const clubData = clubRes && clubRes.ok ? (await clubRes.json()).data : null;

    // 1b. Fetch all clubs from backend
    const allClubsRes = await fetch(`${API_BASE}/clubs`, { headers, credentials: 'include' }).catch(() => null);
    const allClubsData = allClubsRes && allClubsRes.ok ? (await allClubsRes.json()).data : null;

    // 1c. Fetch club members & officers from backend
    const membersRes = await fetch(`${API_BASE}/clubs/slug/${clubSlug}/members`, { headers, credentials: 'include' }).catch(() => null);
    const membersData = membersRes && membersRes.ok ? (await membersRes.json()).data : null;

    // 2. Fetch events
    const eventsRes = await fetch(`${API_BASE}/events`, { headers, credentials: 'include' }).catch(() => null);
    const eventsData = eventsRes && eventsRes.ok ? (await eventsRes.json()).data : null;

    // 3. Fetch merchandise catalog
    const catalogRes = await fetch(`${API_BASE}/store/catalog`, { headers, credentials: 'include' }).catch(() => null);
    const catalogData = catalogRes && catalogRes.ok ? (await catalogRes.json()).data : null;

    // 4. Fetch announcements, tasks, fundraisers, budgets, and expenses from backend
    const [announcementsRes, tasksRes, fundraisersRes, budgetsRes, expensesRes] = await Promise.all([
      fetch(`${API_BASE}/collaboration/announcements`, { headers, credentials: 'include' }).catch(() => null),
      fetch(`${API_BASE}/collaboration/tasks`, { headers, credentials: 'include' }).catch(() => null),
      fetch(`${API_BASE}/collaboration/fundraisers`, { headers, credentials: 'include' }).catch(() => null),
      fetch(`${API_BASE}/ledger/budgets`, { headers, credentials: 'include' }).catch(() => null),
      fetch(`${API_BASE}/ledger/expenses`, { headers, credentials: 'include' }).catch(() => null),
    ]);

    const announcementsData = announcementsRes && announcementsRes.ok ? (await announcementsRes.json()).data : null;
    const tasksData = tasksRes && tasksRes.ok ? (await tasksRes.json()).data : null;
    const fundraisersData = fundraisersRes && fundraisersRes.ok ? (await fundraisersRes.json()).data : null;
    const budgetsData = budgetsRes && budgetsRes.ok ? (await budgetsRes.json()).data : null;
    const expensesData = expensesRes && expensesRes.ok ? (await expensesRes.json()).data : null;

    // 5. Update the reactive in-memory state with real backend records
    const s = store.get();
    let updated = false;

    if (allClubsData && Array.isArray(allClubsData) && allClubsData.length > 0) {
      s.clubs = allClubsData.map((c) => ({
        id: c.slug || c.id,
        backendId: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        initials: c.initials,
        category: c.category,
        fiscalYear: '2026–2027',
        location: c.location,
        logoUrl: c.logo_url,
        bannerUrl: c.banner_url,
        primaryColor: c.primary_color,
        annualDuesCents: c.annual_dues_cents,
      }));
      updated = true;
    } else if (clubData && s.clubs) {
      const idx = s.clubs.findIndex((c) => c.slug === clubSlug || c.id === clubData.id);
      if (idx !== -1) {
        s.clubs[idx].name = clubData.name;
        s.clubs[idx].description = clubData.description;
        s.clubs[idx].initials = clubData.initials;
        s.clubs[idx].category = clubData.category;
        s.clubs[idx].location = clubData.location;
        s.clubs[idx].logoUrl = clubData.logo_url;
        s.clubs[idx].bannerUrl = clubData.banner_url;
        s.clubs[idx].primaryColor = clubData.primary_color;
        s.clubs[idx].annualDuesCents = clubData.annual_dues_cents;
      }
      updated = true;
    }

    if (eventsData && Array.isArray(eventsData) && eventsData.length > 0) {
      const existingMap = new Map((s.events || []).map((e) => [e.id, e]));
      const mapped = eventsData.map((ev) => {
        const evSlug = ev.slug || ev.id;
        const existing = existingMap.get(evSlug) || existingMap.get(ev.id);
        const rawTiers = Array.isArray(ev.tiers) ? ev.tiers : [];
        const evTiers = rawTiers.length > 0
          ? rawTiers.map((t) => ({
            id: t.id,
            eventId: evSlug,
            backendEventId: ev.id,
            name: t.name,
            title: t.name,
            description: t.description,
            memberPrice: t.member_price_cents ?? t.memberPriceCents ?? 0,
            publicPrice: t.non_member_price_cents ?? t.nonMemberPriceCents ?? 0,
            capacity: t.allocation_limit ?? ev.capacity_limit ?? 350,
          }))
          : [
            {
              id: `tier_${evSlug}_std`,
              eventId: evSlug,
              backendEventId: ev.id,
              name: 'Standard Registration Delegate Pass',
              title: 'Standard Registration Delegate Pass',
              description: 'Full day access, participant kit, and certificate of participation',
              memberPrice: 0,
              publicPrice: 0,
              capacity: ev.capacity_limit ?? 350,
            },
          ];

        return {
          id: evSlug,
          backendId: ev.id,
          clubId: 'nec-cse',
          clubBackendId: ev.club_id,
          title: existing?.title || ev.title,
          slug: evSlug,
          description: existing?.description || ev.description,
          venue: existing?.venue || ev.venue_name || ev.venue_address || 'CC2 (Block-3) & Placement Auditorium',
          published: existing?.published ?? (ev.is_published ?? true),
          startsAt: existing?.startsAt || ev.starts_at,
          endsAt: existing?.endsAt || ev.ends_at,
          imageUrl: existing?.imageUrl || ev.image_url || '/images/events/aura-25.png',
          category: existing?.category || ev.category || 'Technical Event',
          salesOpen: existing?.salesOpen || ev.sales_open_at || '2025-01-01T00:00:00.000Z',
          salesClose: existing?.salesClose || ev.sales_close_at || ev.ends_at || '2026-12-31T23:59:59.000Z',
          capacity: existing?.capacity || ev.capacity_limit || 350,
          tags: existing?.tags || ev.tags || ['Symposium', 'Coding', 'Gaming'],
          tiers: evTiers,
        };
      });

      const mappedIds = new Set(mapped.map((m) => m.id));
      const localOnly = (s.events || []).filter((e) => !mappedIds.has(e.id) && !mappedIds.has(e.slug));
      s.events = [...mapped, ...localOnly];
      const allTiers = mapped.flatMap((m) => m.tiers);
      if (allTiers.length > 0) {
        s.tiers = allTiers;
        for (const t of allTiers) {
          if (!s.availability) s.availability = {};
          if (s.availability[t.id] == null) {
            s.availability[t.id] = t.capacity || 100;
          }
        }
      }
      updated = true;
    }

    if (catalogData?.products && Array.isArray(catalogData.products)) {
      const mappedProducts = [];
      const mappedVariants = [];
      for (const prod of catalogData.products) {
        const productImg = prod.imageUrls?.[0] || prod.image_urls?.[0];
        const productAllImgs = prod.imageUrls || prod.image_urls || [];
        const mappedProduct = {
          id: prod.slug,
          backendId: prod.id,
          clubId: s.session.clubId,
          title: prod.title,
          description: prod.description,
          image: productImg,
          images: productAllImgs,
          visual: prod.visual,
          category: prod.category,
          memberPrice: prod.variants?.[0]?.memberPriceCents,
          publicPrice: prod.variants?.[0]?.nonMemberPriceCents,
          active: true,
          variants: (prod.variants || []).map((v) => ({
            id: v.sku || v.id,
            productId: prod.slug,
            sku: v.sku,
            size: v.attributes?.size,
            color: v.attributes?.color,
            label: v.title,
            title: v.title,
            stock: v.availableStock,
            availableStock: v.availableStock,
            memberPrice: v.memberPriceCents,
            publicPrice: v.nonMemberPriceCents,
          })),
        };
        mappedProducts.push(mappedProduct);
        mappedVariants.push(...mappedProduct.variants);
      }
      s.products = mappedProducts;
      if (mappedVariants.length > 0) {
        s.variants = mappedVariants;
        if (!s.stock) s.stock = {};
        for (const v of mappedVariants) {
          s.stock[v.id] = v.stock;
        }
      }
      updated = true;
    }

    if (membersData && Array.isArray(membersData) && membersData.length > 0) {
      s.users = membersData.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        systemRole: m.system_role,
        role: m.club_role,
        clubRole: m.club_role,
        tier: m.tier,
        studentId: m.student_id,
        phone: m.phone_number,
        department: m.academic_major,
        graduationYear: m.graduation_year,
      }));
      s.memberships = membersData.map((m) => ({
        id: `mem-${m.id}`,
        userId: m.id,
        clubId: 'nec-cse',
        role: m.club_role,
        tier: m.tier,
        status: m.membership_status,
      }));
      updated = true;
    }

    if (announcementsData && Array.isArray(announcementsData) && announcementsData.length > 0) {
      s.announcements = announcementsData.map((a) => ({
        id: a.id,
        clubId: 'nec-cse',
        clubBackendId: a.club_id,
        authorId: a.author_id,
        authorName: a.author_name,
        author: a.author_name,
        authorRole: a.author_role,
        title: a.title,
        content: a.content_markdown || a.content,
        pinned: a.is_pinned,
        status: 'PUBLISHED',
        audience: a.target_audience || 'PUBLIC',
        publishedAt: a.published_at || a.created_at,
        updatedAt: a.updated_at,
        targetAudience: a.target_audience || 'PUBLIC',
        auditHash: a.audit_hash,
      }));

      // Ensure every announcement author is also in s.users
      if (!s.users) s.users = [];
      announcementsData.forEach((a) => {
        if (a.author_id && !s.users.some((u) => u.id === a.author_id)) {
          s.users.push({
            id: a.author_id,
            name: a.author_name,
            email: a.author_email || '',
            role: 'COMMITTEE_LEAD',
          });
        }
      });

      // Synchronize baseline database revisions into s.revisions
      if (!s.revisions) s.revisions = [];
      const existingRevIds = new Set(s.revisions.map((r) => r.id));
      for (const a of announcementsData) {
        const revId = `rev-1-${a.id}`;
        if (!existingRevIds.has(revId)) {
          s.revisions.push({
            id: revId,
            clubId: 'nec-cse',
            announcementId: a.id,
            number: 1,
            title: a.title,
            content: a.content_markdown || a.content,
            at: a.published_at || a.created_at,
            authorId: a.author_id,
            authorName: a.author_name,
            hash: a.audit_hash || '84d7ae4affc2b859eb93824473b76b163ce6f57564d2b0aa07d189473ab22d1d',
          });
        }
      }
      updated = true;
    }

    if (tasksData && Array.isArray(tasksData) && tasksData.length > 0) {
      s.tasks = tasksData.map((t) => ({
        id: t.id,
        clubId: 'nec-cse',
        clubBackendId: t.club_id,
        title: t.title,
        description: t.description_markdown || t.description,
        status: t.status,
        priority: t.priority,
        assignee: t.assigned_to_user_id,
        assigneeId: t.assigned_to_user_id,
        eventId: t.event_id,
        fundraiserId: t.fundraiser_id,
        dueAt: t.due_date,
      }));
      updated = true;
    }

    if (fundraisersData && Array.isArray(fundraisersData) && fundraisersData.length > 0) {
      s.fundraisers = fundraisersData.map((f) => ({
        id: f.id,
        clubId: 'nec-cse',
        clubBackendId: f.club_id,
        title: f.title,
        description: f.description,
        targetAmount: f.target_amount_cents || f.targetAmountCents,
        raisedAmount: f.raised_amount_cents || f.raisedAmountCents || 0,
        active: f.is_active,
      }));
      updated = true;
    }

    if (budgetsData && Array.isArray(budgetsData) && budgetsData.length > 0) {
      s.budgets = budgetsData.map((b) => ({
        id: b.id || b.budget_id,
        clubId: 'nec-cse',
        clubBackendId: b.club_id,
        eventId: b.event_id,
        fiscalYear: b.fiscal_year,
        category: b.category,
        title: b.event_title || b.notes,
        amount: b.allocated_amount_cents,
        allocated: b.allocated_amount_cents,
        spent: b.actual_spent_cents ? Number(b.actual_spent_cents) : 0,
        notes: b.notes,
        items: b.items_json,
      }));
      s.budgetCatalog = s.budgets;
      updated = true;
    }

    if (expensesData && Array.isArray(expensesData) && expensesData.length > 0) {
      s.expenses = expensesData.map((e) => {
        const history = [];
        if (e.created_at) {
          history.push({
            action: 'SUBMITTED',
            status: 'SUBMITTED',
            at: e.created_at,
            actorId: e.claimant_user_id,
          });
        }
        if (['UNDER_REVIEW', 'TREASURER_APPROVED', 'INCHARGE_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED'].includes(e.status)) {
          history.push({
            action: 'UNDER_REVIEW',
            status: 'UNDER_REVIEW',
            at: e.created_at,
          });
        }
        if (e.treasurer_approved_at || ['TREASURER_APPROVED', 'INCHARGE_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED'].includes(e.status)) {
          history.push({
            action: 'TREASURER_APPROVED',
            status: 'TREASURER_APPROVED',
            at: e.treasurer_approved_at || e.updated_at || e.created_at,
            actorId: e.treasurer_approver_id,
          });
        }
        if (e.president_approved_at || ['INCHARGE_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED'].includes(e.status)) {
          history.push({
            action: 'INCHARGE_APPROVED',
            status: 'INCHARGE_APPROVED',
            at: e.president_approved_at || e.updated_at || e.created_at,
            actorId: e.president_approver_id,
          });
        }
        if (e.disbursed_at || e.status === 'DISBURSED') {
          history.push({
            action: 'DISBURSED',
            status: 'DISBURSED',
            at: e.disbursed_at || e.updated_at || e.created_at,
          });
        }
        if (e.status === 'NEEDS_CORRECTION') {
          history.push({
            action: 'NEEDS_CORRECTION',
            status: 'NEEDS_CORRECTION',
            at: e.updated_at || e.created_at,
            reason: e.reviewer_notes || e.rejection_reason,
          });
        }
        if (e.status === 'REJECTED') {
          history.push({
            action: 'REJECTED',
            status: 'REJECTED',
            at: e.updated_at || e.created_at,
            reason: e.rejection_reason,
          });
        }

        return {
          id: e.id,
          clubId: 'nec-cse',
          clubBackendId: e.club_id,
          budgetId: e.budget_id,
          eventId: e.event_id,
          fundraiserId: e.fundraiser_id,
          userId: e.claimant_user_id,
          claimantUserId: e.claimant_user_id,
          claimantName: e.claimant_name,
          title: e.title,
          description: e.description,
          purpose: e.description || e.title,
          category: e.category,
          merchant: e.merchant_name,
          merchantName: e.merchant_name,
          amount: e.amount_cents,
          amountCents: e.amount_cents,
          receipt: e.receipt_image_url,
          receiptUrl: e.receipt_image_url,
          status: e.status,
          disbursementMethod: e.disbursement_method,
          purchaseDate: e.purchase_date || e.created_at,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
          history,
        };
      });
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

/**
 * Fetches verified cryptographic revision history for an announcement
 */
export async function getAnnouncementHistory(announcementId) {
  try {
    const res = await fetch(`${API_BASE}/collaboration/announcements/${announcementId}/history`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Failed to fetch announcement history:', err.message);
    return null;
  }
}

