import crypto from 'crypto';

/**
 * Registry of Active A/B Experiments for ClubSphere.
 * Follows the statistical rigor requirements of the ab-test-setup framework:
 * - Locked hypotheses
 * - Defined primary, secondary, and guardrail metrics
 * - Fixed traffic allocations
 * - Deterministic, non-peeking participant bucketing
 */
export const EXPERIMENT_REGISTRY = {
  EXP_MERCH_MEMBERSHIP_UPSELL: {
    key: 'EXP_MERCH_MEMBERSHIP_UPSELL',
    name: 'Merchandise Checkout Membership Upsell Bundle',
    status: 'ACTIVE',
    hypothesis: {
      observation: 'Non-member students who browse merchandise abandon checkout due to standard non-member pricing.',
      singleChange: 'Display an instant "Join Club for annual dues and save today on this order" bundle checkbox on cart checkout.',
      directionalExpectation: 'Increase cart-to-paid order conversion rate by at least 15% relative.',
      targetAudience: 'Non-member students initiating merchandise checkout',
      mde: '15% relative lift (from 12.0% baseline to 13.8%)',
      significanceLevel: 0.95,
      statisticalPower: 0.80,
    },
    metrics: {
      primary: 'cart_to_paid_conversion_rate',
      secondary: ['membership_acquisition_rate', 'average_order_value_cents'],
      guardrail: 'net_order_margin_cents',
    },
    variants: [
      { id: 'CONTROL', name: 'Standard Retail Checkout', weight: 50 },
      { id: 'TREATMENT', name: 'Instant Membership Bundle Upsell', weight: 50 },
    ],
  },

  EXP_EVENT_TICKET_TIMER: {
    key: 'EXP_EVENT_TICKET_TIMER',
    name: 'Event Ticket 10-Minute Urgency Hold Timer',
    status: 'ACTIVE',
    hypothesis: {
      observation: 'Students reserving high-demand event tickets abandon payment before the 10-minute hold expires.',
      singleChange: 'Display an active visual countdown timer with remaining seat stock banner.',
      directionalExpectation: 'Increase reserved-to-confirmed ticket conversion rate by at least 10% relative.',
      targetAudience: 'All students holding a RESERVED event ticket',
      mde: '10% relative lift',
      significanceLevel: 0.95,
      statisticalPower: 0.80,
    },
    metrics: {
      primary: 'ticket_confirmation_rate',
      secondary: ['time_to_payment_seconds'],
      guardrail: 'ticket_hold_abandonment_rate',
    },
    variants: [
      { id: 'CONTROL', name: 'Static Hold Notice', weight: 50 },
      { id: 'TREATMENT', name: 'Visual Countdown & Stock Urgency Banner', weight: 50 },
    ],
  },
};

/**
 * Deterministically assigns a user/session identifier to an experiment variant.
 * Uses SHA-256 hash modulo 100 to guarantee uniform, reproducible bucketing.
 *
 * @param {string} experimentKey
 * @param {string} participantId - User UUID or anonymous session ID
 * @returns {{ experimentKey: string, variant: string, assignedAt: string }}
 */
export function evaluateExperiment(experimentKey, participantId) {
  const experiment = EXPERIMENT_REGISTRY[experimentKey];
  if (!experiment || experiment.status !== 'ACTIVE') {
    return { experimentKey, variant: 'CONTROL', status: 'INACTIVE' };
  }

  if (!participantId) {
    return { experimentKey, variant: 'CONTROL', status: 'UNAUTHENTICATED_DEFAULT' };
  }

  // Hash participantId + experimentKey
  const hash = crypto
    .createHash('sha256')
    .update(`${experimentKey}:${participantId}`)
    .digest('hex');

  // Convert first 8 hex characters to integer modulo 100 (0 - 99)
  const bucket = parseInt(hash.substring(0, 8), 16) % 100;

  let cumulativeWeight = 0;
  for (const variant of experiment.variants) {
    cumulativeWeight += variant.weight;
    if (bucket < cumulativeWeight) {
      return {
        experimentKey,
        variant: variant.id,
        variantName: variant.name,
        bucket,
        status: 'ASSIGNED',
        assignedAt: new Date().toISOString(),
      };
    }
  }

  return { experimentKey, variant: 'CONTROL', status: 'FALLBACK' };
}
