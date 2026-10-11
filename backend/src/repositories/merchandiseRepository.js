import { query } from '../config/db.js';

export class MerchandiseRepository {
  static async findCatalogByClub(clubId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT p.id as product_id, p.club_id, p.title as product_title, p.slug as product_slug,
              p.description, p.image_urls, p.is_published, p.category, p.visual,
              pv.id as variant_id, pv.sku, pv.title as variant_title, pv.attributes_json,
              pv.available_stock, pv.reserved_stock,
              (pv.available_stock - pv.reserved_stock) as purchasable_stock,
              pv.non_member_price_cents, pv.member_price_cents
       FROM products p
       LEFT JOIN product_variants pv ON p.id = pv.product_id
       WHERE p.club_id = $1 AND p.is_published = true
       ORDER BY p.created_at DESC, pv.title ASC;`,
      [clubId]
    );
    return res.rows;
  }

  static async findVariantById(variantId, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `SELECT pv.*, p.club_id, p.title as product_title
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       WHERE pv.id = $1 LIMIT 1;`,
      [variantId]
    );
    return res.rows[0] || null;
  }

  /**
   * Acquire a pessimistic row-level lock on the variant for atomic checkout.
   */
  static async findVariantByIdForUpdate(variantId, client) {
    const res = await client.query(
      `SELECT pv.id, pv.product_id, pv.sku, pv.title, pv.attributes_json,
              pv.available_stock, pv.reserved_stock,
              (pv.available_stock - pv.reserved_stock) as purchasable_stock,
              pv.non_member_price_cents, pv.member_price_cents
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       WHERE pv.id = $1 AND p.is_published = true
       FOR UPDATE;`,
      [variantId]
    );
    return res.rows[0] || null;
  }

  static async incrementReservedStock(variantId, quantity, client) {
    const res = await client.query(
      `UPDATE product_variants
       SET reserved_stock = reserved_stock + $1, updated_at = NOW()
       WHERE id = $2 AND (available_stock - reserved_stock) >= $1
       RETURNING id, available_stock, reserved_stock;`,
      [quantity, variantId]
    );
    return res.rows[0] || null;
  }

  static async decrementReservedStock(variantId, quantity, client) {
    const res = await client.query(
      `UPDATE product_variants
       SET reserved_stock = GREATEST(0, reserved_stock - $1), updated_at = NOW()
       WHERE id = $2
       RETURNING id, available_stock, reserved_stock;`,
      [quantity, variantId]
    );
    return res.rows[0] || null;
  }

  static async settleStockPayment(variantId, quantity, client) {
    const res = await client.query(
      `UPDATE product_variants
       SET available_stock = available_stock - $1,
           reserved_stock = GREATEST(0, reserved_stock - $1),
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, available_stock, reserved_stock;`,
      [quantity, variantId]
    );
    return res.rows[0] || null;
  }

  static async restoreAvailableStock(variantId, quantity, client) {
    const res = await client.query(
      `UPDATE product_variants
       SET available_stock = available_stock + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, available_stock, reserved_stock;`,
      [quantity, variantId]
    );
    return res.rows[0] || null;
  }

  static async createOrder({ clubId, userId, orderNumber, status = 'PENDING', subtotalCents, discountCents = 0, totalCents, stripePaymentIntentId = null, shippingDetailsJson = null }, client) {
    const res = await client.query(
      `INSERT INTO orders (club_id, user_id, order_number, status, subtotal_cents, discount_cents, total_cents, stripe_payment_intent_id, shipping_details_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *, total_cents as total_amount_cents, order_number as pickup_code;`,
      [clubId, userId, orderNumber, status, subtotalCents, discountCents, totalCents, stripePaymentIntentId, shippingDetailsJson]
    );
    return res.rows[0];
  }

  static async createOrderItem({ orderId, variantId, quantity, unitPriceCents, totalPriceCents }, client) {
    const res = await client.query(
      `INSERT INTO order_items (order_id, variant_id, quantity, unit_price_cents, total_price_cents)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *, variant_id as product_variant_id;`,
      [orderId, variantId, quantity, unitPriceCents, totalPriceCents]
    );
    return res.rows[0];
  }

  static async findOrderById(orderId, client = null) {
    const runner = client || { query };
    const orderRes = await runner.query(
      `SELECT o.*, o.total_cents as total_amount_cents, o.order_number as pickup_code,
              u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 LIMIT 1;`,
      [orderId]
    );

    if (orderRes.rowCount === 0) return null;
    const order = orderRes.rows[0];

    const itemsRes = await runner.query(
      `SELECT oi.*, oi.variant_id as product_variant_id,
              pv.sku, pv.title as variant_title, pv.attributes_json, p.title as product_title
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = $1;`,
      [orderId]
    );

    order.items = itemsRes.rows;
    return order;
  }

  static async updateOrderStatus(orderId, status, client = null) {
    const runner = client || { query };
    const res = await runner.query(
      `UPDATE orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *, total_cents as total_amount_cents, order_number as pickup_code;`,
      [status, orderId]
    );
    return res.rows[0] || null;
  }
}
