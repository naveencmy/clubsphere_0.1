import { useApp } from '../../app/providers/AppProvider.jsx';
import {
  Card,
  Metric,
  Currency,
  LinkButton,
  Badge,
  Progress,
} from '../../components/common/UI.jsx';
import { Wallet, Receipt, Users } from 'lucide-react';
export default function PresidentOverview() {
  const { data } = useApp(),
    root = `/dashboard/${data.club.slug}`,
    pending = data.expenses.filter((e) => e.status === 'TREASURER_APPROVED' && e.amount >= 250000);
  return (
    <>
      <div className="grid three">
        <Metric
          label="Operating cash"
          value={<Currency amount={data.financial.cash} />}
          icon={Wallet}
        />
        <Metric label="Awaiting your final approval" value={pending.length} icon={Receipt} />
        <Metric
          label="Renewal attention"
          value={
            data.memberships.filter((m) =>
              ['RENEWAL_DUE', 'GRACE_PERIOD', 'EXPIRED'].includes(m.status),
            ).length
          }
          icon={Users}
        />
      </div>
      <div className="grid two">
        <Card
          title="President approval desk"
          action={<LinkButton to={`${root}/approvals`}>Review approvals</LinkButton>}
        >
          <div className="card-body stack small">
            {pending.length ? (
              pending.map((e) => (
                <div className="row between" key={e.id}>
                  <LinkButton to={`${root}/expenses/${e.id}`}>{e.title}</LinkButton>
                  <Currency amount={e.amount} />
                </div>
              ))
            ) : (
              <p className="muted">No claims currently need your final approval.</p>
            )}
          </div>
        </Card>
        <Card
          title="Budget health"
          action={<LinkButton to={`${root}/budgets`}>Budget settings</LinkButton>}
        >
          <div className="card-body stack">
            {data.budgets.map((b) => {
              const ratio = (data.budgetUsage[b.id] / b.allocated) * 100;
              return (
                <div className="stack small" key={b.id}>
                  <div className="row between">
                    <span>{b.title}</span>
                    <Badge value={ratio >= 100 ? 'EXCEEDED' : ratio >= 80 ? 'WARNING' : 'NORMAL'} />
                  </div>
                  <Progress value={ratio} />
                </div>
              );
            })}
            <LinkButton to={`${root}/roles`}>Officer directory & annual handover</LinkButton>
          </div>
        </Card>
      </div>
    </>
  );
}
