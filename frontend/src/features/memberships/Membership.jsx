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
                <p className="caption">Valid until {date(m.validUntil)}</p>
              </div>
              {valid ? (
                <QRDisplay code={m.passCode} />
              ) : (
                <div className="qr" style={{ color: 'var(--slate-900)' }}>
                  Pass unavailable
                </div>
              )}
            </div>
            <span className="caption mono">{m.id} · Demo identity pass</span>
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
                  ['Valid from', date(m.validFrom)],
                  ['Renews on', date(m.validUntil)],
                ]}
              />
              <LinkButton primary to="/portal/renew">
                Renew membership <ArrowRight size={16} />
              </LinkButton>
              <Notice>
                The QR identity rotates every 30 seconds and expires after 60 seconds. Verification
                is a local demo, not a secure production pass.
              </Notice>
            </div>
          </Card>
        </div>
      )}
      {(!pass || !m) && (
        <>
          <div className="section-title">
            <div>
              <h2>{renew ? 'Choose your renewal plan' : 'More campus. More possibility.'}</h2>
              <p>Member ticket prices, club essentials and a community that has your back.</p>
            </div>
          </div>
          <div className="grid two">
            {data.plans.map((p) => (
              <Card key={p.id}>
                <div className="card-body stack">
                  <div className="row between">
                    <h2>{p.title}</h2>
                    <Badge tone={p.tier === 'PREMIUM' ? 'info' : ''}>Annual membership</Badge>
                  </div>
                  <h2>
                    <Currency amount={p.amount} />
                    <span className="caption muted"> / year</span>
                  </h2>
                  <div className="stack small">
                    {p.benefits.map((b) => (
                      <div className="row" key={b}>
                        <Check size={16} />
                        {b}
                      </div>
                    ))}
                  </div>
                  <Button
                    primary={p.tier === 'STANDARD'}
                    disabled={busy}
                    onClick={() => start(p.id)}
                  >
                    {renew ? 'Renew' : m ? 'Change plan' : 'Join'} {p.title}
                    <CreditCard size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Notice>
            Checkout uses clearly labeled demo payments. No real payment is collected.
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
              empty="No new demo payments yet"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
