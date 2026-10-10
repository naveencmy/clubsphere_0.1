import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { adminService } from '../../services/serviceFactory.js';
import {
  PageHeader,
  Card,
  Table,
  Badge,
  Button,
  Avatar,
  Notice,
  Modal,
  Confirm,
  Details,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { datetime } from '../../utils/format.js';
export default function Administration() {
  const { data, toast } = useApp(),
    location = useLocation();
  const [selected, setSelected] = useState(null),
    [handover, setHandover] = useState(false),
    [search, setSearch] = useState('');
  const roles = location.pathname.endsWith('/roles'),
    audit = location.pathname.endsWith('/audit');
  const roleOptions = [
    'MEMBER',
    'VOLUNTEER',
    'COMMITTEE_LEAD',
    'SECRETARY',
    'TREASURER',
    'ASSOCIATION_COORDINATOR',
    'ASSOCIATION_INCHARGE',
  ];
  return (
    <div className="stack">
      <PageHeader
        title={
          audit
            ? 'An accountable history.'
            : roles
              ? 'Leadership, with continuity.'
              : 'Your club, your way.'
        }
        description={
          audit
            ? 'Actions, actors and timestamps from the shared demo services.'
            : roles
              ? 'Club-specific roles and a clear handover when the next chapter begins.'
              : 'A consistent identity and a few settings that make your community work.'
        }
      />
      {audit ? (
        <>
          <div className="toolbar">
            <input
              className="input"
              aria-label="Search audit history"
              placeholder="Search action or resource…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Table
            rows={data.audit
              .filter((a) =>
                `${a.action} ${a.resourceId}`.toLowerCase().includes(search.toLowerCase()),
              )
              .toReversed()}
            columns={[
              { key: 'at', title: 'Date / time', render: (a) => datetime(a.at) },
              {
                key: 'action',
                title: 'Action',
                render: (a) => <span className="mono">{a.action}</span>,
              },
              {
                key: 'actor',
                title: 'Actor',
                render: (a) => data.users.find((u) => u.id === a.actorId)?.name || a.actorId,
              },
              {
                key: 'resourceId',
                title: 'Resource',
                render: (a) => <span className="mono">{a.resourceId || 'Workspace'}</span>,
              },
              {
                key: 'details',
                title: 'Evidence',
                render: (a) => <Button onClick={() => setSelected(a)}>View change</Button>,
              },
            ]}
          />
        </>
      ) : roles ? (
        <>
          <Notice>
            Leadership handover preserves officer
            history and changes the outgoing Association In-charge to Member.
          </Notice>
          <Table
            rows={data.memberships}
            columns={[
              {
                key: 'user',
                title: 'Member',
                render: (m) => (
                  <div className="row">
                    <Avatar name={data.users.find((u) => u.id === m.userId)?.name} />
                    {data.users.find((u) => u.id === m.userId)?.name}
                  </div>
                ),
              },
              {
                key: 'role',
                title: 'Current role',
                render: (m) => <Badge>{m.role.replaceAll('_', ' ')}</Badge>,
              },
              {
                key: 'action',
                title: 'Role assignment',
                render: (m) =>
                  m.userId === data.user.id ? (
                    <span className="muted">Current account</span>
                  ) : (
                    <Button onClick={() => setSelected(m)}>Assign role / handover</Button>
                  ),
              },
            ]}
          />
          <Card title="Historical officer records">
            <div className="card-body">
              <Table
                rows={data.officerHistory}
                columns={[
                  {
                    key: 'user',
                    title: 'Officer',
                    render: (o) => data.users.find((u) => u.id === o.userId)?.name,
                  },
                  { key: 'role', title: 'Previous role' },
                  { key: 'until', title: 'Until', render: (o) => datetime(o.until) },
                ]}
              />
            </div>
          </Card>
        </>
      ) : (
        <div className="grid two">
          <Card title="Club profile">
            <div className="card-body">
              <RecordForm
                fields={[
                  { name: 'name', label: 'Club name', required: true, full: true },
                  { name: 'initials', label: 'Brand initials', required: true },
                  {
                    name: 'eventCapacity',
                    label: 'Default event capacity',
                    type: 'number',
                    required: true,
                  },
                  {
                    name: 'description',
                    label: 'Description',
                    type: 'textarea',
                    required: true,
                    full: true,
                  },
                  { name: 'location', label: 'Club location', required: true },
                  { name: 'fiscalYear', label: 'Academic / fiscal year', required: true },
                ]}
                initial={{ eventCapacity: 80, ...data.club }}
                onSubmit={async (v) => {
                  await adminService.saveClub({ ...v, eventCapacity: Number(v.eventCapacity) });
                  toast('Club profile updated');
                }}
              />
            </div>
          </Card>
          <Card title="Operating conventions">
            <div className="card-body stack">
              <Details
                items={[
                  ['Design system', 'ClubSphere · documents/DESIGN.md'],
                  ['Primary brand color', <span className="mono">#1A73E8</span>],
                  ['Membership grace period', '14 days'],
                  ['Checkout reservation', '10 minutes'],
                  ['Dual approval threshold', '₹2,500.00 and above'],
                  ['Payment configuration', 'Mock adapter only · no production keys'],
                ]}
              />
              <Notice>
                Brand styling is governed by DESIGN.md across every module. Financial and
                notification preferences are demonstrated through the mock services.
              </Notice>
            </div>
          </Card>
        </div>
      )}
      {selected && audit && (
        <Modal title="Audit record detail" onClose={() => setSelected(null)}>
          <div className="stack">
            <Details
              items={[
                ['Action', selected.action],
                ['Actor', data.users.find((u) => u.id === selected.actorId)?.name],
                ['Timestamp', datetime(selected.at)],
                ['Resource', selected.resourceId],
              ]}
            />
            <pre
              className="mono caption"
              style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
            >
              {JSON.stringify({ before: selected.before, after: selected.after }, null, 2)}
            </pre>
          </div>
        </Modal>
      )}
      {selected && roles && (
        <Modal title="Assign club role" onClose={() => setSelected(null)}>
          <RecordForm
            fields={[
              { name: 'role', label: 'New club role', required: true, options: roleOptions },
              {
                name: 'handover',
                label: 'Leadership handover',
                options: [
                  { value: 'false', label: 'Assign role only' },
                  { value: 'true', label: 'Confirm handover from current Association In-charge' },
                ],
              },
            ]}
            initial={{ role: selected.role, handover: 'false' }}
            onCancel={() => setSelected(null)}
            onSubmit={async (v) => {
              await adminService.assignRole({
                membershipId: selected.id,
                role: v.role,
                handover: v.handover === 'true',
              });
              toast('Role assignment recorded');
              setSelected(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
