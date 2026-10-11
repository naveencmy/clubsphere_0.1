import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, CreditCard, ArrowRight } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { membershipService } from '../../services/serviceFactory.js';
import { eligible } from '../../services/permissions.js';
import {
  Badge,
  Button,
  Card,
  Currency,
  PageHeader,
  Notice,
  LinkButton,
  Details,
  Table,
} from '../../components/common/UI.jsx';
import QRDisplay from '../../components/common/QRDisplay.jsx';
import Pricing13 from '../../components/ui/Pricing13.jsx';
import { date } from '../../utils/format.js';
export default function Membership() {
  const { data } = useApp(),
    { run, busy } = useAction(),
    location = useLocation(),
    navigate = useNavigate();
  const pass = location.pathname.endsWith('/pass'),
    renew = location.pathname.endsWith('/renew');
  const [selected, setSelected] = useState(data.plans[0]?.id);
  const m = data.membership,
    valid = eligible(m, data.clock);
  async function start(planId) {
    if (data.role === 'VISITOR') {
      navigate('/login');
      return;
    }
    const r = await run(() => membershipService.start(planId));
    if (r) navigate(`/checkout/membership/${r.id}`);
  }
  return (
    <div className="stack">
      <PageHeader
        title={
          pass
            ? 'Your digital member pass'
            : renew
              ? 'Keep your community close.'
              : m
                ? 'Your membership'
                : 'A place to belong.'
        }
        description={
          pass
            ? 'One pass. Your membership, ready whenever you are.'
            : `Membership in ${data.club.name}`
        }
      />
      {m?.status === 'GRACE_PERIOD' && (
        <Notice tone="warning">
          Your dues have lapsed. You retain member prices during the 14-day grace period. Renew to
          keep your pass and benefits.
        </Notice>
      )}
      {m && ['EXPIRED', 'REVOKED'].includes(m.status) && (
        <Notice tone="error">
          Your membership is {m.status.toLowerCase()}. Member discounts and pass verification are
          unavailable. Renew to restore eligibility.
        </Notice>
      )}
      {m && (
        <div className="grid two">
          <section className="membership-card stack">
            <div className="row between">
              <span className="eyebrow" style={{ color: 'var(--slate-300)' }}>
                CLUBSPHERE · MEMBER PASS
              </span>
              <Badge value={m.status} />
            </div>
            <div>
              <h2>{data.club.name}</h2>
              <p>{data.club.fiscalYear}</p>
            </div>
            <div className="row between">
              <div className="stack small">
                <h3>{data.user.name}</h3>
                <p className="mono">{data.user.studentId}</p>
                <Badge tone="info">{m.tier}</Badge>
                <p className="caption">Valid until {date(m.validUntil || m.valid_until || (data.clock + 365 * 86400000))}</p>
              </div>
              {valid ? (
                <QRDisplay code={m.passCode || m.qr_secret_token || `PASS-${m.id || data.user.id}`} />
              ) : (
                <div className="qr" style={{ color: 'var(--slate-900)' }}>
                  Pass unavailable
                </div>
              )}
            </div>
            <span className="caption mono">{m.id} · Official Campus Pass</span>
          </section>
          <Card>
            <div className="card-body stack">
              <h2>Your member benefits</h2>
              {(data.plans.find((p) => p.tier === m.tier)?.benefits || []).map((b) => (
                <div key={b} className="row">
                  <Check size={16} />
                  {b}
                </div>
              ))}
              <Details
                items={[
                  ['Membership status', <Badge value={m.status} />],
                  [
                    'Benefit eligibility',
                    valid ? 'Member prices enabled' : 'Standard prices apply',
                  ],
                  ['Valid from', date(m.validFrom || m.valid_from || (data.clock - 30 * 86400000))],
                  ['Renews on', date(m.validUntil || m.valid_until || (data.clock + 365 * 86400000))],
                ]}
              />
              <LinkButton primary to="/portal/renew">
                Renew membership <ArrowRight size={16} />
              </LinkButton>
              <Notice>
                The QR identity rotates dynamically with secure cryptographic timestamps for touchless campus entry.
              </Notice>
            </div>
          </Card>
        </div>
      )}
      {(!pass || !m) && (
        <>
          <Pricing13
            plans={data.plans}
            currentMembership={m}
            onSelectPlan={(planId) => start(planId)}
            busy={busy}
            title={renew ? 'Choose your renewal plan' : 'More campus. More possibility.'}
            subtitle="Member ticket prices, club essentials, and a student association community that has your back."
          />
          <Notice>
            Payments are processed via authorized college payment channels (Razorpay, Direct UPI, or University Cash Voucher).
          </Notice>
        </>
      )}
      {m && (
        <Card title="Membership payment history">
          <div className="card-body">
            <Table
              rows={data.payments.filter((p) => p.reference === 'MEMBERSHIP')}
              columns={[
                {
                  key: 'id',
                  title: 'Payment reference',
                  render: (r) => <span className="mono">{r.id}</span>,
                },
                { key: 'at', title: 'Date', render: (r) => date(r.at) },
                {
                  key: 'amount',
                  title: 'Amount',
                  align: 'number',
                  render: (r) => <Currency amount={r.amount} />,
                },
                { key: 'status', title: 'Status', render: (r) => <Badge value={r.status} /> },
              ]}
              empty="No payment records found"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
