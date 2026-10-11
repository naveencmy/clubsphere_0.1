import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Zap,
  Gift,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Currency } from '../common/UI.jsx';
import JellyRadio from './JellyRadio.jsx';
import './Pricing13.css';

export default function Pricing13({
  plans = [],
  currentMembership = null,
  onSelectPlan,
  busy = false,
  title = 'Choose your membership plan',
  subtitle = 'Unlock member ticket discounts, exclusive technical workshops, and official digital campus credentials.',
  className = '',
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(
    () => currentMembership?.tier === 'PREMIUM' ? (plans.find((p) => p.tier === 'PREMIUM')?.id || plans[0]?.id) : plans[0]?.id
  );
  const [billingCycle, setBillingCycle] = useState('annual');

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  // Pricing calculation based on billing cycle (annual vs 2-year multi-year)
  const multiplier = billingCycle === 'multiyear' ? 1.75 : 1;
  const cycleLabel = billingCycle === 'multiyear' ? 'for 2 years' : '/ year';
  const planAmount = selectedPlan ? Math.round(selectedPlan.amount * multiplier) : 50000;

  const estimatedSavings = selectedPlan?.tier === 'PREMIUM' ? '₹2,400+' : '₹1,200+';

  const planPerks = {
    STANDARD: [
      'Official verified Digital Campus QR Pass',
      'Up to 40% discount on all club workshops & events',
      'Exclusive access to semester hackathons & symposia',
      'Priority notifications for limited-capacity guest lectures',
      'Eligible for general committee volunteering',
    ],
    PREMIUM: [
      'All Standard Plan member benefits included',
      'Fast-track priority registration for 24H Hackathons',
      'Official Matrix Symposium delegate kit & lanyard',
      '15% automatic discount on all merchandise store drops',
      '1-on-1 industry mentor session at flagship conferences',
      'Executive committee leadership voting eligibility',
    ],
  };

  return (
    <div className={`pricing-13-section ${className}`}>
      <div className="pricing-13-header">
        <span className="pricing-13-eyebrow">
          <Sparkles size={15} />
          Campus Membership Plans
        </span>
        <h2 className="pricing-13-title">{title}</h2>
        <p className="pricing-13-subtitle">{subtitle}</p>

        <div className="pricing-13-toggle-wrap">
          <JellyRadio
            items={[
              { value: 'annual', label: 'Annual Dues (1 Year)' },
              { value: 'multiyear', label: '2-Year Pass (Save 15%)' },
            ]}
            value={billingCycle}
            onChange={(val) => setBillingCycle(val)}
            size="md"
            chipColor="#f1f5f9"
            activeColor="#0284c7"
            textColor="#475569"
            activeTextColor="#ffffff"
          />
        </div>
      </div>

      <div className="pricing-13-grid">
        {/* Left Column: Plan Picker */}
        <div className="pricing-13-plans" role="radiogroup" aria-label="Membership options">
          {plans.map((p) => {
            const isSelected = p.id === selectedPlanId;
            const isPremium = p.tier === 'PREMIUM';
            const price = Math.round(p.amount * multiplier);

            return (
              <div
                key={p.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                className={`pricing-13-plan-item ${isSelected ? 'pricing-13-plan-item--active' : ''}`}
                onClick={() => setSelectedPlanId(p.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') setSelectedPlanId(p.id);
                }}
              >
                <div className="pricing-13-plan-top">
                  <span
                    className={`pricing-13-plan-badge ${
                      isPremium ? 'pricing-13-plan-badge--popular' : ''
                    }`}
                  >
                    {isPremium ? '★ Most Popular' : 'Essential'}
                  </span>
                  <span className="caption muted">{isPremium ? 'Recommended' : 'All-Access'}</span>
                </div>

                <h3 className="pricing-13-plan-name">{p.title}</h3>
                <p className="pricing-13-plan-desc">
                  {isPremium
                    ? 'Full VIP access with hackathon priority, merchandise perks, and mentoring.'
                    : 'Everything you need to participate, save on tickets, and connect on campus.'}
                </p>

                <div className="pricing-13-plan-price-row">
                  <span className="pricing-13-plan-amount">
                    <Currency amount={price} />
                  </span>
                  <span className="pricing-13-plan-period">{cycleLabel}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Detail Panel */}
        <div className="pricing-13-detail-panel">
          <AnimatePresence mode="wait">
            {selectedPlan && (
              <motion.div
                key={`${selectedPlan.id}-${billingCycle}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div className="pricing-13-panel-header">
                  <div className="pricing-13-panel-title-wrap">
                    <span className="pricing-13-panel-tier">
                      {selectedPlan.tier} PLAN BREAKDOWN
                    </span>
                    <h3 className="pricing-13-panel-title">{selectedPlan.title}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                      <Currency amount={planAmount} />
                    </div>
                    <span className="caption muted">{cycleLabel}</span>
                  </div>
                </div>

                <div className="pricing-13-savings-banner">
                  <Zap size={18} />
                  <span>
                    Estimated Student Annual Savings: <strong>{estimatedSavings}</strong> on tickets & gear
                  </span>
                </div>

                <h4 className="pricing-13-features-title">What's included with this pass:</h4>
                <ul className="pricing-13-features-list">
                  {(planPerks[selectedPlan.tier] || selectedPlan.benefits || []).map((feat, i) => (
                    <li key={i} className="pricing-13-feature-item">
                      <span className="pricing-13-feature-icon">
                        <Check size={14} />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pricing-13-panel-footer">
                  <button
                    type="button"
                    className="pricing-13-cta-btn"
                    disabled={busy}
                    onClick={() => onSelectPlan?.(selectedPlan.id, billingCycle)}
                  >
                    <CreditCard size={18} />
                    {currentMembership
                      ? `Switch to ${selectedPlan.title}`
                      : `Join ${selectedPlan.title}`}
                    <ArrowRight size={16} />
                  </button>

                  <div className="pricing-13-guarantee">
                    <ShieldCheck size={16} color="#059669" />
                    <span>Instant activation · Official college student association credit</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
