import { query } from './db.js';

async function seedRevisions() {
  const announcements = [
    {
      id: '90000000-0000-0000-0000-000000000001',
      title: "SYNECTICS '26 - GenAI Spark: Call for Registrations!",
      content: "Department of Computer Science and Engineering proudly presents SYNECTICS '26 in collaboration with ShellKode. Mini-hackathon style contest with exciting cash prizes (1st ₹5,000, 2nd ₹3,000, 3rd ₹2,000) and internship offers. Register before Feb 20, 2026.",
      authorId: '10000000-0000-0000-0000-000000000001',
      hash: '84d7ae4affc2b859eb93824473b76b163ce6f57564d2b0aa07d189473ab22d1d',
    },
    {
      id: '90000000-0000-0000-0000-000000000002',
      title: '24H Hackathon: Code. Build. Dominate - Problem Statements Released',
      content: 'Problem statements across Smart Cities, HealthTech, AgriTech, FinTech, and Open Innovation are now live. Submit PPT before March 30 for Round 1 selection. Contact Student Secretary N. Deepsika (93458 03946).',
      authorId: '10000000-0000-0000-0000-000000000005',
      hash: '56e40d9ac0fed89b074204bb2e88e030f3ca12021d9f56e04d010187443bd309',
    },
    {
      id: '90000000-0000-0000-0000-000000000003',
      title: "AURA '25 Inter-Department Results & Certificate Distribution",
      content: 'Congratulations to all winners of Brain Busters and Fun Fusion! Digital certificates have been dispatched to all participants. Student Coordinators M. Kavikumar & S. Balahariharan thank all department heads for their support.',
      authorId: '10000000-0000-0000-0000-000000000002',
      hash: '2e07c751c11481a2fe28d8717085935902dc5fbd84d628a8506ad4a9db304a6a',
    },
  ];

  for (const an of announcements) {
    const revId = `80000000-0000-0000-0000-00000000000${an.id.slice(-1)}`;
    await query(
      `INSERT INTO announcement_revisions (id, announcement_id, edited_by_user_id, title, content_markdown, revision_hash, revision_number, edited_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content_markdown = EXCLUDED.content_markdown,
         revision_hash = EXCLUDED.revision_hash;`,
      [revId, an.id, an.authorId, an.title, an.content, an.hash]
    );
  }

  const check = await query(
    `SELECT ar.*, u.name as editor_name 
     FROM announcement_revisions ar 
     JOIN users u ON ar.edited_by_user_id = u.id`
  );
  console.log(`Successfully verified ${check.rows.length} announcement revisions:`);
  console.log(check.rows);
  process.exit(0);
}

seedRevisions().catch((err) => {
  console.error(err);
  process.exit(1);
});
