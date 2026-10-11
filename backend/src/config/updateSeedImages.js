import { query } from './db.js';

async function updateSeedImages() {
  console.log('Seeding real event and merchandise images into PostgreSQL...');

  // 1. Ensure events table has image_url
  await query('ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;');

  // 2. Update real events with poster images
  await query(`UPDATE events SET image_url = '/images/events/aura-25.png' WHERE slug = 'aura-25';`);
  await query(`UPDATE events SET image_url = '/images/events/synectics-26.jpg' WHERE slug = 'synectics-26';`);
  await query(`UPDATE events SET image_url = '/images/events/hackathon-2026.jpg' WHERE slug = '24h-hackathon-2026';`);

  // 3. Update Team MATRIX Hoodie and Badge with real photos
  await query(`UPDATE products SET image_urls = ARRAY['/images/products/team-matrix-hoodie.jpg'] WHERE slug = 'team-matrix-official-navy-hoodie';`);
  await query(`UPDATE products SET image_urls = ARRAY['/images/products/team-matrix-badge.png'] WHERE slug = 'team-matrix-acrylic-tech-badge';`);

  // 4. Upsert Team MATRIX Polo T-Shirt with polo photo
  const poloId = '70000000-0000-0000-0000-000000000003';
  const clubId = 'c0000000-0000-0000-0000-000000000001';
  await query(`
    INSERT INTO products (id, club_id, title, slug, description, image_urls, is_published)
    VALUES (
      $1,
      $2,
      'Team MATRIX Official Navy Polo T-Shirt',
      'team-matrix-official-navy-polo',
      'Official Department of Computer Science & Engineering breathable pique cotton Navy Blue Polo T-shirt featuring cyan double collar and sleeve stripes, and embroidered Team MATRIX wings shield emblem on the chest.',
      ARRAY['/images/products/team-matrix-polo.png'],
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      image_urls = EXCLUDED.image_urls,
      is_published = TRUE;
  `, [poloId, clubId]);

  // 5. Upsert Polo T-Shirt variants
  const poloVariants = [
    { id: '80000000-0000-0000-0000-000000000011', sku: 'POLO-NAVY-S', title: 'Size Small (S)', size: 'S' },
    { id: '80000000-0000-0000-0000-000000000012', sku: 'POLO-NAVY-M', title: 'Size Medium (M)', size: 'M' },
    { id: '80000000-0000-0000-0000-000000000013', sku: 'POLO-NAVY-L', title: 'Size Large (L)', size: 'L' },
    { id: '80000000-0000-0000-0000-000000000014', sku: 'POLO-NAVY-XL', title: 'Size Extra Large (XL)', size: 'XL' }
  ];

  for (const pv of poloVariants) {
    await query(`
      INSERT INTO product_variants (id, product_id, title, sku, member_price_cents, non_member_price_cents, available_stock, reserved_stock, attributes_json)
      VALUES ($1, $2, $3, $4, 45000, 55000, 50, 0, $5)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        sku = EXCLUDED.sku,
        member_price_cents = EXCLUDED.member_price_cents,
        non_member_price_cents = EXCLUDED.non_member_price_cents,
        available_stock = EXCLUDED.available_stock,
        attributes_json = EXCLUDED.attributes_json;
    `, [pv.id, poloId, pv.title, pv.sku, JSON.stringify({ size: pv.size, color: 'Navy Blue & Cyan' })]);
  }

  console.log('✅ Events and merchandise seeded successfully with all 5 uploaded images!');
  process.exit(0);
}

updateSeedImages().catch((err) => {
  console.error('Error seeding images:', err);
  process.exit(1);
});
