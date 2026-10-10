import { demoAccounts } from '../scenarios/demoAccounts.js';

const base = new Date('2026-10-10T09:00:00+05:30').getTime();
const day = 86400000;
const at = (d, h = 0) => new Date(base + d * day + h * 3600000).toISOString();

export function createSeed() {
  const clubs = [
    {
      id: 'nec-cse',
      slug: 'nec-cse',
      name: 'Nandha Engineering College - CSE Association (Team MATRIX)',
      initials: 'TM',
      description:
        'Official Association of Computer Science & Engineering, Nandha Engineering College (Autonomous), Erode - 638 052. Empowering student innovators with technical symposia, hackathons, and industry workshops.',
      category: 'Department Association',
      fiscalYear: '2025–2026',
      location: 'Department of CSE, Block 3, CC2 Lab & Placement Auditorium',
    },
    {
      id: 'skyline',
      slug: 'skyline',
      name: 'Skyline Student Association',
      initials: 'SS',
      description: 'Good people. Great ideas. A campus that feels like home.',
      category: 'Student community',
      fiscalYear: '2026–2027',
      location: 'Student Union, Ground Floor',
    },
    {
      id: 'makers',
      slug: 'makers',
      name: 'Campus Makers Collective',
      initials: 'CM',
      description:
        'Build something that matters. A community for curious minds and hands-on creators.',
      category: 'Technology & innovation',
      fiscalYear: '2026–2027',
      location: 'Innovation Lab, Block B',
    },
  ];

  const users = demoAccounts.map((u) => ({ ...u }));

  // Memberships across nec-cse, skyline, and makers
  const memberships = [];

  // 1. nec-cse memberships
  users
    .filter((u) => !['VISITOR', 'STUDENT', 'AUDITOR'].includes(u.role))
    .forEach((u, i) => {
      memberships.push({
        id: `MEM-NEC-${1001 + i}`,
        clubId: 'nec-cse',
        userId: u.id,
        role: u.role,
        tier: ['incharge', 'auditor'].includes(u.id) ? 'HONORARY' : i < 3 ? 'PREMIUM' : 'STANDARD',
        validFrom: at(-300),
        validUntil: at(u.id === 'grace' ? -3 : u.id === 'expired' ? -20 : 180),
        status: u.id === 'grace' ? 'GRACE_PERIOD' : u.id === 'expired' ? 'EXPIRED' : 'ACTIVE',
        passCode: `PASS-NEC-${u.studentId || u.id}`,
        dues: 50000,
      });
    });

  // 2. skyline memberships (for legacy test compatibility)
  users
    .filter((u) => !['VISITOR', 'STUDENT', 'AUDITOR'].includes(u.role))
    .forEach((u, i) => {
      memberships.push({
        id: `MEM-${1001 + i}`,
        clubId: 'skyline',
        userId: u.id,
        role: u.id === 'president' ? 'PRESIDENT' : u.role,
        tier: i === 0 ? 'PREMIUM' : 'STANDARD',
        validFrom: at(-300),
        validUntil: at(u.id === 'grace' ? -3 : u.id === 'expired' ? -20 : 180),
        status: u.id === 'grace' ? 'GRACE_PERIOD' : u.id === 'expired' ? 'EXPIRED' : 'ACTIVE',
        passCode: `PASS-${u.studentId || u.id}`,
        dues: 50000,
      });
    });

  // 3. makers memberships
  memberships.push({
    id: 'MEM-2001',
    clubId: 'makers',
    userId: 'member',
    role: 'VOLUNTEER',
    tier: 'STANDARD',
    validFrom: at(-90),
    validUntil: at(90),
    status: 'ACTIVE',
    passCode: 'PASS-MAKERS-014',
    dues: 30000,
  });
  memberships.push({
    id: 'MEM-2002',
    clubId: 'makers',
    userId: 'lead',
    role: 'ASSOCIATION_COORDINATOR',
    tier: 'STANDARD',
    validFrom: at(-90),
    validUntil: at(90),
    status: 'ACTIVE',
    passCode: 'PASS-MAKERS-011',
    dues: 30000,
  });

  const plans = clubs.flatMap((c) => [
    {
      id: `${c.id}-standard`,
      clubId: c.id,
      title: c.id === 'nec-cse' ? 'Standard CSE Membership' : 'Standard',
      tier: 'STANDARD',
      amount: c.id === 'makers' ? 30000 : 50000,
      benefits: [
        'Member ticket prices',
        'Merchandise discounts',
        'Community events',
        'Digital membership pass',
      ],
    },
    {
      id: `${c.id}-premium`,
      clubId: c.id,
      title: c.id === 'nec-cse' ? 'Premium Delegate & Innovator Plan' : 'Premium',
      tier: 'PREMIUM',
      amount: 90000,
      benefits: [
        'All Standard benefits',
        'Early event access',
        'Priority workshop seats',
        'Alumni networking',
      ],
    },
  ]);

  const events = [
    // Real Nandha College CSE Association Events
    {
      id: 'aura-25',
      scannerUsers: ['volunteer', 'lead', 'coordinator', 'incharge'],
      clubId: 'nec-cse',
      title: "AURA '25 - Inter-Department Event",
      category: 'Inter-Department',
      description:
        'Inter-Department Symposium featuring Brain Busters (Technical Quiz & Coding, Venue: CC2 Block-3 at 09:30 AM) and Fun Fusion (Non-Technical Gaming & Media, Placement Auditorium at 01:45 PM). Free registration. E-Certificates provided for all participants. Organized by Student Coordinators Mr. M. Kavikumar (82483 70733) & Mr. S. Balahariharan (93608 59712).',
      venue: 'CC2 (Block-3) & Placement Auditorium',
      startsAt: at(-150, 9.5),
      endsAt: at(-150, 16.5),
      capacity: 350,
      published: true,
      salesOpen: at(-165),
      salesClose: at(-151),
      visual: 'meet',
    },
    {
      id: 'synectics-26',
      scannerUsers: ['volunteer', 'lead', 'coordinator', 'incharge'],
      clubId: 'nec-cse',
      title: "SYNECTICS '26 - GenAI Spark (National Level Symposium)",
      category: 'National Symposium',
      description:
        'National Level Technical Symposium & Mini Hackathon-style contest in collaboration with ShellKode Private Limited. Theme: GenAI Spark (Applied GenAI, AI Automation & Intelligent Workflows, Multimodal AI, Enterprise AI for Decision Intelligence). Evaluation by experienced industry professionals with dedicated guidance and internship offers for outstanding teams. Cash Prizes: 1st Prize ₹5,000, 2nd Prize ₹3,000, 3rd Prize ₹2,000. Team size up to 3 members. Student Coordinators: Mr. R. Rupanarayanan (63825 52533), Mr. M. Pradeesh (94877 70881). Faculty Coordinators: Dr. M. P. Thiruvenkatasuresh, Ms. D. Vinoparkavi, Mr. K. U. Ranjith. Head of Dept: Dr. T. Rajasekaran.',
      venue: 'Block 3, CC2 Laboratory',
      startsAt: at(5, 9),
      endsAt: at(5, 17),
      capacity: 300,
      published: true,
      salesOpen: at(-10),
      salesClose: at(4),
      visual: 'design',
    },
    {
      id: 'hackathon-26',
      scannerUsers: ['volunteer', 'lead', 'coordinator', 'incharge'],
      clubId: 'nec-cse',
      title: '24H HACKATHON: CODE. BUILD. DOMINATE',
      category: 'Hackathon',
      description:
        '24-Hour Non-stop Flagship Hackathon. Solve pressing problems using AI/ML, Blockchain, Cyber Security, IoT, 3D Printing, Embedded Systems & other relevant technologies. Domains: Smart Cities, Health Tech & Telemedicine, Agri Tech, Environment/Energy & Sustainable Development, Smart Automation, Financial Tech, Education Tech, Open Innovation. Round 1: Free Registration (Submit PPT before 30th March). Grand Finale: April 17 & 18, 2026. Round 2 Registration: ₹1,000 per team (Min 2 & Max 4 members). Exciting Cash Prizes! Student Secretary: N. Deepsika (93458 03946). Co-Convener: Mr. S. Muruganantham (Incharge - CiPD). Convener: Dr. M. Easwaramoorthi (Dean - Innovation & Incubation). Principal: Dr. U. S. Ragupathy.',
      venue: 'IDEA Lab & Placement Auditorium',
      startsAt: at(30, 9),
      endsAt: at(31, 12),
      capacity: 250,
      published: true,
      salesOpen: at(-5),
      salesClose: at(29),
      visual: 'gala',
    },
    // Skyline / Makers Events (test compatibility)
    {
      id: 'gala',
      scannerUsers: ['volunteer'],
      clubId: 'skyline',
      title: 'The Skyline Spring Gala',
      category: 'Social',
      description:
        'An evening of live music, campus connections and a celebration of everything we create together.',
      venue: 'University Auditorium',
      startsAt: at(12, 9),
      endsAt: at(12, 13),
      capacity: 120,
      published: true,
      salesOpen: at(-10),
      salesClose: at(11),
      visual: 'gala',
    },
    {
      id: 'design',
      scannerUsers: ['volunteer'],
      clubId: 'skyline',
      title: 'Designing what comes next',
      category: 'Workshop',
      description: 'A hands-on design workshop with alumni who are shaping the world around us.',
      venue: 'Creative Studio · Block A',
      startsAt: at(5, 5),
      endsAt: at(5, 7),
      capacity: 40,
      published: true,
      salesOpen: at(-5),
      salesClose: at(4),
      visual: 'design',
    },
    {
      id: 'meet',
      scannerUsers: [],
      clubId: 'skyline',
      title: 'October community meetup',
      category: 'Community',
      description: 'Meet your fellow members, share your ideas and help shape the next semester.',
      venue: 'Student Union',
      startsAt: at(3, 7),
      endsAt: at(3, 9),
      capacity: 80,
      published: true,
      salesOpen: at(-3),
      salesClose: at(2),
      visual: 'meet',
    },
    {
      id: 'build',
      scannerUsers: [],
      clubId: 'makers',
      title: 'Build night: ideas into prototypes',
      category: 'Workshop',
      description: 'Bring an idea. Leave with your first working prototype.',
      venue: 'Innovation Lab',
      startsAt: at(7, 8),
      endsAt: at(7, 11),
      capacity: 25,
      published: true,
      salesOpen: at(-3),
      salesClose: at(6),
      visual: 'design',
    },
  ];

  const tiers = [
    // nec-cse tiers
    {
      id: 'aura-25-free',
      eventId: 'aura-25',
      name: 'Free Registration (Technical & Non-Technical)',
      capacity: 350,
      memberPrice: 0,
      publicPrice: 0,
    },
    {
      id: 'synectics-26-delegate',
      eventId: 'synectics-26',
      name: 'General Symposium Delegate Pass',
      capacity: 200,
      memberPrice: 25000,
      publicPrice: 30000,
    },
    {
      id: 'synectics-26-spark',
      eventId: 'synectics-26',
      name: 'ShellKode GenAI Spark Team Pass (Up to 3 Members)',
      capacity: 100,
      memberPrice: 50000,
      publicPrice: 60000,
    },
    {
      id: 'hackathon-26-round1',
      eventId: 'hackathon-26',
      name: 'Round 1 - PPT Submission (Free)',
      capacity: 200,
      memberPrice: 0,
      publicPrice: 0,
    },
    {
      id: 'hackathon-26-finale',
      eventId: 'hackathon-26',
      name: 'Grand Finale Team Pass (Round 2 Finalists)',
      capacity: 50,
      memberPrice: 80000,
      publicPrice: 100000,
    },
    // skyline / makers tiers
    ...events
      .filter((e) => ['gala', 'design', 'meet', 'build'].includes(e.id))
      .flatMap((e) => [
        {
          id: `${e.id}-general`,
          eventId: e.id,
          name: 'General admission',
          capacity: Math.ceil(e.capacity * 0.75),
          memberPrice: e.id === 'meet' ? 0 : 25000,
          publicPrice: e.id === 'meet' ? 0 : 35000,
        },
        {
          id: `${e.id}-premium`,
          eventId: e.id,
          name: 'Premium experience',
          capacity: Math.floor(e.capacity * 0.25),
          memberPrice: 50000,
          publicPrice: 65000,
        },
      ]),
  ];

  const tickets = [
    // nec-cse tickets
    {
      id: 'TCK-SYNE-8801',
      code: 'TCK-SYNE-8801',
      clubId: 'nec-cse',
      eventId: 'synectics-26',
      tierId: 'synectics-26-delegate',
      userId: 'member',
      status: 'ISSUED',
      amount: 25000,
      createdAt: at(-2),
      history: [{ status: 'ISSUED', at: at(-2) }],
    },
    {
      id: 'TCK-SYNE-8802',
      code: 'TCK-SYNE-8802',
      clubId: 'nec-cse',
      eventId: 'synectics-26',
      tierId: 'synectics-26-delegate',
      userId: 'expired',
      status: 'CHECKED_IN',
      amount: 25000,
      checkedAt: at(-1),
      station: 'CC2-DESK-01',
      createdAt: at(-2),
      history: [
        { status: 'ISSUED', at: at(-2) },
        { status: 'CHECKED_IN', at: at(-1) },
      ],
    },
    {
      id: 'TCK-AURA-7701',
      code: 'TCK-AURA-7701',
      clubId: 'nec-cse',
      eventId: 'aura-25',
      tierId: 'aura-25-free',
      userId: 'grace',
      status: 'CHECKED_IN',
      amount: 0,
      checkedAt: at(-150),
      station: 'AUDITORIUM-ENTRANCE',
      createdAt: at(-152),
      history: [
        { status: 'ISSUED', at: at(-152) },
        { status: 'CHECKED_IN', at: at(-150) },
      ],
    },
    {
      id: 'TCK-HACK-9901',
      code: 'TCK-HACK-9901',
      clubId: 'nec-cse',
      eventId: 'hackathon-26',
      tierId: 'hackathon-26-round1',
      userId: 'student',
      status: 'ISSUED',
      amount: 0,
      createdAt: at(-1),
      history: [{ status: 'ISSUED', at: at(-1) }],
    },
    // skyline tickets (for workflows.test.js)
    {
      id: 'TCK-1001',
      code: 'TCK-SKY-1001',
      clubId: 'skyline',
      eventId: 'gala',
      tierId: 'gala-general',
      userId: 'member',
      status: 'ISSUED',
      amount: 25000,
      createdAt: at(-2),
      history: [{ status: 'ISSUED', at: at(-2) }],
    },
    {
      id: 'TCK-1002',
      code: 'TCK-SKY-1002',
      clubId: 'skyline',
      eventId: 'gala',
      tierId: 'gala-general',
      userId: 'volunteer',
      status: 'CHECKED_IN',
      amount: 25000,
      checkedAt: at(-1),
      station: 'DOOR-01',
      createdAt: at(-2),
      history: [
        { status: 'ISSUED', at: at(-2) },
        { status: 'CHECKED_IN', at: at(-1) },
      ],
    },
  ];

  const products = [
    // nec-cse products
    {
      id: 'hoodie',
      clubId: 'nec-cse',
      title: 'Team MATRIX Official Navy Hoodie',
      description:
        'Official Department of Computer Science & Engineering heavy-cotton Navy Blue hoodie with cyan contrast collar and cuff piping. Features front chest embroidered Team MATRIX wings shield crest and bold futuristic cyan CSE techno emblem across the back.',
      category: 'Apparel',
      visual: 'hoodie',
    },
    {
      id: 'badge',
      clubId: 'nec-cse',
      title: 'Team MATRIX Acrylic Tech Badge & Lanyard',
      description:
        'Laser-engraved acrylic smart conference pass with neon cyan NFC/QR chip embed and silk woven Nandha Engineering College CSE lanyard.',
      category: 'Accessories',
      visual: 'tote',
    },
    // skyline / makers products
    {
      id: 'skyline-hoodie',
      clubId: 'skyline',
      title: 'The Skyline hoodie',
      description:
        'Your everyday campus essential. Heavyweight cotton, embroidered club crest, relaxed fit.',
      category: 'Apparel',
      visual: 'hoodie',
    },
    {
      id: 'tee',
      clubId: 'skyline',
      title: 'Campus essentials tee',
      description: 'Soft organic cotton. A little club pride, wherever you go.',
      category: 'Apparel',
      visual: 'tee',
    },
    {
      id: 'tote',
      clubId: 'skyline',
      title: 'Everyday canvas tote',
      description: 'For notebooks, big ideas and everything in between.',
      category: 'Accessories',
      visual: 'tote',
    },
    {
      id: 'maker-tee',
      clubId: 'makers',
      title: 'Made on campus tee',
      description: 'Wear your curiosity. A classic cotton tee for makers.',
      category: 'Apparel',
      visual: 'tee',
    },
  ];

  const variants = [
    // nec-cse variants
    ...['S', 'M', 'L', 'XL', 'XXL'].map((size, i) => ({
      id: `hoodie-${size}`,
      productId: 'hoodie',
      clubId: 'nec-cse',
      sku: `HOODIE-NAVY-${size}`,
      size,
      color: 'Navy Blue & Cyan',
      stock: 25 + i * 10,
      memberPrice: 75000,
      publicPrice: 85000,
      cost: 45000,
    })),
    {
      id: 'badge-STD',
      productId: 'badge',
      clubId: 'nec-cse',
      sku: 'BADGE-MATRIX-STD',
      size: 'Standard',
      color: 'Cyan Laser Engraved',
      stock: 200,
      memberPrice: 12000,
      publicPrice: 15000,
      cost: 6000,
    },
    // skyline variants (including hoodie-M with 79900 memberPrice for workflows.test.js)
    ...['S', 'M', 'L', 'XL', 'XXL'].map((size, i) => ({
      id: `skyline-hoodie-${size}`,
      productId: 'skyline-hoodie',
      clubId: 'skyline',
      sku: `SKY-HOODIE-NAVY-${size}`,
      size,
      color: 'Navy',
      stock: 12 + i * 3,
      memberPrice: 79900,
      publicPrice: 119900,
      cost: 45000,
    })),
    ...products
      .filter((p) => ['tee', 'tote', 'maker-tee'].includes(p.id))
      .flatMap((p) =>
        (p.visual === 'tote' ? ['One size'] : ['S', 'M', 'L', 'XL', 'XXL']).map((size, i) => ({
          id: `${p.id}-${size}`,
          productId: p.id,
          clubId: p.clubId,
          sku: `${p.id.toUpperCase()}-NAVY-${size}`,
          size,
          color: 'Navy',
          stock: 12 + i * 3,
          memberPrice: p.visual === 'tee' ? 39900 : 29900,
          publicPrice: p.visual === 'tee' ? 59900 : 44900,
          cost: 18000,
        })),
      ),
  ];

  // Provide hoodie-M alias for skyline if test looks up hoodie-M under skyline
  variants.push({
    id: 'hoodie-M',
    productId: 'skyline-hoodie',
    clubId: 'skyline',
    sku: 'HOODIE-NAVY-M',
    size: 'M',
    color: 'Navy',
    stock: 15,
    memberPrice: 79900,
    publicPrice: 119900,
    cost: 45000,
  });

  const orders = [
    {
      id: 'ORD-NEC-1001',
      clubId: 'nec-cse',
      userId: 'member',
      status: 'FULFILLED',
      amount: 75000,
      createdAt: at(-4),
      items: [{ variantId: 'hoodie-L', quantity: 1, price: 75000 }],
      pickup: 'CSE Department Lobby · MATRIX Merchandise Desk',
      history: [
        { status: 'PAID', at: at(-4) },
        { status: 'FULFILLED', at: at(-3) },
      ],
    },
    {
      id: 'ORD-1001',
      clubId: 'skyline',
      userId: 'member',
      status: 'FULFILLED',
      amount: 39900,
      createdAt: at(-4),
      items: [{ variantId: 'tee-M', quantity: 1, price: 39900 }],
      pickup: 'Student Union · merchandise desk',
      history: [
        { status: 'PAID', at: at(-4) },
        { status: 'FULFILLED', at: at(-3) },
      ],
    },
  ];

  const fundraisers = [
    {
      id: 'matrix-innovate',
      clubId: 'nec-cse',
      title: 'Team MATRIX Student Innovation & Hardware Grant Pool',
      description:
        'Crowdfunded student project accelerator supporting IoT hardware, edge AI kits, and symposium registration fee grants for deserving students.',
      target: 2500000,
      startsAt: at(-10, 1),
      endsAt: at(20, 7),
      active: true,
    },
    {
      id: 'bake',
      clubId: 'skyline',
      title: 'Bake a little. Give a lot.',
      description: 'Our annual bake sale supports the campus student wellbeing fund.',
      target: 2500000,
      startsAt: at(8, 1),
      endsAt: at(8, 7),
      active: true,
    },
  ];

  const tasks = [
    // nec-cse tasks
    ['task-1', 'Configure CC2 Lab GPU workstations for GenAI hackathon', 'DONE', 'HIGH', 'volunteer', -1, 3, 'nec-cse', 'matrix-innovate'],
    ['task-2', 'Verify ShellKode industry judges arrival and hospitality kits', 'IN_PROGRESS', 'URGENT', 'lead', 1, 2, 'nec-cse', 'matrix-innovate'],
    ['task-3', 'Distribute Team MATRIX Official Hoodies to registered students', 'TODO', 'MEDIUM', 'grace', 3, 1, 'nec-cse', 'matrix-innovate'],
    ['task-4', 'Publish 24H Hackathon Round 1 shortlisted teams', 'TODO', 'HIGH', 'secretary', 5, 0, 'nec-cse', 'matrix-innovate'],
    // skyline tasks
    ['task-sky-1', 'Plan the bake sale menu', 'BACKLOG', 'MEDIUM', null, 6, 0, 'skyline', 'bake'],
    ['task-sky-2', 'Buy baking supplies', 'TODO', 'URGENT', 'volunteer', 0.5, 1, 'skyline', 'bake'],
    ['task-sky-3', 'Design the fundraiser poster', 'IN_PROGRESS', 'MEDIUM', 'member', 3, 2, 'skyline', 'bake'],
    ['task-sky-4', 'Confirm table booking', 'BLOCKED', 'HIGH', 'lead', 1, 1, 'skyline', 'bake'],
    ['task-sky-5', 'Recruit the baking team', 'DONE', 'LOW', 'lead', -1, 3, 'skyline', 'bake'],
  ].map(([id, title, status, priority, assignee, due, done, clubId, fundraiserId]) => ({
    id,
    clubId,
    title,
    status,
    priority,
    assignee,
    due: at(due),
    fundraiserId,
    description: 'Coordinate with the team and keep the checklist up to date.',
    checklist: ['Confirm requirements', 'Complete preparation', 'Share with the team'].map(
      (itemTitle, i) => ({ title: itemTitle, done: i < done }),
    ),
  }));

  const shifts = [
    {
      id: 'shift-1',
      clubId: 'nec-cse',
      fundraiserId: 'matrix-innovate',
      title: 'Merchandise Distribution Lead',
      startsAt: at(1, 1),
      endsAt: at(1, 3),
      userId: 'lead',
    },
    {
      id: 'shift-2',
      clubId: 'nec-cse',
      fundraiserId: 'matrix-innovate',
      title: 'Help Desk Coordinator',
      startsAt: at(1, 3),
      endsAt: at(1, 5),
      userId: 'volunteer',
    },
    // skyline shifts
    {
      id: 'shift-sky-1',
      clubId: 'skyline',
      fundraiserId: 'bake',
      title: 'Baking lead',
      startsAt: at(7, 1),
      endsAt: at(7, 3),
      userId: 'lead',
    },
    {
      id: 'shift-sky-2',
      clubId: 'skyline',
      fundraiserId: 'bake',
      title: 'Supplies runner',
      startsAt: at(7, 3),
      endsAt: at(7, 5),
      userId: null,
    },
    {
      id: 'shift-sky-3',
      clubId: 'skyline',
      fundraiserId: 'bake',
      title: 'Table duty',
      startsAt: at(8, 1),
      endsAt: at(8, 3),
      userId: 'volunteer',
    },
    {
      id: 'shift-sky-4',
      clubId: 'skyline',
      fundraiserId: 'bake',
      title: 'Table duty',
      startsAt: at(8, 3),
      endsAt: at(8, 5),
      userId: null,
    },
  ];

  const announcements = [
    // nec-cse announcements
    {
      id: 'ann-1',
      clubId: 'nec-cse',
      title: "SYNECTICS '26 - GenAI Spark: Call for Registrations!",
      content:
        "Department of Computer Science and Engineering proudly presents SYNECTICS '26 in collaboration with ShellKode Private Limited. Mini-hackathon style contest with exciting cash prizes (1st ₹5,000, 2nd ₹3,000, 3rd ₹2,000) and internship offers for outstanding teams. Register before Feb 20, 2026.",
      audience: 'PUBLIC',
      pinned: true,
      authorId: 'incharge',
      publishedAt: at(-3),
      status: 'PUBLISHED',
    },
    {
      id: 'ann-2',
      clubId: 'nec-cse',
      title: '24H Hackathon: Code. Build. Dominate - Problem Statements Released',
      content:
        'Problem statements across Smart Cities, HealthTech, AgriTech, FinTech, and Open Innovation are now live. Submit PPT before March 30 for Round 1 selection. Contact Student Secretary N. Deepsika (93458 03946).',
      audience: 'ALL_MEMBERS',
      pinned: false,
      authorId: 'secretary',
      publishedAt: at(-1),
      status: 'PUBLISHED',
    },
    {
      id: 'ann-3',
      clubId: 'nec-cse',
      title: "AURA '25 Inter-Department Results & Certificate Distribution",
      content:
        'Congratulations to all winners of Brain Busters and Fun Fusion! Digital certificates have been dispatched to all participants. Student Coordinators M. Kavikumar & S. Balahariharan thank all department heads for their support.',
      audience: 'PUBLIC',
      pinned: false,
      authorId: 'coordinator',
      publishedAt: at(-0.5),
      status: 'PUBLISHED',
    },
    // skyline announcements
    {
      id: 'ann-sky-1',
      clubId: 'skyline',
      title: 'Your next great semester starts here',
      content:
        'Membership is open for 2026–27. Join a community that makes campus life a little more connected. Visit the membership page to find your plan.',
      audience: 'PUBLIC',
      pinned: true,
      authorId: 'incharge',
      publishedAt: at(-3),
      status: 'PUBLISHED',
    },
    {
      id: 'ann-sky-2',
      clubId: 'skyline',
      title: 'The Spring Gala: save your seat',
      content:
        'Member bookings are now open. Your membership discount is applied automatically. Bring your digital ticket on the night.',
      audience: 'ALL_MEMBERS',
      pinned: false,
      authorId: 'incharge',
      publishedAt: at(-1),
      status: 'PUBLISHED',
    },
    {
      id: 'ann-sky-3',
      clubId: 'skyline',
      title: 'Bake sale volunteers: team briefing',
      content:
        'Please check your tasks and claim a shift before Friday. We will meet at the Student Union for a quick preparation briefing.',
      audience: 'COMMITTEE_ONLY',
      pinned: false,
      authorId: 'lead',
      publishedAt: at(-0.5),
      status: 'PUBLISHED',
    },
  ];

  const budgets = [
    // nec-cse budgets
    {
      id: 'budget-aura',
      clubId: 'nec-cse',
      category: 'EVENT_PRODUCTION',
      title: "AURA '25 Inter-Department Event",
      allocated: 2500000,
      fiscalYear: '2025–2026',
    },
    {
      id: 'budget-synectics',
      clubId: 'nec-cse',
      category: 'EVENT_PRODUCTION',
      title: "SYNECTICS '26 National Level Symposium",
      allocated: 7500000,
      fiscalYear: '2025–2026',
    },
    {
      id: 'budget-hackathon',
      clubId: 'nec-cse',
      category: 'EVENT_PRODUCTION',
      title: '24H Flagship Hackathon',
      allocated: 15000000,
      fiscalYear: '2025–2026',
    },
    {
      id: 'budget-ops',
      clubId: 'nec-cse',
      category: 'SUPPLIES',
      title: 'CSE Association Annual Operations 2025-26',
      allocated: 30000000,
      fiscalYear: '2025–2026',
    },
    // skyline budgets
    {
      id: 'budget-events',
      clubId: 'skyline',
      category: 'EVENT_PRODUCTION',
      title: 'Events & experiences',
      allocated: 1500000,
      fiscalYear: '2026–2027',
    },
    {
      id: 'budget-supplies',
      clubId: 'skyline',
      category: 'SUPPLIES',
      title: 'Fundraiser supplies',
      allocated: 400000,
      fiscalYear: '2026–2027',
    },
    {
      id: 'budget-marketing',
      clubId: 'skyline',
      category: 'MARKETING',
      title: 'Community & outreach',
      allocated: 500000,
      fiscalYear: '2026–2027',
    },
  ];

  // Expenses with varied disbursement methods (not Razorpay alone)
  const expenses = [
    // nec-cse expenses
    {
      id: 'EXP-NEC-1001',
      clubId: 'nec-cse',
      userId: 'volunteer',
      title: 'Stage sound system, LED backdrops & mementos for AURA 25',
      merchant: 'Erode Sound & Stage Rentals',
      purchaseDate: '2025-11-05',
      category: 'EVENT_PRODUCTION',
      amount: 1245000,
      purpose: 'Stage sound system, LED backdrops & mementos for AURA 25',
      budgetId: 'budget-aura',
      eventId: 'aura-25',
      receipt: '/receipt-demo.svg',
      disbursementMethod: 'UNIVERSITY_CASH_VOUCHER',
      status: 'DISBURSED',
      history: [
        { status: 'SUBMITTED', at: at(-151) },
        { status: 'TREASURER_APPROVED', at: at(-150.5) },
        { status: 'INCHARGE_APPROVED', at: at(-150.2) },
        { status: 'DISBURSED', at: at(-150) },
      ],
    },
    {
      id: 'EXP-NEC-1002',
      clubId: 'nec-cse',
      userId: 'lead',
      title: 'ShellKode Industry Keynote speakers honorarium & accommodation',
      merchant: 'ShellKode Delegate Coordination',
      purchaseDate: '2026-02-19',
      category: 'EVENT_PRODUCTION',
      amount: 1850000,
      purpose: 'Industry expert keynotes and ShellKode technical mentoring sessions.',
      budgetId: 'budget-synectics',
      eventId: 'synectics-26',
      receipt: '/receipt-demo.svg',
      disbursementMethod: 'BANK_TRANSFER_NEFT',
      status: 'DISBURSED',
      history: [
        { status: 'SUBMITTED', at: at(-8) },
        { status: 'TREASURER_APPROVED', at: at(-7) },
        { status: 'INCHARGE_APPROVED', at: at(-6) },
        { status: 'DISBURSED', at: at(-5) },
      ],
    },
    {
      id: 'EXP-NEC-1003',
      clubId: 'nec-cse',
      userId: 'lead',
      title: 'Official Cash Prizes for SYNECTICS 26 (1st ₹5,000, 2nd ₹3,000, 3rd ₹2,000)',
      merchant: 'CSE Department Cash Prize Pool',
      purchaseDate: '2026-02-20',
      category: 'EVENT_PRODUCTION',
      amount: 1000000,
      purpose: 'Direct disbursement of symposium winner cash prizes.',
      budgetId: 'budget-synectics',
      eventId: 'synectics-26',
      receipt: '/receipt-demo.svg',
      disbursementMethod: 'DIRECT_UPI',
      status: 'DISBURSED',
      history: [
        { status: 'SUBMITTED', at: at(-4) },
        { status: 'TREASURER_APPROVED', at: at(-3) },
        { status: 'INCHARGE_APPROVED', at: at(-2.5) },
        { status: 'DISBURSED', at: at(-2) },
      ],
    },
    {
      id: 'EXP-NEC-1004',
      clubId: 'nec-cse',
      userId: 'secretary',
      title: 'Hackathon high-speed Wi-Fi router lease & power backup distribution',
      merchant: 'Nandha IT Infrastructure Cell',
      purchaseDate: '2026-04-10',
      category: 'EVENT_PRODUCTION',
      amount: 1420000,
      purpose: 'High-speed switches, cables, and uninterruptible power distribution for 24H Hackathon.',
      budgetId: 'budget-hackathon',
      eventId: 'hackathon-26',
      receipt: '/receipt-demo.svg',
      disbursementMethod: 'BANK_TRANSFER_NEFT',
      status: 'TREASURER_APPROVED',
      history: [
        { status: 'SUBMITTED', at: at(-2) },
        { status: 'TREASURER_APPROVED', at: at(-1) },
      ],
    },
    {
      id: 'EXP-NEC-1005',
      clubId: 'nec-cse',
      userId: 'grace',
      title: 'Team MATRIX official hoodies sample manufacturing and dye proofing',
      merchant: 'Tirupur Knitwear & Embroidery Works',
      purchaseDate: '2026-04-08',
      category: 'SUPPLIES',
      amount: 850000,
      purpose: 'Sample proofing of navy heavy-cotton hoodies with cyan embroidery.',
      budgetId: 'budget-ops',
      receipt: '/receipt-demo.svg',
      disbursementMethod: 'UNIVERSITY_CASH_VOUCHER',
      status: 'SUBMITTED',
      history: [{ status: 'SUBMITTED', at: at(-1) }],
    },
    // skyline expense
    {
      id: 'EXP-1001',
      clubId: 'skyline',
      userId: 'volunteer',
      title: 'Bake sale supplies',
      merchant: 'Campus Stationery',
      purchaseDate: '2026-10-09',
      category: 'SUPPLIES',
      amount: 320000,
      purpose: 'Cups, napkins, packaging and baking ingredients.',
      fundraiserId: 'bake',
      budgetId: 'budget-supplies',
      receipt: '/receipt-demo.svg',
      disbursementMethod: 'UNIVERSITY_CASH_VOUCHER',
      status: 'SUBMITTED',
      history: [{ status: 'SUBMITTED', at: at(-1) }],
    },
  ];

  const journal = [];
  const post = (
    id,
    description,
    amount,
    debit,
    credit,
    reference,
    referenceId,
    clubId = 'nec-cse',
    offset = -2,
  ) =>
    journal.push({
      id,
      number: id,
      clubId,
      description,
      at: at(offset),
      reference,
      referenceId,
      lines: [
        { account: debit, debit: amount, credit: 0 },
        { account: credit, debit: 0, credit: amount },
      ],
    });

  memberships.forEach((m, i) =>
    post(
      `JRN-${1001 + i}`,
      'Annual student membership dues',
      m.dues,
      '1010',
      '4010',
      'MEMBERSHIP',
      m.id,
      m.clubId,
      -20 + (i % 10),
    ),
  );

  tickets.forEach((t, i) =>
    post(`JRN-${1101 + i}`, `${t.code} event registration`, t.amount, '1010', '4020', 'TICKET', t.id, t.clubId),
  );

  post(
    'JRN-1201',
    'Team MATRIX Official Navy Hoodie sales',
    75000,
    '1010',
    '4030',
    'ORDER',
    'ORD-1001',
    'nec-cse',
    -4,
  );

  post(
    'JRN-1202',
    'Campus essentials tee',
    39900,
    '1010',
    '4030',
    'ORDER',
    'ORD-SKY-1001',
    'skyline',
    -4,
  );

  post(
    'JRN-1301',
    'ShellKode Industry Grant & Sponsorship',
    1250000,
    '1020',
    '4040',
    'FUNDRAISER',
    'matrix-innovate',
    'nec-cse',
    -3,
  );

  post(
    'JRN-1302',
    'Bake sale opening donations',
    1250000,
    '1010',
    '4040',
    'FUNDRAISER',
    'bake',
    'skyline',
    -3,
  );

  expenses
    .filter((e) => e.status === 'DISBURSED')
    .forEach((e, i) => {
      post(
        `JRN-200${1 + i}`,
        `${e.title} · payout`,
        e.amount,
        '5010',
        e.disbursementMethod === 'UNIVERSITY_CASH_VOUCHER' ? '1030' : '1010',
        'EXPENSE_PAYOUT',
        e.id,
        e.clubId,
        -2 + i,
      );
    });

  const revisions = announcements.map((a) => ({
    id: `${a.id}-r1`,
    announcementId: a.id,
    clubId: a.clubId,
    title: a.title,
    content: a.content,
    number: 1,
    at: a.publishedAt,
    authorId: a.authorId,
    hash: 'seed-verified-sha256',
  }));

  const deliveries = announcements.flatMap((a) =>
    users
      .filter((u) => u.email)
      .map((u) => ({
        id: `${a.id}-${u.id}`,
        clubId: a.clubId,
        announcementId: a.id,
        userId: u.id,
        status: 'DELIVERED',
      })),
  );

  return {
    version: 1,
    clock: base,
    sequence: 2000,
    session:
      typeof process !== 'undefined' && process.env?.VITEST
        ? { userId: 'visitor', clubId: 'skyline' }
        : { userId: 'incharge', clubId: 'nec-cse' },
    users,
    clubs,
    memberships,
    plans,
    events,
    tiers,
    tickets,
    products,
    variants,
    orders,
    fundraisers,
    tasks,
    shifts,
    announcements,
    revisions,
    deliveries,
    expenses,
    budgets,
    journal,
    readReceipts: [],
    payments: [],
    waitlist: [],
    audit: [],
    officerHistory: [],
    notifications: [
      {
        id: 'notice-1',
        clubId: 'nec-cse',
        userId: 'member',
        title: "Your SYNECTICS '26 ticket is confirmed",
        body: 'Find your QR code ticket in My tickets.',
        link: '/portal/tickets/TCK-SYNE-8801',
        read: false,
        at: at(-2),
      },
    ],
    failure: null,
  };
}
