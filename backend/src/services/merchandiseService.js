import { MerchandiseRepository } from '../repositories/merchandiseRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { LedgerRepository } from '../repositories/ledgerRepository.js';
import { withTransaction } from '../config/db.js';
import { generateReferenceCode } from '../utils/crypto.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

export class MerchandiseService {
  /**
   * Retrieves active products with variants and user-specific discount pricing.
   */
  static async getCatalog(clubId, userId = null) {
    const rawCatalog = await MerchandiseRepository.findCatalogByClub(clubId);

    // Determine if the user is eligible for member discounts (ACTIVE or GRACE_PERIOD)
    let isMemberEligible = false;
    let membershipStatus = 'NON_MEMBER';

    if (userId) {
      const membership = await MembershipRepository.findByClubAndUser(clubId, userId);
      if (membership && (membership.status === 'ACTIVE' || membership.status === 'GRACE_PERIOD')) {
        isMemberEligible = true;
        membershipStatus = membership.status;
      }
    }

    // Group variants under products
    const productsMap = new Map();

    for (const row of rawCatalog) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          clubId: row.club_id,
          title: row.product_title || row.title,
          slug: row.product_slug || row.slug,
          description: row.description,
          imageUrls: row.image_urls || [],
          variants: [],
        });
      }

      if (row.variant_id) {
        const effectivePriceCents = isMemberEligible
          ? row.member_price_cents
          : row.non_member_price_cents;
        const discountSavingsCents = Math.max(0, row.non_member_price_cents - row.member_price_cents);

        productsMap.get(row.product_id).variants.push({
          id: row.variant_id,
          sku: row.sku,
          title: row.variant_title || row.title,
          attributes: row.attributes_json || {},
          availableStock: row.available_stock,
          reservedStock: row.reserved_stock,
          purchasableStock: Math.max(0, row.purchasable_stock),
          nonMemberPriceCents: row.non_member_price_cents,
          memberPriceCents: row.member_price_cents,
          effectivePriceCents,
          discountSavingsCents,
          isMemberDiscountApplied: isMemberEligible,
        });
      }
    }

    return {
      membershipStatus,
      isMemberEligible,
      products: Array.from(productsMap.values()),
    };
  }

  /**
   * Two-phase atomic checkout reservation with pessimistic row locking.
   */
  static async reserveCheckout({ clubId, userId, items = [] }) {
    if (!items || items.length === 0) {
      throw new BadRequestError('Cart must contain at least one variant item.');
    }

    // Check membership eligibility for pricing
    let isMemberEligible = false;
    if (userId) {
      const membership = await MembershipRepository.findByClubAndUser(clubId, userId);
      if (membership && (membership.status === 'ACTIVE' || membership.status === 'GRACE_PERIOD')) {
        isMemberEligible = true;
      }
    }

    return withTransaction(async (client) => {
      let totalAmountCents = 0;
      const orderItemsToCreate = [];

      for (const item of items) {
        const { variantId, quantity = 1 } = item;
        if (quantity <= 0) throw new BadRequestError('Quantity must be greater than zero.');

        // Pessimistic row-level lock: SELECT ... FOR UPDATE
        const variant = await MerchandiseRepository.findVariantByIdForUpdate(variantId, client);
        if (!variant) {
          throw new NotFoundError(`Product variant '${variantId}' not found or inactive.`);
        }

        const purchasable = variant.available_stock - variant.reserved_stock;
        if (purchasable < quantity) {
          throw new ConflictError(
            `Insufficient stock for SKU '${variant.sku}' (${variant.title || variant.sku}). Requested: ${quantity}, Available: ${purchasable}`
          );
        }

        // Increment reserved_stock atomically
        await MerchandiseRepository.incrementReservedStock(variantId, quantity, client);

        const unitPriceCents = isMemberEligible ? variant.member_price_cents : variant.non_member_price_cents;
        const itemTotalCents = unitPriceCents * quantity;
        totalAmountCents += itemTotalCents;

        orderItemsToCreate.push({
          variantId,
          quantity,
          unitPriceCents,
          totalPriceCents: itemTotalCents,
        });
      }

      const orderNumber = generateReferenceCode('ORD');
      const order = await MerchandiseRepository.createOrder({
        clubId,
        userId,
        orderNumber,
        status: 'PENDING',
        subtotalCents: totalAmountCents,
        discountCents: 0,
        totalCents: totalAmountCents,
      }, client);

      for (const itemData of orderItemsToCreate) {
        await MerchandiseRepository.createOrderItem({
          orderId: order.id,
          ...itemData,
        }, client);
      }

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        pickupCode: order.order_number,
        status: order.status,
        totalCents: order.total_cents,
        totalAmountCents: order.total_cents,
        expiresInSeconds: 600, // 10-minute cart hold
      };
    }, clubId);
  }

  /**
   * Finalizes order settlement upon payment confirmation (e.g. Stripe Webhook).
   */
  static async handlePaymentSuccess(orderId, stripePaymentIntentId = null) {
    const order = await MerchandiseRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError(`Order '${orderId}' not found.`);
    }

    if (order.status === 'PAID') {
      return order; // Idempotent return
    }

    if (order.status !== 'PENDING') {
      throw new ConflictError(`Cannot pay for an order in status '${order.status}'.`);
    }

    return withTransaction(async (client) => {
      // 1. Settle stock permanently for each variant
      for (const item of order.items) {
        const variantId = item.variant_id || item.product_variant_id;
        await MerchandiseRepository.settleStockPayment(variantId, item.quantity, client);
      }

      // 2. Mark order as PAID
      const updatedOrder = await MerchandiseRepository.updateOrderStatus(orderId, 'PAID', client);

      // 3. Post double-entry journal entry: Debit 1020 Stripe, Credit 4030 Merchandise
      const stripeAccount = await LedgerRepository.findAccountByCode(order.club_id, '1020', client);
      const merchAccount = await LedgerRepository.findAccountByCode(order.club_id, '4030', client);
      const totalPaise = order.total_cents || order.total_amount_cents;

      if (stripeAccount && merchAccount && totalPaise > 0) {
        await LedgerRepository.createJournalEntry({
          clubId: order.club_id,
          description: `Merchandise Purchase - Order #${order.order_number || order.pickup_code}`,
          referenceType: 'MERCHANDISE_ORDER',
          referenceId: order.id,
          lines: [
            { accountId: stripeAccount.id, debitCents: totalPaise, creditCents: 0, description: 'Stripe Merchant Clearing' },
            { accountId: merchAccount.id, debitCents: 0, creditCents: totalPaise, description: 'Merchandise Apparel Revenue' },
          ],
        }, client);
      }

      return updatedOrder;
    }, order.club_id);
  }

  /**
   * Pre-fulfillment order cancellation (before pickup): restores stock and cancels order.
   */
  static async cancelOrderBeforePickup(orderId) {
    const order = await MerchandiseRepository.findOrderById(orderId);
    if (!order) throw new NotFoundError(`Order '${orderId}' not found.`);

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new ConflictError(`Order is already ${order.status}.`);
    }

    if (order.status === 'FULFILLED') {
      throw new BadRequestError('Fulfilled orders must use the return/inspection desk workflow.');
    }

    return withTransaction(async (client) => {
      const totalPaise = order.total_cents || order.total_amount_cents;

      if (order.status === 'PAID') {
        // Restore available stock for all items
        for (const item of order.items) {
          const variantId = item.variant_id || item.product_variant_id;
          await MerchandiseRepository.restoreAvailableStock(variantId, item.quantity, client);
        }

        // Post reversing journal entry
        const stripeAccount = await LedgerRepository.findAccountByCode(order.club_id, '1020', client);
        const merchAccount = await LedgerRepository.findAccountByCode(order.club_id, '4030', client);
        if (stripeAccount && merchAccount && totalPaise > 0) {
          await LedgerRepository.createJournalEntry({
            clubId: order.club_id,
            description: `Order Cancellation Reversal - #${order.order_number || order.pickup_code}`,
            referenceType: 'ORDER_CANCELLATION',
            referenceId: order.id,
            lines: [
              { accountId: merchAccount.id, debitCents: totalPaise, creditCents: 0, description: 'Revenue Reversal' },
              { accountId: stripeAccount.id, debitCents: 0, creditCents: totalPaise, description: 'Stripe Refund Payout' },
            ],
          }, client);
        }
      } else if (order.status === 'PENDING') {
        // Unpaid reservation: release reserved_stock hold
        for (const item of order.items) {
          const variantId = item.variant_id || item.product_variant_id;
          await MerchandiseRepository.decrementReservedStock(variantId, item.quantity, client);
        }
      }

      return MerchandiseRepository.updateOrderStatus(orderId, 'CANCELLED', client);
    }, order.club_id);
  }

  /**
   * Post-fulfillment return & desk inspection workflow:
   * - condition 'SELLABLE': restores inventory, marks REFUNDED, reverses revenue
   * - condition 'DAMAGED': does NOT restore inventory, writes off loss to 5030, marks REFUNDED
   */
  static async returnMerchandiseOrder(orderId, { condition = 'SELLABLE' }) {
    const order = await MerchandiseRepository.findOrderById(orderId);
    if (!order) throw new NotFoundError(`Order '${orderId}' not found.`);

    if (order.status !== 'FULFILLED') {
      throw new BadRequestError(`Only FULFILLED orders can be processed for return. Current status: ${order.status}`);
    }

    return withTransaction(async (client) => {
      const stripeAccount = await LedgerRepository.findAccountByCode(order.club_id, '1020', client);
      const merchAccount = await LedgerRepository.findAccountByCode(order.club_id, '4030', client);
      const lossAccount = await LedgerRepository.findAccountByCode(order.club_id, '5030', client) 
        || await LedgerRepository.findAccountByCode(order.club_id, '5020', client);
      const totalPaise = order.total_cents || order.total_amount_cents;

      if (condition === 'SELLABLE') {
        // Restock inventory
        for (const item of order.items) {
          const variantId = item.variant_id || item.product_variant_id;
          await MerchandiseRepository.restoreAvailableStock(variantId, item.quantity, client);
        }

        // Reverse revenue
        if (stripeAccount && merchAccount && totalPaise > 0) {
          await LedgerRepository.createJournalEntry({
            clubId: order.club_id,
            description: `Customer Return (Sellable) - #${order.order_number || order.pickup_code}`,
            referenceType: 'MERCHANDISE_RETURN',
            referenceId: order.id,
            lines: [
              { accountId: merchAccount.id, debitCents: totalPaise, creditCents: 0, description: 'Revenue Reversal' },
              { accountId: stripeAccount.id, debitCents: 0, creditCents: totalPaise, description: 'Stripe Refund Payout' },
            ],
          }, client);
        }
      } else {
        // Damaged / Unsellable: Write-off to inventory loss, do NOT restock
        if (stripeAccount && lossAccount && totalPaise > 0) {
          await LedgerRepository.createJournalEntry({
            clubId: order.club_id,
            description: `Customer Return (Damaged Write-Off) - #${order.order_number || order.pickup_code}`,
            referenceType: 'INVENTORY_WRITE_OFF',
            referenceId: order.id,
            lines: [
              { accountId: lossAccount.id, debitCents: totalPaise, creditCents: 0, description: 'Damaged Inventory Loss' },
              { accountId: stripeAccount.id, debitCents: 0, creditCents: totalPaise, description: 'Stripe Refund Payout' },
            ],
          }, client);
        }
      }

      return MerchandiseRepository.updateOrderStatus(orderId, 'REFUNDED', client);
    }, order.club_id);
  }
}
