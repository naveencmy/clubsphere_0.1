import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { fundraiserService } from '../../services/serviceFactory.js';
import { managerRoles, staffRoles } from '../../services/permissions.js';
import {
  PageHeader,
  Card,
  Badge,
  Progress,
  Currency,
  Button,
  Modal,
  Empty,
  Notice,
  Avatar,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { datetime } from '../../utils/format.js';
export default function Fundraisers() {
  const { data, toast } = useApp(),
    { run, busy } = useAction(),
    location = useLocation();
  const [edit, setEdit] = useState(null),
    [shiftForm, setShiftForm] = useState(null),
    [donation, setDonation] = useState(null);
  const manager = managerRoles.includes(data.role),
    shiftsOnly = location.pathname.endsWith('/shifts');
  function health(f) {
    const shifts = data.shifts.filter((s) => s.fundraiserId === f.id),
      tasks = data.tasks.filter((t) => t.fundraiserId === f.id);
    if (
      tasks.some(
        (t) => t.status === 'BLOCKED' || (t.status !== 'DONE' && new Date(t.due) < data.clock),
      )
    )
      return ['CRITICAL', 'A preparation task is blocked or overdue.'];
    if (!shifts.length || shifts.filter((s) => s.userId).length / shifts.length < 0.9)
      return ['AT_RISK', 'Volunteer shifts still need coverage.'];
    return ['HEALTHY', 'At least 90% of shifts are filled and preparation is on schedule.'];
  }
  return (
    <div className="stack">
      <PageHeader
        title={shiftsOnly ? 'A little time. A big difference.' : 'Good causes, shared effort.'}
        description={
          shiftsOnly
            ? 'Find a shift and help your community make it happen.'
            : 'Track the goal, coordinate the people and see your impact.'
        }
      >
        {manager && (
          <Button primary onClick={() => setEdit({})}>
            Create fundraiser
          </Button>
        )}
      </PageHeader>
      {data.fundraisers.map((f) => {
        const [status, reason] = data.fundraiserHealth[f.id],
          raised = data.raised[f.id] || 0;
        return (
          <Card
            key={f.id}
            title={f.title}
            action={
              <Badge
                tone={status === 'CRITICAL' ? 'danger' : status === 'AT_RISK' ? 'warning' : ''}
              >
                {status.replaceAll('_', ' ')}
              </Badge>
            }
          >
            <div className="card-body stack">
              {!shiftsOnly && (
                <>
                  <p className="muted">{f.description}</p>
                  <div className="row between">
                    <h2>
                      <Currency amount={raised} />
                    </h2>
                    <span className="muted">
                      of <Currency amount={f.target} /> goal
                    </span>
                  </div>
                  <Progress value={(raised / f.target) * 100} />
                  <p className="caption muted">
                    {Math.round((raised / f.target) * 100)}% funded · {reason}
                  </p>
                  <div className="row">
                    <Button
                      primary
                      onClick={() =>
                        setDonation({ fundraiserId: f.id, idempotencyKey: crypto.randomUUID() })
                      }
                    >
                      Record demo donation
                    </Button>
                    {manager && (
                      <>
                        <Button onClick={() => setEdit(f)}>Edit campaign</Button>
                        <Button onClick={() => setShiftForm({ fundraiserId: f.id })}>
                          Add volunteer shift
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="card-divider" />
                </>
              )}
              <h3>Volunteer shifts</h3>
              <div className="grid two">
                {data.shifts
                  .filter((s) => s.fundraiserId === f.id)
                  .map((s) => (
                    <div className="card" key={s.id}>
                      <div className="card-body stack small">
                        <div className="row between">
                          <strong>{s.title}</strong>
                          <Badge tone={s.userId ? '' : 'warning'}>
                            {s.userId ? 'Assigned' : 'Open shift'}
                          </Badge>
                        </div>
                        <p className="caption muted">
                          <time dateTime={s.startsAt}>{datetime(s.startsAt)}</time> –{' '}
                          <time dateTime={s.endsAt}>{datetime(s.endsAt)}</time>
                        </p>
                        <div className="row">
                          <Avatar
                            name={data.users.find((u) => u.id === s.userId)?.name || 'Unassigned'}
                          />
                          <span>
                            {data.users.find((u) => u.id === s.userId)?.name ||
                              'Your name could be here'}
                          </span>
                        </div>
                        {!s.userId && staffRoles.includes(data.role) && (
                          <Button
                            primary
                            disabled={busy}
                            onClick={() =>
                              run(() => fundraiserService.claim(s.id), 'Shift claimed')
                            }
                          >
                            Claim this shift
                          </Button>
                        )}
                        {s.userId && (s.userId === data.user.id || manager) && (
                          <Button
                            disabled={busy}
                            onClick={() =>
                              run(() => fundraiserService.release(s.id), 'Shift released')
                            }
                          >
                            Release shift
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              {!shiftsOnly && (
                <>
                  <h3>Preparation tasks</h3>
                  {data.tasks
                    .filter((t) => t.fundraiserId === f.id)
                    .map((t) => (
                      <div className="row between" key={t.id}>
                        <span>{t.title}</span>
                        <Badge value={t.status} />
                      </div>
                    ))}
                </>
              )}
            </div>
          </Card>
        );
      })}
      {!data.fundraisers.length && <Empty title="The next good cause starts with you" />}
      {donation && (
        <Modal title="Record a demo donation" onClose={() => setDonation(null)}>
          <Notice>
            No real money is collected. The donation updates this campaign and the shared financial
            ledger once.
          </Notice>
          <RecordForm
            fields={[
              {
                name: 'amount',
                label: 'Donation amount (₹)',
                type: 'number',
                step: '.01',
                required: true,
              },
            ]}
            onCancel={() => setDonation(null)}
            submitLabel="Confirm demo donation"
            onSubmit={async (v) => {
              await fundraiserService.donate({
                ...donation,
                amount: Math.round(Number(v.amount) * 100),
              });
              toast('Demo donation recorded');
              setDonation(null);
            }}
          />
        </Modal>
      )}
      {edit && (
        <Modal
          title={edit.id ? 'Edit fundraiser' : 'Create fundraiser'}
          onClose={() => setEdit(null)}
        >
          <RecordForm
            fields={[
              { name: 'title', label: 'Campaign title', required: true },
              {
                name: 'target',
                label: 'Target amount (₹)',
                type: 'number',
                step: '.01',
                required: true,
              },
              { name: 'startsAt', label: 'Starts at', type: 'datetime-local', required: true },
              { name: 'endsAt', label: 'Ends at', type: 'datetime-local', required: true },
              { name: 'description', label: 'Description', type: 'textarea', full: true },
            ]}
            initial={{
              ...edit,
              target: (edit.target || 0) / 100,
              startsAt: edit.startsAt?.slice(0, 16),
              endsAt: edit.endsAt?.slice(0, 16),
            }}
            onCancel={() => setEdit(null)}
            onSubmit={async (v) => {
              await fundraiserService.save({
                ...v,
                id: edit.id,
                target: Math.round(Number(v.target) * 100),
                startsAt: new Date(v.startsAt).toISOString(),
                endsAt: new Date(v.endsAt).toISOString(),
              });
              toast('Campaign saved');
              setEdit(null);
            }}
          />
        </Modal>
      )}
      {shiftForm && (
        <Modal title="Create a volunteer shift" onClose={() => setShiftForm(null)}>
          <RecordForm
            fields={[
              { name: 'title', label: 'Shift role', required: true },
              { name: 'startsAt', label: 'Starts at', type: 'datetime-local', required: true },
              { name: 'endsAt', label: 'Ends at', type: 'datetime-local', required: true },
            ]}
            onCancel={() => setShiftForm(null)}
            onSubmit={async (v) => {
              await fundraiserService.saveShift({
                ...v,
                fundraiserId: shiftForm.fundraiserId,
                startsAt: new Date(v.startsAt).toISOString(),
                endsAt: new Date(v.endsAt).toISOString(),
              });
              toast('Shift opened');
              setShiftForm(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
