import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { membershipService, adminService } from '../../services/serviceFactory.js';
import {
  PageHeader,
  Table,
  Badge,
  Button,
  Card,
  Avatar,
  Currency,
  Details,
  Modal,
  Confirm,
  Empty,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { date, csv, download } from '../../utils/format.js';
export default function MemberAdmin() {
  const { data, toast } = useApp(),
    { id } = useParams(),
    location = useLocation(),
    { run, busy } = useAction();
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState('ALL'),
    [edit, setEdit] = useState(null),
    [revoke, setRevoke] = useState(null);
  const plans = location.pathname.endsWith('/plans'),
    m = id ? data.memberships.find((m) => m.id === id) : null;
  const user = m ? data.users.find((u) => u.id === m.userId) : null;
  const rows = data.memberships.filter(
    (m) =>
      `${data.users.find((u) => u.id === m.userId)?.name} ${m.id}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'ALL' || m.status === status),
  );
  if (id && !m) return <Empty title="Member not found" />;
  return (
    <div className="stack">
      <PageHeader
        title={plans ? 'Membership plans' : m ? user?.name : 'Your community, in one place.'}
        description={
          plans
            ? 'Club-specific benefits, annual dues and clear choices.'
            : 'Membership details, eligibility and renewal status.'
        }
      >
        {!m && !plans && (
          <Button
            onClick={() =>
              download(
                'members.csv',
                csv([
                  ['Membership ID', 'Name', 'Student ID', 'Role', 'Tier', 'Status', 'Expiry'],
                  ...rows.map((m) => {
                    const u = data.users.find((u) => u.id === m.userId);
                    return [m.id, u?.name, u?.studentId, m.role, m.tier, m.status, m.validUntil];
                  }),
                ]),
              )
            }
          >
            Export members CSV
          </Button>
        )}
      </PageHeader>
      {plans ? (
        <div className="grid two">
          {data.plans.map((p) => (
            <Card key={p.id}>
              <div className="card-body stack">
                <h2>{p.title}</h2>
                <Currency amount={p.amount} />
                {p.benefits.map((b) => (
                  <p className="muted" key={b}>
                    {b}
                  </p>
                ))}
                {['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(data.role) && (
                  <Button onClick={() => setEdit(p)}>Edit plan</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : m ? (
        <Card>
          <div className="card-body stack">
            <div className="row">
              <Avatar name={user?.name} large />
              <div>
                <h2>{user?.name}</h2>
                <p className="mono muted">{user?.studentId}</p>
              </div>
              <Badge value={m.status} />
            </div>
            <Details
              items={[
                ['Membership ID', <span className="mono">{m.id}</span>],
                ['Role', m.role.replaceAll('_', ' ')],
                ['Tier', m.tier],
                ['Email', user?.email],
                ['Valid from', date(m.validFrom)],
                ['Valid until', date(m.validUntil)],
                ['Dues', <Currency amount={m.dues} />],
                ['Verification code', <span className="mono">{m.passCode}</span>],
              ]}
            />
            {['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(data.role) &&
              m.status !== 'REVOKED' && (
                <Button danger onClick={() => setRevoke(m.id)}>
                  Revoke membership
                </Button>
              )}
          </div>
        </Card>
      ) : (
        <>
          <div className="toolbar">
            <input
              className="input"
              aria-label="Search members"
              placeholder="Search member or reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Membership status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {[
                'ALL',
                'ACTIVE',
                'PENDING_PAYMENT',
                'RENEWAL_DUE',
                'GRACE_PERIOD',
                'EXPIRED',
                'REVOKED',
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <Table
            rows={rows}
            columns={[
              {
                key: 'user',
                title: 'Member',
                render: (m) => {
                  const u = data.users.find((u) => u.id === m.userId);
                  return (
                    <Link className="row" to={`/dashboard/${data.club.slug}/members/${m.id}`}>
                      <Avatar name={u?.name} />
                      <div>
                        <strong>{u?.name}</strong>
                        <p className="mono caption muted">{u?.studentId}</p>
                      </div>
                    </Link>
                  );
                },
              },
              { key: 'role', title: 'Club role', render: (m) => m.role.replaceAll('_', ' ') },
              { key: 'tier', title: 'Tier' },
              { key: 'status', title: 'Status', render: (m) => <Badge value={m.status} /> },
              { key: 'validUntil', title: 'Valid until', render: (m) => date(m.validUntil) },
              {
                key: 'dues',
                title: 'Dues',
                align: 'number',
                render: (m) => <Currency amount={m.dues} />,
              },
            ]}
          />
        </>
      )}
      {edit && (
        <Modal title="Edit membership plan" onClose={() => setEdit(null)}>
          <RecordForm
            fields={[
              { name: 'title', label: 'Plan name', required: true },
              {
                name: 'amount',
                label: 'Annual dues (₹)',
                type: 'number',
                step: '.01',
                required: true,
              },
              {
                name: 'benefits',
                label: 'Benefits · one per line',
                type: 'textarea',
                required: true,
                full: true,
              },
            ]}
            initial={{ ...edit, amount: edit.amount / 100, benefits: edit.benefits.join('\n') }}
            onCancel={() => setEdit(null)}
            onSubmit={async (v) => {
              await adminService.savePlan({
                ...v,
                id: edit.id,
                amount: Math.round(Number(v.amount) * 100),
                benefits: v.benefits.split('\n').filter(Boolean),
              });
              toast('Membership plan updated');
              setEdit(null);
            }}
          />
        </Modal>
      )}
      {revoke && (
        <Confirm
          title="Revoke this membership?"
          description="Member discounts and pass verification will be unavailable. This action is recorded in the official audit history."
          busy={busy}
          onClose={() => setRevoke(null)}
          onConfirm={async () => {
            const result = await run(() => membershipService.revoke(revoke), 'Membership revoked');
            if (result) setRevoke(null);
          }}
        />
      )}
    </div>
  );
}
