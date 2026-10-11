import ReportCharts from './ReportCharts.jsx';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, ArrowDownLeft, ArrowUpRight, Receipt, Download, Plus } from 'lucide-react';
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
import { useApp } from '../../app/providers/AppProvider.jsx';
import { financeService, fundraiserService } from '../../services/serviceFactory.js';
import {
  PageHeader,
  Card,
  Metric,
  Button,
  Currency,
  Badge,
  Table,
  Modal,
  Details,
  LinkButton,
  Notice,
  Progress,
  Confirm,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { currency, date, datetime, csv, download } from '../../utils/format.js';
function refLink(j, root) {
  return j.reference.startsWith('EXPENSE')
    ? `${root}/expenses/${j.referenceId}`
    : j.reference === 'TICKET'
      ? '/portal/tickets/' + j.referenceId
      : j.reference === 'ORDER'
        ? `${root}/orders/${j.referenceId}`
        : j.reference === 'MEMBERSHIP'
          ? `${root}/members/${j.referenceId}`
          : j.reference === 'FUNDRAISER'
            ? `${root}/fundraisers`
            : null;
}
export function exportLedger(data) {
  const rows = [
    [
      'Date/time',
      'Entry number',
      'Description',
      'Reference type',
      'Reference ID',
      'Account',
      'Debit (paise)',
      'Credit (paise)',
    ],
    ...data.journal.flatMap((j) =>
      j.lines.map((l) => [
        j.at,
        j.number,
        j.description,
        j.reference,
        j.referenceId,
        l.account,
        l.debit,
        l.credit,
      ]),
    ),
  ];
  download('clubsphere-ledger.csv', csv(rows));
}
export default function Finance({ dashboard = false }) {
  const { data, toast } = useApp(),
    location = useLocation();
  const [search, setSearch] = useState(''),
    [account, setAccount] = useState('ALL'),
    [direction, setDirection] = useState('ALL'),
    [source, setSource] = useState('ALL'),
    [from, setFrom] = useState(''),
    [until, setUntil] = useState(''),
    [selected, setSelected] = useState(null),
    [detail, setDetail] = useState(null),
    [adjust, setAdjust] = useState(false),
    [reverse, setReverse] = useState(null);
  const f = data.financial,
    root = `/dashboard/${data.club.slug}`,
    ledger = location.pathname.endsWith('/ledger'),
    reports = location.pathname.endsWith('/reports');
  if (!f)
    return (
      <Notice tone="error">
        Financial reporting is restricted to the Treasurer, Association In-charge and read-only
        Auditor.
      </Notice>
    );
  const rows = data.journal
    .flatMap((j) => j.lines.map((l, i) => ({ ...j, ...l, rowId: `${j.id}-${i}` })))
    .filter(
      (r) =>
        `${r.number} ${r.description} ${r.reference}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (account === 'ALL' || r.account === account) &&
        (direction === 'ALL' ||
          (direction === 'INCOME' && r.account.startsWith('4')) ||
          (direction === 'EXPENSE' && r.account.startsWith('5'))) &&
        (source === 'ALL' || r.reference === source) &&
        (!from || new Date(r.at) >= new Date(from)) &&
        (!until || new Date(r.at) < new Date(until + 'T23:59:59')),
    );
  const months = {};
  for (const j of data.journal) {
    const month = new Date(j.at).toLocaleString('en-IN', {
      month: 'short',
      year: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
    months[month] ??= { month, income: 0, expense: 0 };
    for (const l of j.lines) {
      if (l.account.startsWith('4')) months[month].income += (l.credit - l.debit) / 100;
      if (l.account.startsWith('5')) months[month].expense += (l.debit - l.credit) / 100;
    }
  }
  const trend = Object.values(months),
    sources = f.sources.map((s) => ({ ...s, value: s.amount / 100 }));
  const accounts = [...new Set(data.journal.flatMap((j) => j.lines.map((l) => l.account)))];
  return (
    <div className="stack">
      <PageHeader
        title={
          ledger
            ? 'Every entry. A clear record.'
            : reports
              ? 'The story behind the numbers.'
              : dashboard && data.role === 'AUDITOR'
                ? 'A transparent view of club finances.'
                : 'Your finances, in perspective.'
        }
        description={
          ledger
            ? 'Balanced entries, linked sources and an accountable history.'
            : `${data.club.name} · What came in, what went out, and how much is left.`
        }
      >
        <Button onClick={() => exportLedger(data)}>
          <Download size={16} />
          Export ledger CSV
        </Button>
        {data.role === 'TREASURER' && (
          <Button primary onClick={() => setAdjust(true)}>
            <Plus size={16} />
            Post adjustment
          </Button>
        )}
      </PageHeader>
      {!ledger && (
        <>
          <div className="grid four">
            <Metric
              label="Total income"
              value={<Currency amount={f.income} />}
              icon={ArrowDownLeft}
              detail="Confirmed revenue, after reversals"
            />
            <Metric
              label="Recognized expenses"
              value={<Currency amount={f.expenses} />}
              icon={ArrowUpRight}
              detail="Accrued after final approval"
            />
            <Metric
              label="Available operating cash"
              value={<Currency amount={f.cash} />}
              icon={Wallet}
              detail="Cash received less cash disbursed"
            />
            <Metric
              label="Outstanding payables"
              value={<Currency amount={f.payable} />}
              icon={Receipt}
              detail="Approved reimbursements awaiting payout"
            />
          </div>
          <Notice>
            All amounts are simulated and derived from the shared journal. Recognized expense and
            actual cash payout are separate accounting stages.
          </Notice>
          <div className="grid two">
            <Card title="Where your income comes from">
              <div className="card-body">
                <div
                  className="chart"
                  role="img"
                  aria-label="Revenue by membership, ticket, merchandise and fundraiser source"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sources} layout="vertical" margin={{ left: 16, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => currency(Math.round(v * 100))} />
                      <Bar
                        dataKey="value"
                        name="Income (INR)"
                        fill="#1A73E8"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="stack small">
                  {f.sources.map((s) => (
                    <div className="row between" key={s.account}>
                      <span className="muted">{s.name}</span>
                      <Currency amount={s.amount} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card title="Income & recognized expenses">
              <div className="card-body">
                <div
                  className="chart"
                  role="img"
                  aria-label="Monthly income and recognized expense totals"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => currency(Math.round(v * 100))} />
                      <Legend />
                      <Bar
                        dataKey="income"
                        name="Income (INR)"
                        fill="#1A73E8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name="Expense (INR)"
                        fill="#64748B"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Details
                  items={[
                    ['Paid reimbursements', <Currency amount={f.paidExpenses} />],
                    ['Cash outflows', <Currency amount={f.outflows} />],
                    ['Net surplus', <Currency amount={f.surplus} />],
                  ]}
                />
              </div>
            </Card>
          </div>
          <ReportCharts data={data} />
          <div className="grid two">
            <Card
              title="Budget envelopes"
              action={<LinkButton to={`${root}/budgets`}>Manage budgets</LinkButton>}
            >
              <div className="card-body stack">
                {data.budgets.map((b) => {
                  const used = data.budgetUsage[b.id],
                    percent = (used / b.allocated) * 100;
                  return (
                    <div className="stack small" key={b.id}>
                      <div className="row between">
                        <strong>{b.title}</strong>
                        <Badge
                          value={percent >= 100 ? 'EXCEEDED' : percent >= 80 ? 'WARNING' : 'NORMAL'}
                        />
                      </div>
                      <Progress
                        value={percent}
                        tone={percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : ''}
                      />
                      <div className="row between caption muted">
                        <Currency amount={used} />
                        <span>
                          of <Currency amount={b.allocated} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card
              title="Reimbursement queue"
              action={
                data.role !== 'AUDITOR' && (
                  <LinkButton to={`${root}/expenses`}>Review claims</LinkButton>
                )
              }
            >
              <div>
                {data.expenses
                  .filter((e) => !['REJECTED', 'DISBURSED'].includes(e.status))
                  .map((e) => (
                    <div className="list-item" key={e.id}>
                      <div>
                        <h3>
                          {data.role === 'AUDITOR' ? (
                            e.title
                          ) : (
                            <Link to={`${root}/expenses/${e.id}`}>{e.title}</Link>
                          )}
                        </h3>
                        <p>
                          <Currency amount={e.amount} />
                        </p>
                      </div>
                      <Badge value={e.status} />
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </>
      )}
      <Card
        className="ledger-card"
        title={ledger ? 'Dual-entry financial ledger' : 'Recent journal entries'}
        action={!ledger && <LinkButton to={`${root}/ledger`}>Full ledger</LinkButton>}
      >
        <div className="card-body">
          <div className="toolbar">
            <input
              className="input"
              aria-label="Search ledger"
              placeholder="Search description or reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Account classification"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              <option value="ALL">All accounts</option>
              {accounts.map((a) => (
                <option value={a} key={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          {ledger && (
            <div className="toolbar">
              <select
                aria-label="Income or expense"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                <option value="ALL">Income & expense entries</option>
                <option value="INCOME">Income entries</option>
                <option value="EXPENSE">Expense entries</option>
              </select>
              <select
                aria-label="Transaction source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="ALL">All sources</option>
                {[...new Set(data.journal.map((j) => j.reference))].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <div className="field">
                <label htmlFor="date-from">From date</label>
                <input
                  id="date-from"
                  className="input"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="date-until">Until date</label>
                <input
                  id="date-until"
                  className="input"
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </div>
            </div>
          )}
          <Table
            rows={ledger ? rows : rows.slice(-8).reverse()}
            rowKey="rowId"
            selected={selected}
            onRow={(r) => setSelected(r.rowId)}
            columns={[
              {
                key: 'at',
                title: 'Date / time',
                render: (r) => <time dateTime={r.at}>{datetime(r.at)}</time>,
              },
              {
                key: 'number',
                title: 'Entry number',
                render: (r) => (
                  <Button
                    onClick={() => {
                      setSelected(r.rowId);
                      setDetail(r.id);
                    }}
                  >
                    <span className="mono">{r.number}</span>
                  </Button>
                ),
              },
              {
                key: 'description',
                title: 'Description & reference',
                render: (r) => (
                  <div>
                    <strong>{r.description}</strong>
                    <p className="caption muted">
                      {data.role !== 'AUDITOR' && refLink(r, root) ? (
                        <Link to={refLink(r, root)}>
                          {r.reference} · {r.referenceId}
                        </Link>
                      ) : (
                        r.reference
                      )}
                    </p>
                  </div>
                ),
              },
              {
                key: 'account',
                title: 'Account classification',
                align: 'center',
                render: (r) => (
                  <Badge>
                    {r.account} ·{' '}
                    {r.account.startsWith('4')
                      ? 'Revenue'
                      : r.account.startsWith('5')
                        ? 'Expense'
                        : r.account === '2010'
                          ? 'Liability'
                          : r.account === '3010'
                            ? 'Equity'
                            : 'Asset'}
                  </Badge>
                ),
              },
              {
                key: 'debit',
                title: 'Debit',
                align: 'number',
                render: (r) => <Currency amount={r.debit} />,
              },
              {
                key: 'credit',
                title: 'Credit',
                align: 'number',
                render: (r) => <Currency amount={r.credit} />,
              },
            ]}
          />
        </div>
      </Card>
      {reports && (
        <Card title="Donation reversals">
          <div className="card-body stack">
            {data.payments
              .filter((p) => p.reference === 'FUNDRAISER')
              .map((p) => (
                <div className="row between" key={p.id}>
                  <span className="mono">{p.id}</span>
                  <Currency amount={p.amount} />
                  <Badge value={p.status} />
                  {data.role === 'TREASURER' && p.status === 'SUCCEEDED' && (
                    <Button danger onClick={() => setReverse(p.id)}>
                      Reverse donation
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
      {detail && (
        <Modal title="Journal entry detail" onClose={() => setDetail(null)}>
          <div className="stack">
            {(() => {
              const j = data.journal.find((j) => j.id === detail),
                debit = j.lines.reduce((a, l) => a + l.debit, 0),
                credit = j.lines.reduce((a, l) => a + l.credit, 0);
              return (
                <>
                  <Details
                    items={[
                      ['Entry number', <span className="mono">{j.number}</span>],
                      ['Posted', datetime(j.at)],
                      ['Description', j.description],
                      [
                        'Source status',
                        j.reference === 'TICKET'
                          ? data.tickets.find((t) => t.id === j.referenceId)?.status
                          : j.reference === 'ORDER'
                            ? data.orders.find((o) => o.id === j.referenceId)?.status
                            : j.reference.startsWith('EXPENSE')
                              ? data.expenses.find((e) => e.id === j.referenceId)?.status
                              : 'Posted',
                      ],
                      ['Source', `${j.reference} · ${j.referenceId || 'Manual'}`],
                      ['Total debit', <Currency amount={debit} />],
                      ['Total credit', <Currency amount={credit} />],
                    ]}
                  />
                  <Badge tone={debit === credit ? 'success' : 'danger'}>
                    {debit === credit ? 'Balanced entry' : 'Unbalanced entry'}
                  </Badge>
                </>
              );
            })()}
          </div>
        </Modal>
      )}
      {adjust && (
        <Modal title="Post a balanced journal adjustment" onClose={() => setAdjust(false)}>
          <RecordForm
            fields={[
              { name: 'description', label: 'Description', required: true, full: true },
              { name: 'amount', label: 'Amount (₹)', type: 'number', step: '.01', required: true },
              { name: 'debit', label: 'Debit account code', required: true },
              { name: 'credit', label: 'Credit account code', required: true },
            ]}
            onCancel={() => setAdjust(false)}
            onSubmit={async (v) => {
              await financeService.adjustment({ ...v, amount: Math.round(Number(v.amount) * 100) });
              toast('Balanced journal adjustment posted');
              setAdjust(false);
            }}
          />
        </Modal>
      )}
      {reverse && (
        <Confirm
          title="Reverse this contribution?"
          description="This records a revenue reversal and updates the campaign’s balance and financial ledger."
          onClose={() => setReverse(null)}
          onConfirm={async () => {
            await fundraiserService.reverseDonation(reverse);
            toast('Contribution reversed');
            setReverse(null);
          }}
        />
      )}
    </div>
  );
}
export function Budgets() {
  const { data, toast } = useApp();
  const [edit, setEdit] = useState(null),
    [year, setYear] = useState(data.club.fiscalYear);
  const writable = ['TREASURER', 'ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(
    data.role,
  );
  return (
    <div className="stack">
      <PageHeader
        title="Make room for what matters."
        description="Category envelopes, committed spending and clear boundaries."
      >
        {writable && (
          <Button primary onClick={() => setEdit({ fiscalYear: year, category: 'SUPPLIES' })}>
            Create budget
          </Button>
        )}
      </PageHeader>
      <div className="toolbar">
        <select aria-label="Fiscal year" value={year} onChange={(e) => setYear(e.target.value)}>
          {[...new Set([data.club.fiscalYear, ...data.budgets.map((b) => b.fiscalYear)])].map(
            (y) => (
              <option key={y}>{y}</option>
            ),
          )}
        </select>
      </div>
      <Notice>
        Budget remaining is an allocation, not available cash. Expenses commit only at final
        approval. Overspending requires a recorded Association In-charge override or an increased
        envelope.
      </Notice>
      <div className="grid three">
        {data.budgets
          .filter((b) => b.fiscalYear === year)
          .map((b) => {
            const used = data.budgetUsage[b.id],
              ratio = (used / b.allocated) * 100;
            return (
              <Card key={b.id}>
                <div className="card-body stack">
                  <div className="row between">
                    <h3>{b.title}</h3>
                    <Badge value={ratio >= 100 ? 'EXCEEDED' : ratio >= 80 ? 'WARNING' : 'NORMAL'} />
                  </div>
                  <span className="caption muted">
                    {b.category.replaceAll('_', ' ')} · {b.fiscalYear}
                  </span>
                  <h2>
                    <Currency amount={b.allocated} />
                  </h2>
                  <Progress
                    value={ratio}
                    tone={ratio >= 100 ? 'danger' : ratio >= 80 ? 'warning' : ''}
                  />
                  <Details
                    items={[
                      ['Committed', <Currency amount={used} />],
                      ['Remaining', <Currency amount={b.allocated - used} />],
                      ['Consumed', `${Math.round(ratio)}%`],
                      ['Event', data.events.find((e) => e.id === b.eventId)?.title || 'Club-wide'],
                    ]}
                  />
                  {b.items && Array.isArray(b.items) && b.items.length > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        borderTop: '1px solid var(--border-subtle, #e2e8f0)',
                        paddingTop: 10,
                      }}
                    >
                      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Approved Line Items:
                      </h4>
                      <table
                        style={{
                          width: '100%',
                          fontSize: 12,
                          textAlign: 'left',
                          borderCollapse: 'collapse',
                        }}
                      >
                        <thead>
                          <tr style={{ color: 'var(--text-muted, #64748b)' }}>
                            <th>Item</th>
                            <th style={{ textAlign: 'center' }}>Qty</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.items.map((it, idx) => (
                            <tr
                              key={idx}
                              style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}
                            >
                              <td style={{ padding: '4px 0' }}>{it.name}</td>
                              <td style={{ textAlign: 'center', padding: '4px 0' }}>
                                {it.quantity}
                              </td>
                              <td style={{ textAlign: 'right', padding: '4px 0' }}>₹{it.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {writable && <Button onClick={() => setEdit(b)}>Edit envelope</Button>}
                </div>
              </Card>
            );
          })}
      </div>
      {edit && (
        <Modal
          title={edit.id ? 'Edit budget envelope' : 'Create budget envelope'}
          onClose={() => setEdit(null)}
        >
          <RecordForm
            fields={[
              { name: 'title', label: 'Envelope title', required: true },
              {
                name: 'allocated',
                label: 'Allocation (₹)',
                type: 'number',
                step: '.01',
                required: true,
              },
              {
                name: 'category',
                label: 'Category',
                options: [
                  'EVENT_PRODUCTION',
                  'SUPPLIES',
                  'FOOD_CATERING',
                  'MARKETING',
                  'TRAVEL',
                  'OTHER',
                ],
                required: true,
              },
              { name: 'fiscalYear', label: 'Fiscal year', required: true },
              {
                name: 'eventId',
                label: 'Event association',
                options: data.events.map((e) => ({ value: e.id, label: e.title })),
              },
            ]}
            initial={{ ...edit, allocated: (edit.allocated || 0) / 100 }}
            onCancel={() => setEdit(null)}
            onSubmit={async (v) => {
              await financeService.saveBudget({
                ...v,
                id: edit.id,
                allocated: Math.round(Number(v.allocated) * 100),
              });
              toast('Budget saved');
              setEdit(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
