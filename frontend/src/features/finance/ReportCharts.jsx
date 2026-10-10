import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, Table, Currency } from '../../components/common/UI.jsx';
import { currency } from '../../utils/format.js';
function Chart({ label, rows, x, series }) {
  return (
    <div className="chart" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
          <XAxis dataKey={x} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => currency(Math.round(v * 100))} />
          <Legend />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={i ? 'var(--slate-700)' : 'var(--slate-500)'}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export default function ReportCharts({ data }) {
  const monthly = {};
  for (const j of data.journal) {
    const month = j.at.slice(0, 7);
    monthly[month] ??= { month, received: 0, paid: 0 };
    for (const l of j.lines)
      if (['1010', '1020', '1030'].includes(l.account)) {
        monthly[month].received += l.debit / 100;
        monthly[month].paid += l.credit / 100;
      }
  }
  const events = data.events
    .map((e) => ({
      name: e.title,
      revenue: data.journal
        .filter(
          (j) =>
            j.reference === 'TICKET' &&
            data.tickets.some((t) => t.id === j.referenceId && t.eventId === e.id),
        )
        .flatMap((j) => j.lines)
        .filter((l) => l.account === '4020')
        .reduce((a, l) => a + l.credit - l.debit, 0),
      cost: data.expenses
        .filter(
          (c) =>
            c.eventId === e.id &&
            (['PRESIDENT_APPROVED', 'DISBURSED'].includes(c.status) ||
              (c.status === 'TREASURER_APPROVED' && c.amount < 250000)),
        )
        .reduce((a, c) => a + c.amount, 0),
    }))
    .map((e) => ({ ...e, income: e.revenue / 100, expense: e.cost / 100 }));
  const budgets = data.budgets.map((b) => ({
    name: b.title,
    allocated: b.allocated / 100,
    committed: data.budgetUsage[b.id] / 100,
  }));
  return (
    <>
      <div className="grid two">
        <Card title="Monthly cash transactions">
          <div className="card-body">
            <Chart
              label="Monthly actual cash receipts and cash disbursements"
              rows={Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month))}
              x="month"
              series={[
                { key: 'received', name: 'Cash received (INR)' },
                { key: 'paid', name: 'Cash paid (INR)' },
              ]}
            />
          </div>
        </Card>
        <Card title="Budget consumption">
          <div className="card-body">
            <Chart
              label="Allocated and committed budget amounts"
              rows={budgets}
              x="name"
              series={[
                { key: 'allocated', name: 'Allocated (INR)' },
                { key: 'committed', name: 'Committed (INR)' },
              ]}
            />
          </div>
        </Card>
      </div>
      <Card title="Event performance">
        <div className="card-body stack">
          <Chart
            label="Event ticket revenue and finally approved event expenses"
            rows={events}
            x="name"
            series={[
              { key: 'income', name: 'Revenue (INR)' },
              { key: 'expense', name: 'Expenses (INR)' },
            ]}
          />
          <Table
            rows={events}
            rowKey="name"
            columns={[
              { key: 'name', title: 'Event' },
              {
                key: 'revenue',
                title: 'Net ticket revenue',
                align: 'number',
                render: (e) => <Currency amount={e.revenue} />,
              },
              {
                key: 'cost',
                title: 'Recognized expenses',
                align: 'number',
                render: (e) => <Currency amount={e.cost} />,
              },
              {
                key: 'surplus',
                title: 'Event surplus',
                align: 'number',
                render: (e) => <Currency amount={e.revenue - e.cost} />,
              },
            ]}
          />
        </div>
      </Card>
    </>
  );
}
