import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { paymentService, demoService } from '../../services/serviceFactory.js';
import {
  Card,
  PageHeader,
  Button,
  Badge,
  Currency,
  Details,
  Notice,
  LinkButton,
  Empty,
} from '../../components/common/UI.jsx';
export default function Checkout() {
  const { data } = useApp(),
    { kind, id } = useParams(),
    { run, busy } = useAction(),
    [result, setResult] = useState(null),
    [tick, setTick] = useState(0);
  const record = (
    kind === 'ticket' ? data.tickets : kind === 'order' ? data.orders : data.memberships
  ).find((r) => r.id === id);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const [started] = useState(Date.now());
  if (!record)
    return (
      <Empty
        title="Checkout not found"
        action={<LinkButton to="/portal/dashboard">Back to workspace</LinkButton>}
      />
    );
  const plan = kind === 'membership' ? data.plans.find((p) => p.id === record.pendingPlan) : null;
  const amount = plan?.amount ?? record.amount;
  const remaining = record.reservedUntil
    ? Math.max(
        0,
        Math.ceil(
          (new Date(record.reservedUntil).getTime() - data.clock - (Date.now() - started)) / 1000,
        ),
      )
    : null;
  const destination =
    kind === 'ticket'
      ? `/portal/tickets/${id}`
      : kind === 'order'
        ? `/portal/orders/${id}`
        : '/portal/pass';
  async function pay(outcome) {
    if (remaining === 0) await demoService.advance(601000);
    const r = await run(() => paymentService.confirm({ kind, recordId: id, outcome }));
    if (r) setResult(r);
  }
  return (
    <div className="stack">
      <PageHeader
        title="A final step. Then you’re all set."
        description="Demo checkout · no real payment will be collected."
      />
      <div className="grid two">
        <Card title="Your checkout summary">
          <div className="card-body stack">
            <div className="metric-icon">
              <CreditCard size={20} />
            </div>
            <h2>
              {kind === 'membership'
                ? `${plan?.title || record.tier} membership`
                : kind === 'ticket'
                  ? data.events.find((e) => e.id === record.eventId)?.title
                  : 'Your campus essentials'}
            </h2>
            <Details
              items={[
                ['Reference', <span className="mono">{id}</span>],
                ['Account', data.user.name],
                ['Club', data.club.name],
                ['Total', <Currency amount={amount} />],
              ]}
            />
            {remaining !== null && (
              <Notice tone="warning">
                <span className="row">
                  <Clock size={16} />
                  Reservation remaining:{' '}
                  <strong className="mono">
                    {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
                  </strong>
                </span>
                Once expired, a delayed confirmation is refunded in the demo.
              </Notice>
            )}
          </div>
        </Card>
        <Card title="Simulate payment">
          <div className="card-body stack">
            <Notice>
              <ShieldCheck size={16} style={{ verticalAlign: 'middle' }} /> This payment sandbox
              updates shared demo records only. Never enter real card information.
            </Notice>
            {result && (
              <Notice tone={result.status === 'SUCCEEDED' ? '' : 'warning'}>
                <Badge value={result.status} />
                <p>{result.message}</p>
              </Notice>
            )}
            <Button
              primary
              disabled={
                busy || result?.status === 'SUCCEEDED' || result?.status === 'LATE_REFUNDED'
              }
              onClick={() => pay('success')}
            >
              Simulate successful payment
            </Button>
            <Button disabled={busy} onClick={() => pay('failed')}>
              Simulate failed payment
            </Button>
            <Button disabled={busy} onClick={() => pay('cancelled')}>
              Simulate cancelled payment
            </Button>
            {kind !== 'membership' && (
              <Button disabled={busy} onClick={() => pay('delayed')}>
                Simulate delayed confirmation
              </Button>
            )}
            {result?.status === 'SUCCEEDED' && (
              <LinkButton primary to={destination}>
                {kind === 'ticket'
                  ? 'View ticket'
                  : kind === 'order'
                    ? 'View order'
                    : 'View member pass'}
              </LinkButton>
            )}
            <LinkButton to="/portal/dashboard">Return to workspace</LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
