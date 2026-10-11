import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { generateQrSignature, sha256 } from '../utils/crypto.js';
import { config } from './env.js';

export async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding for Nandha Engineering College CSE Association...');

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const CLUB_ID = 'c0000000-0000-0000-0000-000000000001';

  // 1. Seed or Update Primary Club
  await query('ALTER TABLE clubs ADD COLUMN IF NOT EXISTS initials TEXT DEFAULT \'TM\';');
  await query('ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT \'Department Association\';');
  await query('ALTER TABLE clubs ADD COLUMN IF NOT EXISTS location TEXT DEFAULT \'Department of CSE, Block 3, CC2 Lab & Placement Auditorium\';');

  await query(`
    INSERT INTO clubs (id, slug, name, description, logo_url, banner_url, primary_color, annual_dues_cents, settings_json, initials, category, location, is_active)
    VALUES (
      $1,
      'nec-cse',
      'Department of Computer Science and Engineering - CSE Association (Team MATRIX)',
      'Official Association of Computer Science & Engineering, Nandha Engineering College (Autonomous), Erode - 638 052. Empowering student innovators with technical symposia, hackathons, and industry workshops.',
      '/images/clubsphere-logo.png',
      '/images/events/aura-25.png',
      '#0ea5e9',
      50000,
      '{"department":"Computer Science and Engineering","college":"Nandha Engineering College (Autonomous)","city":"Erode","pincode":"638052","accreditation":"NAAC A+ Grade / Autonomous / Anna University"}'::jsonb,
      'TM',
      'Department Association',
      'Department of CSE, Block 3, CC2 Lab & Placement Auditorium',
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      logo_url = EXCLUDED.logo_url,
      banner_url = EXCLUDED.banner_url,
      primary_color = EXCLUDED.primary_color,
      annual_dues_cents = EXCLUDED.annual_dues_cents,
      settings_json = EXCLUDED.settings_json,
      initials = EXCLUDED.initials,
      category = EXCLUDED.category,
      location = EXCLUDED.location,
      is_active = TRUE;
  `, [CLUB_ID]);

  console.log(' Club seeded: Nandha Engineering College CSE Association (Team MATRIX)');

  // 2. Tamil Faculty and Student User Definitions (Valid Hex UUIDs and Enums)
  const users = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Dr. M. P. Thiruvenkatasuresh',
      email: 'thiruvenkatasuresh@nandhaengg.org',
      role: 'CAMPUS_AUDITOR',
      clubRole: 'ASSOCIATION_INCHARGE',
      tier: 'HONORARY',
      studentId: 'EMP-CSE-001',
      phone: '9842712345',
      major: 'Computer Science and Engineering',
      gradYear: 2026,
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Mr. K. U. Ranjith',
      email: 'ranjith.ku@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'ASSOCIATION_COORDINATOR',
      tier: 'PREMIUM',
      studentId: 'EMP-CSE-002',
      phone: '9789023456',
      major: 'Computer Science and Engineering',
      gradYear: 2026,
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      name: 'Ms. D. Vinoparkavi',
      email: 'vinoparkavi.d@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'TREASURER',
      tier: 'PREMIUM',
      studentId: 'EMP-CSE-003',
      phone: '9894034567',
      major: 'Computer Science and Engineering',
      gradYear: 2026,
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      name: 'Dr. T. Rajasekaran',
      email: 'rajasekaran.t@nandhaengg.org',
      role: 'SUPER_ADMIN',
      clubRole: 'SECRETARY',
      tier: 'HONORARY',
      studentId: 'EMP-CSE-HOD',
      phone: '9443345678',
      major: 'Computer Science and Engineering',
      gradYear: 2026,
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      name: 'N. Deepsika',
      email: 'deepsika.n@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'COMMITTEE_LEAD',
      tier: 'PREMIUM',
      studentId: '21CS042',
      phone: '9345803946',
      major: 'Computer Science and Engineering',
      gradYear: 2026,
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      name: 'R. Rupanarayanan',
      email: 'rupanarayanan.r@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'COMMITTEE_LEAD',
      tier: 'PREMIUM',
      studentId: '21CS088',
      phone: '6382552533',
      major: 'Computer Science and Engineering',
      gradYear: 2026,
    },
    {
      id: '10000000-0000-0000-0000-000000000007',
      name: 'M. Kavikumar',
      email: 'kavikumar.m@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'VOLUNTEER',
      tier: 'STANDARD',
      studentId: '22CS054',
      phone: '8248370733',
      major: 'Computer Science and Engineering',
      gradYear: 2027,
    },
    {
      id: '10000000-0000-0000-0000-000000000008',
      name: 'S. Balahariharan',
      email: 'balahariharan.s@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'VOLUNTEER',
      tier: 'STANDARD',
      studentId: '22CS023',
      phone: '9360859712',
      major: 'Computer Science and Engineering',
      gradYear: 2027,
    },
    {
      id: '10000000-0000-0000-0000-000000000009',
      name: 'M. Pradeesh',
      email: 'pradeesh.m@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'MEMBER',
      tier: 'STANDARD',
      studentId: '22CS077',
      phone: '9487770881',
      major: 'Computer Science and Engineering',
      gradYear: 2027,
    },
    {
      id: '10000000-0000-0000-0000-000000000010',
      name: 'K. Anbarasan',
      email: 'anbarasan.k@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'MEMBER',
      tier: 'STANDARD',
      studentId: '23CS012',
      phone: '9944156789',
      major: 'Computer Science and Engineering',
      gradYear: 2028,
    },
    {
      id: '10000000-0000-0000-0000-000000000011',
      name: 'S. Karthikeyan',
      email: 'karthikeyan.s@nandhaengg.org',
      role: 'STUDENT_USER',
      clubRole: 'MEMBER',
      tier: 'STANDARD',
      studentId: '23CS048',
      phone: '9629167890',
      major: 'Computer Science and Engineering',
      gradYear: 2028,
    },
  ];

  for (const u of users) {
    // Upsert User
    await query(`
      INSERT INTO users (id, name, email, email_verified, system_role)
      VALUES ($1, $2, $3, TRUE, $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        system_role = EXCLUDED.system_role;
    `, [u.id, u.name, u.email, u.role]);

    // Upsert User Profile
    await query(`
      INSERT INTO user_profiles (user_id, student_id_number, phone_number, academic_major, graduation_year)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        student_id_number = EXCLUDED.student_id_number,
        phone_number = EXCLUDED.phone_number,
        academic_major = EXCLUDED.academic_major,
        graduation_year = EXCLUDED.graduation_year;
    `, [u.id, u.studentId, u.phone, u.major, u.gradYear]);

    // Upsert Better Auth Credential Account
    await query(`
      INSERT INTO accounts (id, user_id, account_id, provider_id, password)
      VALUES ($1, $2, $3, 'credential', $4)
      ON CONFLICT (id) DO UPDATE SET
        password = EXCLUDED.password;
    `, [`acc-${u.id}`, u.id, u.id, passwordHash]);

    // Upsert Club Membership
    await query(`
      INSERT INTO club_memberships (club_id, user_id, role, tier, status, dues_paid_cents, valid_from, valid_until)
      VALUES ($1, $2, $3, $4, 'ACTIVE', 50000, '2025-06-01T00:00:00Z', '2026-06-30T23:59:59Z')
      ON CONFLICT (club_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        tier = EXCLUDED.tier,
        status = 'ACTIVE',
        dues_paid_cents = EXCLUDED.dues_paid_cents;
    `, [CLUB_ID, u.id, u.clubRole, u.tier]);
  }

  console.log(` Seeded ${users.length} Tamil faculty and student accounts with Better Auth credentials.`);

  // 3. Seed Ledger Accounts
  const ledgerAccounts = [
    { code: '1010', name: 'Cash Clearing / Direct UPI', type: 'ASSET' },
    { code: '1020', name: 'Nandha Engineering College Bank Account (NEFT/IMPS)', type: 'ASSET' },
    { code: '1030', name: 'Association Petty Cash & Vouchers', type: 'ASSET' },
    { code: '2010', name: 'Accounts Payable - Expense Reimbursements', type: 'LIABILITY' },
    { code: '3010', name: 'Association Retained Surplus', type: 'EQUITY' },
    { code: '4010', name: 'Student Membership Dues Revenue', type: 'REVENUE' },
    { code: '4020', name: 'Event & Symposium Registrations', type: 'REVENUE' },
    { code: '4030', name: 'Official Merchandise Sales (Team MATRIX)', type: 'REVENUE' },
    { code: '4040', name: 'Industry Grants & Sponsorships (ShellKode)', type: 'REVENUE' },
    { code: '5010', name: 'Symposium & Hackathon Operational Expenses', type: 'EXPENSE' },
    { code: '5020', name: 'Guest Hospitality & Keynote Honorarium', type: 'EXPENSE' },
    { code: '5030', name: 'Merchandise Manufacturing & Inventory Write-off', type: 'EXPENSE' },
  ];

  for (const acc of ledgerAccounts) {
    await query(`
      INSERT INTO ledger_accounts (club_id, account_code, account_name, type, balance_cents)
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT (club_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        type = EXCLUDED.type;
    `, [CLUB_ID, acc.code, acc.name, acc.type]);
  }
  console.log(` Seeded ${ledgerAccounts.length} Double-Entry Ledger Accounts.`);

  // 4. Seed Real Events from Posters
  const events = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      title: "AURA '25 - Inter-Department Event",
      slug: 'aura-25',
      description: 'Inter-Department Symposium featuring Brain Busters (Technical Quiz & Coding, Venue: CC2 Block-3 at 09:30 AM) and Fun Fusion (Non-Technical Gaming & Media, Placement Auditorium at 01:45 PM). Free registration. E-Certificates provided for all participants. Organized by Student Coordinators Mr. M. Kavikumar (82483 70733) & Mr. S. Balahariharan (93608 59712).',
      venueName: 'CC2 (Block-3) & Placement Auditorium',
      venueAddress: 'Nandha Engineering College (Autonomous), Erode - 638 052',
      startsAt: '2025-11-06T09:30:00.000Z',
      endsAt: '2025-11-06T16:30:00.000Z',
      capacityLimit: 350,
      imageUrl: '/images/events/aura-25.png',
      category: 'Technical Event',
      tags: ['technical', 'inter-department', 'nec-cse', 'aura25'],
      tiers: [
        {
          id: '50000000-0000-0000-0000-000000000001',
          name: 'Free Registration (Technical & Non-Technical)',
          description: 'Access to Brain Busters (CC2) and Fun Fusion (Placement Auditorium)',
          memberPriceCents: 0,
          nonMemberPriceCents: 0,
          allocationLimit: 350,
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      title: "SYNECTICS '26 - GenAI Spark (National Level Symposium)",
      slug: 'synectics-26',
      description: 'National Level Technical Symposium & Mini Hackathon-style contest in collaboration with ShellKode Private Limited. Theme: GenAI Spark (Applied GenAI, AI Automation & Intelligent Workflows, Multimodal AI, Enterprise AI for Decision Intelligence). Evaluation by experienced industry professionals with dedicated guidance and internship offers for outstanding teams. Cash Prizes: 1st Prize ₹5,000, 2nd Prize ₹3,000, 3rd Prize ₹2,000. Team size up to 3 members. Student Coordinators: Mr. R. Rupanarayanan (63825 52533), Mr. M. Pradeesh (94877 70881). Faculty Coordinators: Dr. M. P. Thiruvenkatasuresh, Ms. D. Vinoparkavi, Mr. K. U. Ranjith. Head of Dept: Dr. T. Rajasekaran.',
      venueName: 'Block 3, CC2 Laboratory',
      venueAddress: 'Nandha Engineering College (Autonomous), Erode - 638 052',
      startsAt: '2026-02-21T09:00:00.000Z',
      endsAt: '2026-02-21T17:00:00.000Z',
      capacityLimit: 300,
      imageUrl: '/images/events/synectics-26.jpg',
      category: 'National Level Symposium',
      tags: ['symposium', 'national', 'genai', 'nec-cse', 'synectics26'],
      tiers: [
        {
          id: '50000000-0000-0000-0000-000000000002',
          name: 'General Symposium Delegate Pass',
          description: 'Keynotes, paper presentation, and lunch refreshments included',
          memberPriceCents: 25000, // ₹250
          nonMemberPriceCents: 30000, // ₹300
          allocationLimit: 200,
        },
        {
          id: '50000000-0000-0000-0000-000000000003',
          name: 'ShellKode GenAI Spark Team Pass (Up to 3 Members)',
          description: 'Mini Hackathon participation, mentoring, and prize contention',
          memberPriceCents: 50000, // ₹500
          nonMemberPriceCents: 60000, // ₹600
          allocationLimit: 100,
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      title: '24H HACKATHON: CODE. BUILD. DOMINATE',
      slug: '24h-hackathon-2026',
      description: '24-Hour Non-stop Flagship Hackathon. Solve pressing problems using AI/ML, Blockchain, Cyber Security, IoT, 3D Printing, Embedded Systems & other relevant technologies. Domains: Smart Cities, Health Tech & Telemedicine, Agri Tech, Environment/Energy & Sustainable Development, Smart Automation, Financial Tech, Education Tech, Open Innovation. Round 1: Free Registration (Submit PPT before 30th March). Grand Finale: April 17 & 18, 2026. Round 2 Registration: ₹1,000 per team (Min 2 & Max 4 members). Exciting Cash Prizes! Student Secretary: N. Deepsika (93458 03946). Co-Convener: Mr. S. Muruganantham (Incharge - CiPD). Convener: Dr. M. Easwaramoorthi (Dean - Innovation & Incubation). Principal: Dr. U. S. Ragupathy.',
      venueName: 'IDEA Lab & Placement Auditorium',
      venueAddress: 'Nandha Engineering College (Autonomous), Erode - 638 052',
      startsAt: '2026-04-17T09:00:00.000Z',
      endsAt: '2026-04-18T12:00:00.000Z',
      capacityLimit: 250,
      imageUrl: '/images/events/hackathon-2026.jpg',
      category: 'Flagship Hackathon',
      tags: ['hackathon', 'flagship', '24h', 'ai-ml', 'nec-cse'],
      tiers: [
        {
          id: '50000000-0000-0000-0000-000000000004',
          name: 'Round 1 - PPT Submission (Free)',
          description: 'Free entry for problem domain PPT screening before March 30',
          memberPriceCents: 0,
          nonMemberPriceCents: 0,
          allocationLimit: 250,
        },
        {
          id: '50000000-0000-0000-0000-000000000005',
          name: 'Grand Finale Team Pass (Round 2 Finalists)',
          description: '24H Nonstop hackathon, high-speed Wi-Fi, midnight energy drinks, food, and trophy evaluation',
          memberPriceCents: 80000, // ₹800
          nonMemberPriceCents: 100000, // ₹1,000
          allocationLimit: 50,
        },
      ],
    },
  ];

  await query('ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;');
  await query('ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT;');
  await query('ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[];');

  for (const ev of events) {
    await query(`
      INSERT INTO events (id, club_id, title, slug, description, venue_name, venue_address, starts_at, ends_at, capacity_limit, image_url, category, tags, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        venue_name = EXCLUDED.venue_name,
        venue_address = EXCLUDED.venue_address,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        capacity_limit = EXCLUDED.capacity_limit,
        image_url = EXCLUDED.image_url,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        is_published = TRUE;
    `, [ev.id, CLUB_ID, ev.title, ev.slug, ev.description, ev.venueName, ev.venueAddress, ev.startsAt, ev.endsAt, ev.capacityLimit, ev.imageUrl || null, ev.category, ev.tags]);

    for (const tier of ev.tiers) {
      await query(`
        INSERT INTO event_ticket_tiers (id, event_id, name, description, member_price_cents, non_member_price_cents, allocation_limit, sales_open_at, sales_close_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          member_price_cents = EXCLUDED.member_price_cents,
          non_member_price_cents = EXCLUDED.non_member_price_cents,
          allocation_limit = EXCLUDED.allocation_limit,
          sales_open_at = EXCLUDED.sales_open_at,
          sales_close_at = EXCLUDED.sales_close_at;
      `, [tier.id, ev.id, tier.name, tier.description, tier.memberPriceCents, tier.nonMemberPriceCents, tier.allocationLimit, '2025-01-01T00:00:00Z', ev.endsAt]);
    }
  }
  console.log(` Seeded ${events.length} Real Nandha College events & tiers matching official posters.`);

  // 5. Seed Budgets
  await query('ALTER TABLE budgets ADD COLUMN IF NOT EXISTS items_json JSONB;');

  const budgets = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      eventId: '40000000-0000-0000-0000-000000000001',
      fiscalYear: '2025-2026',
      category: 'EVENTS',
      allocatedCents: 510000, // ₹5,100 (Official Aura '25 Approved Budget)
      notes: 'Nandha Engineering College (Autonomous), Department of Computer Science and Engineering - Aura’25 Approved Budget (Total ₹5,100). Signed by Student Treasurer, Association In-charge & HoD.',
      items: [
        { sno: 1, name: '1st Prize', quantity: 2, unitPrice: 1000, total: 2000 },
        { sno: 2, name: '2nd Prize', quantity: 2, unitPrice: 750, total: 1500 },
        { sno: 3, name: '3rd Prize only for Technical', quantity: 1, unitPrice: 500, total: 500 },
        { sno: 4, name: 'Certificates', quantity: 10, unitPrice: 30, total: 300 },
        { sno: 5, name: 'Stationaries for Both events', quantity: 1, unitPrice: 300, total: 300 },
        { sno: 6, name: 'Permanent Decoration', quantity: 1, unitPrice: 500, total: 500 },
      ],
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      eventId: '40000000-0000-0000-0000-000000000002',
      fiscalYear: '2025-2026',
      category: 'SYMPOSIUM',
      allocatedCents: 7500000, // ₹75,000
      notes: 'SYNECTICS 26 National Level Symposium Budget',
      items: null,
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      eventId: '40000000-0000-0000-0000-000000000003',
      fiscalYear: '2025-2026',
      category: 'HACKATHON',
      allocatedCents: 15000000, // ₹1,50,000
      notes: '24H Flagship Hackathon Budget',
      items: null,
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      eventId: null,
      fiscalYear: '2025-2026',
      category: 'OPERATIONS',
      allocatedCents: 30000000, // ₹3,00,000
      notes: 'CSE Association Annual Operations Budget 2025-2026',
      items: null,
    },
  ];

  for (const b of budgets) {
    await query(`
      INSERT INTO budgets (id, club_id, event_id, fiscal_year, category, allocated_amount_cents, notes, items_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        allocated_amount_cents = EXCLUDED.allocated_amount_cents,
        notes = EXCLUDED.notes,
        items_json = EXCLUDED.items_json;
    `, [b.id, CLUB_ID, b.eventId, b.fiscalYear, b.category, b.allocatedCents, b.notes, b.items ? JSON.stringify(b.items) : null]);
  }
  console.log(` Seeded ${budgets.length} Event & Departmental Budgets.`);

  // 6. Seed Real Expense Claims
  const expenses = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      budgetId: '20000000-0000-0000-0000-000000000001',
      eventId: '40000000-0000-0000-0000-000000000001',
      claimantUserId: '10000000-0000-0000-0000-000000000007', // M. Kavikumar
      amountCents: 400000, // ₹4,000 (1st, 2nd & 3rd Cash Prizes)
      title: "1st, 2nd & 3rd Cash Prizes for Aura '25 (Technical & Non-Technical)",
      category: 'AWARDS',
      merchantName: 'CSE Department Cash Prize Pool',
      description: "1st Prize (2 x ₹1,000 = ₹2,000), 2nd Prize (2 x ₹750 = ₹1,500), 3rd Prize Technical (1 x ₹500 = ₹500). Approved by Student Treasurer, Association In-charge & HoD.",
      receiptUrl: '/receipts/receipt-aura-prizes.pdf',
      status: 'DISBURSED',
      disbursementMethod: 'UNIVERSITY_CASH_VOUCHER',
      treasurerApproverId: '10000000-0000-0000-0000-000000000003',
      presidentApproverId: '10000000-0000-0000-0000-000000000001',
    },
    {
      id: '30000000-0000-0000-0000-000000000006',
      budgetId: '20000000-0000-0000-0000-000000000001',
      eventId: '40000000-0000-0000-0000-000000000001',
      claimantUserId: '10000000-0000-0000-0000-000000000008', // S. Balahariharan
      amountCents: 60000, // ₹600 (Certificates & Stationaries)
      title: "Printed Certificates (10 items @ ₹30) & Stationaries for Both Events",
      category: 'SUPPLIES',
      merchantName: 'Erode Student Xerox & Stationery Mart',
      description: "Certificates 10 items @ ₹30 (₹300) and Stationaries for both Brain Busters & Fun Fusion events (₹300). Approved by Student Treasurer, Association In-charge & HoD.",
      receiptUrl: '/receipts/receipt-aura-certificates.pdf',
      status: 'DISBURSED',
      disbursementMethod: 'UNIVERSITY_CASH_VOUCHER',
      treasurerApproverId: '10000000-0000-0000-0000-000000000003',
      presidentApproverId: '10000000-0000-0000-0000-000000000001',
    },
    {
      id: '30000000-0000-0000-0000-000000000007',
      budgetId: '20000000-0000-0000-0000-000000000001',
      eventId: '40000000-0000-0000-0000-000000000001',
      claimantUserId: '10000000-0000-0000-0000-000000000007', // M. Kavikumar
      amountCents: 50000, // ₹500 (Permanent Decoration)
      title: "Permanent Decoration for CC2 (Block-3) & Placement Auditorium",
      category: 'OPERATIONAL',
      merchantName: 'Sri Murugan Flower & Stage Decors, Erode',
      description: "Permanent Decoration for both Aura 25 event venues. Approved by Student Treasurer, Association In-charge & HoD.",
      receiptUrl: '/receipts/receipt-aura-decoration.pdf',
      status: 'DISBURSED',
      disbursementMethod: 'UNIVERSITY_CASH_VOUCHER',
      treasurerApproverId: '10000000-0000-0000-0000-000000000003',
      presidentApproverId: '10000000-0000-0000-0000-000000000001',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      budgetId: '20000000-0000-0000-0000-000000000002',
      eventId: '40000000-0000-0000-0000-000000000002',
      claimantUserId: '10000000-0000-0000-0000-000000000006', // R. Rupanarayanan
      amountCents: 1850000, // ₹18,500
      title: 'ShellKode Industry Keynote speakers honorarium & accommodation',
      category: 'HOSPITALITY',
      merchantName: 'ShellKode Delegate Coordination',
      description: 'ShellKode Industry Keynote speakers honorarium & accommodation',
      receiptUrl: '/receipts/receipt-shellkode-honorarium.pdf',
      status: 'DISBURSED',
      disbursementMethod: 'BANK_TRANSFER_NEFT',
      treasurerApproverId: '10000000-0000-0000-0000-000000000003',
      presidentApproverId: '10000000-0000-0000-0000-000000000001',
    },
    {
      id: '30000000-0000-0000-0000-000000000003',
      budgetId: '20000000-0000-0000-0000-000000000002',
      eventId: '40000000-0000-0000-0000-000000000002',
      claimantUserId: '10000000-0000-0000-0000-000000000002', // Mr. K. U. Ranjith
      amountCents: 1000000, // ₹10,000
      title: 'Official Cash Prizes for SYNECTICS 26 (1st ₹5,000, 2nd ₹3,000, 3rd ₹2,000)',
      category: 'AWARDS',
      merchantName: 'CSE Department Cash Prize Pool',
      description: 'Official Cash Prizes for SYNECTICS 26 (1st ₹5,000, 2nd ₹3,000, 3rd ₹2,000)',
      receiptUrl: '/receipts/receipt-synectics-prizes.pdf',
      status: 'DISBURSED',
      disbursementMethod: 'DIRECT_UPI',
      treasurerApproverId: '10000000-0000-0000-0000-000000000003',
      presidentApproverId: '10000000-0000-0000-0000-000000000001',
    },
    {
      id: '30000000-0000-0000-0000-000000000004',
      budgetId: '20000000-0000-0000-0000-000000000003',
      eventId: '40000000-0000-0000-0000-000000000003',
      claimantUserId: '10000000-0000-0000-0000-000000000005', // N. Deepsika
      amountCents: 1420000, // ₹14,200
      title: 'Hackathon high-speed Wi-Fi router lease & power backup distribution',
      category: 'EQUIPMENT',
      merchantName: 'Nandha IT Infrastructure Cell',
      description: 'Hackathon high-speed Wi-Fi router lease & power backup distribution',
      receiptUrl: '/receipts/receipt-hackathon-network.pdf',
      status: 'TREASURER_APPROVED', // Awaiting final dual signoff by Association In-charge
      disbursementMethod: 'BANK_TRANSFER_NEFT',
      treasurerApproverId: '10000000-0000-0000-0000-000000000003',
      presidentApproverId: null,
    },
    {
      id: '30000000-0000-0000-0000-000000000005',
      budgetId: '20000000-0000-0000-0000-000000000004',
      eventId: null,
      claimantUserId: '10000000-0000-0000-0000-000000000009', // M. Pradeesh
      amountCents: 850000, // ₹8,500
      title: 'Team MATRIX official hoodies sample manufacturing and dye proofing',
      category: 'MERCHANDISE',
      merchantName: 'Tirupur Knitwear & Embroidery Works',
      description: 'Team MATRIX official hoodies sample manufacturing and dye proofing',
      receiptUrl: '/receipts/receipt-hoodie-sample.pdf',
      status: 'SUBMITTED',
      disbursementMethod: 'UNIVERSITY_CASH_VOUCHER',
      treasurerApproverId: null,
      presidentApproverId: null,
    },
  ];

  for (const exp of expenses) {
    await query(`
      INSERT INTO expense_reimbursements (
        id, club_id, budget_id, event_id, claimant_user_id, title, description, category,
        merchant_name, amount_cents, purchase_date, receipt_image_url, status, disbursement_method,
        treasurer_approver_id, president_approver_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        amount_cents = EXCLUDED.amount_cents,
        description = EXCLUDED.description,
        merchant_name = EXCLUDED.merchant_name,
        category = EXCLUDED.category,
        receipt_image_url = EXCLUDED.receipt_image_url,
        disbursement_method = EXCLUDED.disbursement_method,
        status = EXCLUDED.status,
        treasurer_approver_id = EXCLUDED.treasurer_approver_id,
        president_approver_id = EXCLUDED.president_approver_id;
    `, [
      exp.id,
      CLUB_ID,
      exp.budgetId,
      exp.eventId,
      exp.claimantUserId,
      exp.title,
      exp.description,
      exp.category,
      exp.merchantName,
      exp.amountCents,
      exp.receiptUrl,
      exp.status,
      exp.disbursementMethod,
      exp.treasurerApproverId,
      exp.presidentApproverId,
    ]);
  }
  console.log(` Seeded ${expenses.length} Expense Reimbursement claims with dual-approval workflow.`);

  // 7. Seed Real Cryptographically Signed Tickets with Verified QR Codes
  const sampleTickets = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      eventId: '40000000-0000-0000-0000-000000000002', // SYNECTICS 26
      tierId: '50000000-0000-0000-0000-000000000002',
      userId: '10000000-0000-0000-0000-000000000010', // K. Anbarasan
      ticketCode: 'TCK-SYNE-8802',
      status: 'ISSUED',
      pricePaidCents: 30000,
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      eventId: '40000000-0000-0000-0000-000000000002', // SYNECTICS 26
      tierId: '50000000-0000-0000-0000-000000000002',
      userId: '10000000-0000-0000-0000-000000000011', // S. Karthikeyan
      ticketCode: 'TCK-SYNE-8803',
      status: 'ISSUED',
      pricePaidCents: 30000,
    },
    {
      id: '60000000-0000-0000-0000-000000000003',
      eventId: '40000000-0000-0000-0000-000000000001', // AURA 25
      tierId: '50000000-0000-0000-0000-000000000001',
      userId: '10000000-0000-0000-0000-000000000009', // M. Pradeesh
      ticketCode: 'TCK-AURA-7701',
      status: 'CHECKED_IN',
      pricePaidCents: 0,
      checkedInAt: '2025-11-06T09:45:00Z',
    },
  ];

  for (const tck of sampleTickets) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = 'SEC' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const signature = generateQrSignature(tck.ticketCode, timestamp, nonce, config.QR_SIGNING_SECRET);

    await query(`
      INSERT INTO tickets (id, event_id, tier_id, user_id, ticket_code, status, price_paid_cents, qr_signature, checked_in_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        ticket_code = EXCLUDED.ticket_code,
        status = EXCLUDED.status,
        checked_in_at = EXCLUDED.checked_in_at;
    `, [
      tck.id,
      tck.eventId,
      tck.tierId,
      tck.userId,
      tck.ticketCode,
      tck.status,
      tck.pricePaidCents,
      signature,
      tck.checkedInAt || null,
    ]);
  }
  console.log(` Seeded ${sampleTickets.length} Issued tickets with cryptographic HMAC-SHA256 signatures.`);

  // 8. Seed Official Merchandise from Photos
  const products = [
    {
      id: '70000000-0000-0000-0000-000000000001',
      title: 'Team MATRIX Official Navy Hoodie',
      slug: 'team-matrix-official-navy-hoodie',
      description: 'Official Department of Computer Science & Engineering heavy-cotton Navy Blue hoodie with cyan contrast collar and cuff piping. Features front chest embroidered Team MATRIX wings shield crest and bold futuristic cyan CSE techno emblem across the back.',
      imageUrls: ['/images/products/team-matrix-hoodie.jpg'],
      category: 'Apparel',
      visual: 'hoodie',
      variants: [
        { id: '80000000-0000-0000-0000-000000000001', title: 'Size Small (S)', sku: 'HOODIE-NAVY-S', memberPriceCents: 75000, nonMemberPriceCents: 85000, stock: 30, attributes: { size: 'S', color: 'Navy Blue & Cyan' } },
        { id: '80000000-0000-0000-0000-000000000002', title: 'Size Medium (M)', sku: 'HOODIE-NAVY-M', memberPriceCents: 75000, nonMemberPriceCents: 85000, stock: 60, attributes: { size: 'M', color: 'Navy Blue & Cyan' } },
        { id: '80000000-0000-0000-0000-000000000003', title: 'Size Large (L)', sku: 'HOODIE-NAVY-L', memberPriceCents: 75000, nonMemberPriceCents: 85000, stock: 75, attributes: { size: 'L', color: 'Navy Blue & Cyan' } },
        { id: '80000000-0000-0000-0000-000000000004', title: 'Size Extra Large (XL)', sku: 'HOODIE-NAVY-XL', memberPriceCents: 75000, nonMemberPriceCents: 85000, stock: 50, attributes: { size: 'XL', color: 'Navy Blue & Cyan' } },
        { id: '80000000-0000-0000-0000-000000000005', title: 'Size Double Extra Large (XXL)', sku: 'HOODIE-NAVY-XXL', memberPriceCents: 75000, nonMemberPriceCents: 85000, stock: 25, attributes: { size: 'XXL', color: 'Navy Blue & Cyan' } },
      ],
    },
    {
      id: '70000000-0000-0000-0000-000000000003',
      title: 'Team MATRIX Official Navy Polo T-Shirt',
      slug: 'team-matrix-official-navy-polo',
      description: 'Official Department of Computer Science & Engineering breathable pique cotton Navy Blue Polo T-shirt featuring cyan double collar and sleeve stripes, and embroidered Team MATRIX wings shield emblem on the chest.',
      imageUrls: ['/images/products/team-matrix-polo.png'],
      category: 'Apparel',
      visual: 'polo',
      variants: [
        { id: '80000000-0000-0000-0000-000000000007', title: 'Size Small (S)', sku: 'POLO-NAVY-S', memberPriceCents: 45000, nonMemberPriceCents: 55000, stock: 40, attributes: { size: 'S', color: 'Navy Blue & Cyan' } },
        { id: '80000000-0000-0000-0000-000000000008', title: 'Size Medium (M)', sku: 'POLO-NAVY-M', memberPriceCents: 45000, nonMemberPriceCents: 55000, stock: 70, attributes: { size: 'M', color: 'Navy Blue & Cyan' } },
        { id: '80000000-0000-0000-0000-000000000009', title: 'Size Large (L)', sku: 'POLO-NAVY-L', memberPriceCents: 45000, nonMemberPriceCents: 55000, stock: 80, attributes: { size: 'L', color: 'Navy Blue & Cyan' } },
        { id: '80000000-0000-0000-0000-000000000010', title: 'Size Extra Large (XL)', sku: 'POLO-NAVY-XL', memberPriceCents: 45000, nonMemberPriceCents: 55000, stock: 50, attributes: { size: 'XL', color: 'Navy Blue & Cyan' } },
      ],
    },
    {
      id: '70000000-0000-0000-0000-000000000002',
      title: 'Team MATRIX Acrylic Tech Badge & Lanyard',
      slug: 'team-matrix-acrylic-tech-badge',
      description: 'Laser-engraved acrylic smart conference pass with neon cyan NFC/QR chip embed and silk woven Nandha Engineering College CSE lanyard.',
      imageUrls: ['/images/products/team-matrix-badge.png'],
      category: 'Accessories',
      visual: 'badge',
      variants: [
        { id: '80000000-0000-0000-0000-000000000006', title: 'Standard Edition', sku: 'BADGE-MATRIX-STD', memberPriceCents: 12000, nonMemberPriceCents: 15000, stock: 200, attributes: { size: 'Standard', color: 'Cyan Laser Engraved' } },
      ],
    },
  ];

  await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT \'Apparel\';');
  await query('ALTER TABLE products ADD COLUMN IF NOT EXISTS visual TEXT;');

  for (const prod of products) {
    await query(`
      INSERT INTO products (id, club_id, title, slug, description, image_urls, category, visual, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        image_urls = EXCLUDED.image_urls,
        category = EXCLUDED.category,
        visual = EXCLUDED.visual,
        is_published = TRUE;
    `, [prod.id, CLUB_ID, prod.title, prod.slug, prod.description, prod.imageUrls, prod.category, prod.visual]);

    for (const v of prod.variants) {
      await query(`
        INSERT INTO product_variants (id, product_id, title, sku, member_price_cents, non_member_price_cents, available_stock, reserved_stock, attributes_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
        ON CONFLICT (sku) DO UPDATE SET
          title = EXCLUDED.title,
          member_price_cents = EXCLUDED.member_price_cents,
          non_member_price_cents = EXCLUDED.non_member_price_cents,
          available_stock = EXCLUDED.available_stock,
          attributes_json = EXCLUDED.attributes_json;
      `, [v.id, prod.id, v.title, v.sku, v.memberPriceCents, v.nonMemberPriceCents, v.stock, JSON.stringify(v.attributes)]);
    }
  }
  console.log(` Seeded ${products.length} Products & Variants (Team MATRIX Official Hoodie & Badges).`);

  // 9. Seed Announcements
  const announcements = [
    {
      id: '90000000-0000-0000-0000-000000000001',
      title: "SYNECTICS '26 - GenAI Spark: Call for Registrations!",
      content: "Department of Computer Science and Engineering proudly presents SYNECTICS '26 in collaboration with ShellKode. Mini-hackathon style contest with exciting cash prizes (1st ₹5,000, 2nd ₹3,000, 3rd ₹2,000) and internship offers. Register before Feb 20, 2026.",
      authorId: '10000000-0000-0000-0000-000000000001',
      isPinned: true,
    },
    {
      id: '90000000-0000-0000-0000-000000000002',
      title: '24H Hackathon: Code. Build. Dominate - Problem Statements Released',
      content: 'Problem statements across Smart Cities, HealthTech, AgriTech, FinTech, and Open Innovation are now live. Submit PPT before March 30 for Round 1 selection. Contact Student Secretary N. Deepsika (93458 03946).',
      authorId: '10000000-0000-0000-0000-000000000005',
      isPinned: false,
    },
    {
      id: '90000000-0000-0000-0000-000000000003',
      title: "AURA '25 Inter-Department Results & Certificate Distribution",
      content: 'Congratulations to all winners of Brain Busters and Fun Fusion! Digital certificates have been dispatched to all participants. Student Coordinators M. Kavikumar & S. Balahariharan thank all department heads for their support.',
      authorId: '10000000-0000-0000-0000-000000000002',
      isPinned: false,
    },
  ];

  for (const an of announcements) {
    const auditHash = sha256(an.content);
    await query(`
      INSERT INTO announcements (id, club_id, author_id, title, content_markdown, is_pinned, audit_hash, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content_markdown = EXCLUDED.content_markdown,
        is_pinned = EXCLUDED.is_pinned,
        audit_hash = EXCLUDED.audit_hash;
    `, [an.id, CLUB_ID, an.authorId, an.title, an.content, an.isPinned, auditHash]);
  }
  console.log(` Seeded ${announcements.length} Announcements.`);

  // 10. Seed Kanban Tasks
  const tasks = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      title: 'Configure CC2 Lab GPU workstations for GenAI hackathon',
      description: 'Test Ollama and PyTorch environments on Block 3 CC2 machines with ShellKode templates.',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: '10000000-0000-0000-0000-000000000007', // M. Kavikumar
      dueAt: '2026-02-20T17:00:00Z',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      title: 'Verify ShellKode industry judges arrival and hospitality kits',
      description: 'Prepare mementos, certificates, and keynote presentation stage audio checks.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: '10000000-0000-0000-0000-000000000006', // R. Rupanarayanan
      dueAt: '2026-02-21T08:30:00Z',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      title: 'Distribute Team MATRIX Official Hoodies to registered students',
      description: 'Set up collection desk at CSE Department lobby and scan student membership passes.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: '10000000-0000-0000-0000-000000000009', // M. Pradeesh
      dueAt: '2026-03-05T16:00:00Z',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      title: 'Publish 24H Hackathon Round 1 shortlisted teams',
      description: 'Compile evaluation scores from faculty review panel and send confirmation emails.',
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: '10000000-0000-0000-0000-000000000005', // N. Deepsika
      dueAt: '2026-04-02T18:00:00Z',
    },
  ];

  for (const t of tasks) {
    await query(`
      INSERT INTO tasks (id, club_id, creator_id, assigned_to_user_id, title, description_markdown, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        due_date = EXCLUDED.due_date;
    `, [t.id, CLUB_ID, '10000000-0000-0000-0000-000000000001', t.assigneeId, t.title, t.description, t.status, t.priority, t.dueAt]);
  }
  console.log(` Seeded ${tasks.length} Kanban Tasks.`);

  // 11. Seed Real Fundraisers & Volunteer Shifts
  const fundraisers = [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      title: 'ShellKode Industry Innovation Grant & Student Prize Pool',
      description: 'Corporate sponsorship and industry grant for cash prize pool, student prototyping kits, and GPU cloud computing credits for SYNECTICS 26 and Hackathon.',
      targetAmountCents: 20000000, // ₹2,00,000
      raisedAmountCents: 12500000, // ₹1,25,000
      startsAt: '2026-01-01T00:00:00Z',
      endsAt: '2026-05-31T23:59:59Z',
    },
  ];

  for (const f of fundraisers) {
    await query(`
      INSERT INTO fundraisers (id, club_id, title, description, target_amount_cents, raised_amount_cents, starts_at, ends_at, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        target_amount_cents = EXCLUDED.target_amount_cents,
        raised_amount_cents = EXCLUDED.raised_amount_cents,
        is_active = TRUE;
    `, [f.id, CLUB_ID, f.title, f.description, f.targetAmountCents, f.raisedAmountCents, f.startsAt, f.endsAt]);
  }
  console.log(` Seeded ${fundraisers.length} Fundraisers.`);

  // 12. Seed Real Orders & Order Items
  const sampleOrderId = 'e0000000-0000-0000-0000-000000000001';
  await query(`
    INSERT INTO orders (id, club_id, user_id, order_number, status, subtotal_cents, discount_cents, total_cents)
    VALUES ($1, $2, $3, 'ORD-NEC-1001', 'PAID', 75000, 0, 75000)
    ON CONFLICT (order_number) DO UPDATE SET
      status = EXCLUDED.status,
      total_cents = EXCLUDED.total_cents;
  `, [sampleOrderId, CLUB_ID, '10000000-0000-0000-0000-000000000005']);

  const orderRow = await query(`SELECT id FROM orders WHERE order_number = 'ORD-NEC-1001' LIMIT 1;`);
  const variantRow = await query(`SELECT id FROM product_variants WHERE sku = 'HOODIE-NAVY-M' LIMIT 1;`);

  if (orderRow.rows[0] && variantRow.rows[0]) {
    await query(`
      INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price_cents, total_price_cents)
      VALUES (
        'f0000000-0000-0000-0000-000000000001',
        $1,
        $2,
        1,
        75000,
        75000
      )
      ON CONFLICT (id) DO UPDATE SET
        quantity = EXCLUDED.quantity;
    `, [orderRow.rows[0].id, variantRow.rows[0].id]);
  }
  console.log(' Seeded Verified Merchandise Orders & Items.');

  // 13. Seed Double-Entry Journal Entries & Ledger Lines
  const journalEntries = [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      entryNumber: 'JRN-1000',
      description: 'Nandha Engineering College Annual CSE Association Fund Allocation (Opening Balance)',
      refType: 'MANUAL_ADJUSTMENT',
      debitCode: '1020',
      creditCode: '3010',
      amountCents: 10000000, // ₹1,00,000
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      entryNumber: 'JRN-1001',
      description: 'Annual student membership dues collected',
      refType: 'MEMBERSHIP_PAYMENT',
      debitCode: '1010',
      creditCode: '4010',
      amountCents: 500000, // ₹5,000
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      entryNumber: 'JRN-1201',
      description: 'Team MATRIX Official Navy Hoodie sales',
      refType: 'MERCH_SALE',
      debitCode: '1010',
      creditCode: '4030',
      amountCents: 75000, // ₹750
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      entryNumber: 'JRN-1301',
      description: 'ShellKode Industry Grant & Sponsorship received',
      refType: 'DONATION',
      debitCode: '1020',
      creditCode: '4040',
      amountCents: 12500000, // ₹1,25,000
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      entryNumber: 'JRN-1401',
      description: 'Aura 25 Event Expenses Disbursed: Prizes (₹4,000), Certificates & Stationery (₹600), Decoration (₹500)',
      refType: 'EXPENSE_PAYOUT',
      debitCode: '5010',
      creditCode: '1010',
      amountCents: 510000, // ₹5,100
    },
  ];

  for (const jrn of journalEntries) {
    await query(`
      INSERT INTO journal_entries (id, club_id, entry_number, description, reference_type, posted_by_user_id)
      VALUES ($1, $2, $3, $4, $5, '10000000-0000-0000-0000-000000000003')
      ON CONFLICT (entry_number) DO UPDATE SET
        description = EXCLUDED.description;
    `, [jrn.id, CLUB_ID, jrn.entryNumber, jrn.description, jrn.refType]);

    const jrnRow = await query(`SELECT id FROM journal_entries WHERE entry_number = $1 LIMIT 1;`, [jrn.entryNumber]);
    const jrnId = jrnRow.rows[0]?.id || jrn.id;

    const debitAcc = await query(`SELECT id FROM ledger_accounts WHERE club_id = $1 AND account_code = $2;`, [CLUB_ID, jrn.debitCode]);
    const creditAcc = await query(`SELECT id FROM ledger_accounts WHERE club_id = $1 AND account_code = $2;`, [CLUB_ID, jrn.creditCode]);

    if (debitAcc.rows[0] && creditAcc.rows[0]) {
      await query(`
        INSERT INTO ledger_lines (id, journal_entry_id, account_id, debit_cents, credit_cents, description)
        VALUES (gen_random_uuid(), $1, $2, $3, 0, $4)
        ON CONFLICT DO NOTHING;
      `, [jrnId, debitAcc.rows[0].id, jrn.amountCents, `${jrn.description} (Debit)`]);

      await query(`
        INSERT INTO ledger_lines (id, journal_entry_id, account_id, debit_cents, credit_cents, description)
        VALUES (gen_random_uuid(), $1, $2, 0, $3, $4)
        ON CONFLICT DO NOTHING;
      `, [jrnId, creditAcc.rows[0].id, jrn.amountCents, `${jrn.description} (Credit)`]);

      await query(`UPDATE ledger_accounts SET balance_cents = balance_cents + $1 WHERE id = $2;`, [jrn.amountCents, debitAcc.rows[0].id]);
      await query(`UPDATE ledger_accounts SET balance_cents = balance_cents + $1 WHERE id = $2;`, [jrn.amountCents, creditAcc.rows[0].id]);
    }
  }
  console.log(` Seeded ${journalEntries.length} Double-Entry Journal Entries & Ledger Lines.`);

  console.log('🎉 Seeding successfully completed! All data and image paths are populated directly in PostgreSQL.');
}

// Execute if run directly
const isDirectExecution = process.argv[1] && /seedRealData\.js$/i.test(process.argv[1].trim());
if (isDirectExecution) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
