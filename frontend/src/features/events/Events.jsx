import { useState, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Ticket,
  Plus,
  ScanLine,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { eventService } from '../../services/serviceFactory.js';
import { eligible, managerRoles } from '../../services/permissions.js';
import {
  Card,
  PageHeader,
  LinkButton,
  Button,
  Badge,
  Currency,
  Notice,
  Empty,
  Table,
  Details,
  Confirm,
  Timeline,
} from '../../components/common/UI.jsx';
import { EventArt, EventCard } from './EventCards.jsx';
import QRDisplay from '../../components/common/QRDisplay.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { date, datetime, download, csv } from '../../utils/format.js';
export default function Events() {
  const { data } = useApp(),
    { id } = useParams(),
    navigate = useNavigate(),
    location = useLocation(),
    { run, busy } = useAction();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('ALL'),
    [tierId, setTierId] = useState('');
  const manage = location.pathname.startsWith('/dashboard'),
    root = `/dashboard/${data.club.slug}`,
    e = id ? data.events.find((e) => e.id === id) : null;
  if (id && !e)
    return (
      <Empty title="Event not found" action={<LinkButton to="/events">Browse events</LinkButton>} />
    );
  const allTiers = (data.tiers || []).filter(
    (t) =>
      t.eventId === e?.id ||
      t.eventId === e?.slug ||
      t.eventId === e?.backendId ||
      t.backendEventId === e?.backendId,
  );
  const tiers =
    allTiers.length > 0
      ? allTiers
      : e?.tiers && e.tiers.length > 0
        ? e.tiers
        : [
            {
              id: `tier_${e?.id || 'event'}_std`,
              eventId: e?.id,
              name: 'General Registration Pass',
              memberPrice: 0,
              publicPrice: 0,
              capacity: e?.capacity || 350,
            },
          ];
  const valid = eligible(data.membership, data.clock);
  const promotion = data.waitlist?.find(
    (w) =>
      (w.eventId === e?.id || w.eventId === e?.slug) &&
      w.userId === data.user?.id &&
      !w.claimedAt &&
      new Date(w.promotedUntil).getTime() > data.clock,
  );
  async function reserve() {
    if (data.role === 'VISITOR') {
      navigate('/login');
      return;
    }
    const chosenTierId = tierId || promotion?.tierId || tiers[0]?.id;
    const t = await run(() => eventService.reserve({ eventId: e.id, tierId: chosenTierId }));
    if (t) navigate(`/checkout/ticket/${t.id}`);
  }
  if (e)
    return (
      <div className="stack">
        <PageHeader title={e.title} description={e.category}>
          <LinkButton to="/events">Back to events</LinkButton>
          {data.user && managerRoles.includes(data.role) && (
            <LinkButton to={`${root}/events/${e.id}/edit`}>Edit event</LinkButton>
          )}
        </PageHeader>
        <div className="grid two">
          <Card>
            <EventArt event={e} />
            <div className="card-body stack">
              <h2>A moment worth showing up for.</h2>
              <p className="muted">{e.description}</p>
              <Details
                items={[
                  ['When', datetime(e.startsAt)],
                  ['Where', e.venue],
                  ['Capacity', `${e.capacity} seats`],
                  ['Booking closes', datetime(e.salesClose || e.endsAt || e.startsAt)],
                  [
                    'Member booking opens',
                    datetime(new Date(e.salesOpen || '2025-01-01').getTime() - 48 * 3600000),
                  ],
                ]}
              />
            </div>
          </Card>
          <Card title="Find your seat">
            <div className="card-body stack">
              {promotion && (
                <Notice>
                  Your exclusive waitlist booking window closes{' '}
                  <time dateTime={promotion.promotedUntil}>
                    {datetime(promotion.promotedUntil)}
                  </time>
                  . The promoted tier is selected for you.
                </Notice>
              )}
              {data.membership?.status === 'GRACE_PERIOD' && (
                <Notice tone="warning">
                  Grace-period member pricing is still enabled. Renew to retain benefits.
                </Notice>
              )}
              {tiers.map((t) => {
                const effectivePrice = valid ? t.memberPrice : t.publicPrice;
                const remainingSeats =
                  data.availability && data.availability[t.id] != null
                    ? data.availability[t.id]
                    : t.capacity || 100;
                return (
                  <label className="radio-row" key={t.id}>
                    <input
                      type="radio"
                      name="tier"
                      checked={(tierId || promotion?.tierId || tiers[0]?.id) === t.id}
                      onChange={() => setTierId(t.id)}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{t.name}</strong>
                      <p className="caption muted">
                        {remainingSeats} seats remaining · public{' '}
                        {t.publicPrice === 0 ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>0 ₹ (Free Tier)</span>
                        ) : (
                          <Currency amount={t.publicPrice} />
                        )}
                      </p>
                    </div>
                    <div>
                      {effectivePrice === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 700 }}>0 ₹ Free</span>
                      ) : (
                        <Currency amount={effectivePrice} />
                      )}
                      {valid && (
                        <div>
                          <Badge tone="info">Member price</Badge>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
              <Notice>
                {valid
                  ? 'Your member price is applied automatically.'
                  : 'Join the club to unlock member prices.'}{' '}
                Seats are held for 10 minutes during checkout.
              </Notice>
              {(() => {
                const activeTier = tiers.find(
                  (t) => (tierId || promotion?.tierId || tiers[0]?.id) === t.id,
                );
                const activePrice = activeTier
                  ? valid
                    ? activeTier.memberPrice
                    : activeTier.publicPrice
                  : 0;
                return (
                  <Button primary disabled={busy || !tiers.length} onClick={reserve}>
                    {activePrice === 0 ? 'Claim Free Pass' : 'Reserve ticket'} <Ticket size={16} />
                  </Button>
                );
              })()}
              <Button
                disabled={busy}
                onClick={() =>
                  run(() => eventService.waitlist(e.id), 'You have joined the event waitlist')
                }
              >
                Join waitlist
              </Button>
              {data.user && managerRoles.includes(data.role) && (
                <LinkButton to={`/scanner/${e.id}`}>
                  <ScanLine size={16} />
                  Open door scanner
                </LinkButton>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  return (
    <div className="stack">
      <PageHeader
        title={manage ? 'Events & experiences' : 'Make room for something good.'}
        description={
          manage
            ? 'Plan, publish and manage the moments that bring your community together.'
            : 'Find your next workshop, meetup or unforgettable campus night.'
        }
      >
        {manage && (
          <LinkButton primary to={`${root}/events/new`}>
            <Plus size={16} />
            Create event
          </LinkButton>
        )}
      </PageHeader>
      <div className="toolbar">
        <input
          className="input"
          aria-label="Search events"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Event category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="ALL">All categories</option>
          {[...new Set(data.events.map((e) => e.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid three">
        {data.events
          .filter(
            (e) =>
              e.title.toLowerCase().includes(search.toLowerCase()) &&
              (category === 'ALL' || e.category === category),
          )
          .map((e) => (
            <EventCard
              key={e.id}
              event={e}
              tiers={data.tiers}
              manage={manage}
              clubSlug={data.club?.slug}
            />
          ))}
      </div>
      {!data.events.length && <Empty title="Your next event starts here" />}
    </div>
  );
}
export function EventEditor() {
  const { data, toast } = useApp(),
    { id } = useParams(),
    navigate = useNavigate();
  const e = data.events.find((e) => e.id === id || e.slug === id),
    [editingTier, setEditingTier] = useState(null),
    [posterUrl, setPosterUrl] = useState(e?.imageUrl || '/images/events/aura-25.png'),
    [fileError, setFileError] = useState(null),
    [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const presets = [
    { label: "Aura '25", url: '/images/events/aura-25.png' },
    { label: "Synectics '26", url: '/images/events/synectics-26.jpg' },
    { label: '24h Hackathon', url: '/images/events/hackathon-2026.jpg' },
  ];

  function handleFileSelected(file) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFileError('Please select a PNG, JPEG, or WebP image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Image file must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPosterUrl(reader.result);
      setFileError(null);
    };
    reader.readAsDataURL(file);
  }

  const local = (value) =>
    value
      ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : '';
  const fields = [
    { name: 'title', label: 'Event title', required: true },
    {
      name: 'category',
      label: 'Category',
      options: [
        'Technical Event',
        'Workshop',
        'Symposium',
        'Hackathon',
        'Cultural',
        'Social',
        'Community',
      ],
      required: true,
    },
    { name: 'venue', label: 'Venue', required: true },
    { name: 'capacity', label: 'Total capacity', type: 'number', required: true },
    { name: 'startsAt', label: 'Starts at', type: 'datetime-local', required: true },
    { name: 'endsAt', label: 'Ends at', type: 'datetime-local', required: true },
    { name: 'salesOpen', label: 'Booking opens', type: 'datetime-local', required: true },
    { name: 'salesClose', label: 'Booking closes', type: 'datetime-local', required: true },
    {
      name: 'published',
      label: 'Visibility',
      options: [
        { value: 'true', label: 'Published' },
        { value: 'false', label: 'Draft' },
      ],
      required: true,
    },
    {
      name: 'scannerUsers',
      label: 'Assigned scanner volunteers · comma-separated student IDs',
      full: true,
    },
    { name: 'description', label: 'Description', type: 'textarea', required: true, full: true },
  ];
  return (
    <div className="stack">
      <PageHeader
        title={e ? 'Edit event' : 'Create your next experience'}
        description="Set the details, capacity and booking window."
      />
      <Card>
        <div className="card-body">
          <RecordForm
            fields={fields}
            initial={
              e
                ? {
                    ...e,
                    scannerUsers: e.scannerUsers
                      ?.map((id) => data.users.find((u) => u.id === id)?.studentId)
                      .filter(Boolean)
                      .join(', '),
                    published: String(e.published),
                    startsAt: local(e.startsAt),
                    endsAt: local(e.endsAt),
                    salesOpen: local(e.salesOpen),
                    salesClose: local(e.salesClose),
                  }
                : { capacity: data.club.eventCapacity || 80, published: 'false' }
            }
            onCancel={() => navigate(-1)}
            submitLabel={e ? 'Save event' : 'Create event'}
            onSubmit={async (v) => {
              const record = await eventService.save({
                ...v,
                id: e?.id,
                imageUrl: posterUrl || e?.imageUrl || '/images/events/aura-25.png',
                capacity: Number(v.capacity),
                scannerUsers: (v.scannerUsers || '')
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean)
                  .map((studentId) => {
                    const user = data.users.find((u) => u.studentId === studentId);
                    if (!user)
                      throw new Error('A scanner volunteer student ID is not in this club.');
                    return user.id;
                  }),
                published: v.published === 'true',
                startsAt: new Date(v.startsAt).toISOString(),
                endsAt: new Date(v.endsAt).toISOString(),
                salesOpen: new Date(v.salesOpen).toISOString(),
                salesClose: new Date(v.salesClose).toISOString(),
              });
              toast('Event saved');
              navigate(`/dashboard/${data.club.slug}/events/${record.id}/edit`);
            }}
          >
            <div className="field full" style={{ marginTop: 20 }}>
              <label
                htmlFor="poster-file-input"
                style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}
              >
                Event Poster & Banner Art
              </label>

              {posterUrl ? (
                <div className="poster-preview-box">
                  <img src={posterUrl} alt="Event Poster Preview" className="poster-preview-img" />
                  <div className="poster-preview-overlay">
                    <Button type="button" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={14} style={{ marginRight: 6 }} />
                      Change image
                    </Button>
                    <Button type="button" danger onClick={() => setPosterUrl('')}>
                      <Trash2 size={14} style={{ marginRight: 6 }} />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`poster-dropzone ${dragActive ? 'drag-active' : ''}`}
                  onDragOver={(ev) => {
                    ev.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    setDragActive(false);
                    if (ev.dataTransfer.files?.[0]) handleFileSelected(ev.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--slate-300)',
                    borderRadius: 12,
                    padding: '28px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--slate-50)',
                  }}
                >
                  <ImageIcon size={32} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  <strong>Drop event poster here or click to browse</strong>
                  <p className="caption muted">Supports PNG, JPEG, or WebP up to 5 MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="poster-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={(ev) => {
                  if (ev.target.files?.[0]) handleFileSelected(ev.target.files[0]);
                }}
              />

              {fileError && (
                <div style={{ marginTop: 8 }}>
                  <Notice tone="error">{fileError}</Notice>
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <span className="caption muted" style={{ display: 'block', marginBottom: 6 }}>
                  Or pick a campus preset banner:
                </span>
                <div className="poster-presets-row">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={`poster-preset-pill ${posterUrl === p.url ? 'active' : ''}`}
                      onClick={() => {
                        setPosterUrl(p.url);
                        setFileError(null);
                      }}
                    >
                      {posterUrl === p.url && <CheckCircle2 size={12} />}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label
                  htmlFor="poster-url-input"
                  className="caption muted"
                  style={{ display: 'block', marginBottom: 4 }}
                >
                  Or enter image URL:
                </label>
                <input
                  id="poster-url-input"
                  className="input"
                  placeholder="https://example.com/poster.jpg or /images/events/..."
                  value={posterUrl}
                  onChange={(ev) => setPosterUrl(ev.target.value)}
                />
              </div>
            </div>
          </RecordForm>
        </div>
      </Card>
      {e && (
        <Card
          title="Ticket tiers"
          action={<Button onClick={() => setEditingTier({ eventId: e.id })}>Add tier</Button>}
        >
          <div className="card-body stack">
            {data.tiers
              .filter((t) => t.eventId === e.id)
              .map((t) => (
                <div className="row between" key={t.id}>
                  <div>
                    <strong>{t.name}</strong>
                    <p className="muted">
                      {t.capacity} seats · member <Currency amount={t.memberPrice} /> · public{' '}
                      <Currency amount={t.publicPrice} />
                    </p>
                  </div>
                  <Button onClick={() => setEditingTier(t)}>Edit tier</Button>
                </div>
              ))}
            {editingTier && (
              <RecordForm
                key={editingTier.id || 'new'}
                fields={[
                  { name: 'name', label: 'Tier name', required: true },
                  { name: 'capacity', label: 'Tier capacity', type: 'number', required: true },
                  {
                    name: 'memberPrice',
                    label: 'Member price (₹)',
                    type: 'number',
                    step: '.01',
                    required: true,
                  },
                  {
                    name: 'publicPrice',
                    label: 'Public price (₹)',
                    type: 'number',
                    step: '.01',
                    required: true,
                  },
                ]}
                initial={{
                  ...editingTier,
                  memberPrice: (editingTier.memberPrice || 0) / 100,
                  publicPrice: (editingTier.publicPrice || 0) / 100,
                }}
                onCancel={() => setEditingTier(null)}
                onSubmit={async (v) => {
                  await eventService.saveTier({
                    ...v,
                    id: editingTier.id,
                    eventId: e.id,
                    capacity: Number(v.capacity),
                    memberPrice: Math.round(Number(v.memberPrice) * 100),
                    publicPrice: Math.round(Number(v.publicPrice) * 100),
                  });
                  toast('Ticket tier updated');
                  setEditingTier(null);
                }}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
export function Tickets() {
  const { data } = useApp(),
    { id } = useParams(),
    { run, busy } = useAction();
  const [confirm, setConfirm] = useState(false),
    [transfer, setTransfer] = useState('');
  const t = id ? data.tickets.find((t) => t.id === id) : null;
  if (id && !t) return <Empty title="Ticket not found" />;
  if (t) {
    const e = data.events.find((e) => e.id === t.eventId);
    return (
      <div className="stack">
        <PageHeader title="Your next experience, ready." description={e?.title}>
          <LinkButton to="/portal/tickets">All tickets</LinkButton>
        </PageHeader>
        <div className="grid two">
          <Card>
            <div className="card-body stack">
              <div className="row between">
                <h2>{e?.title}</h2>
                <Badge value={t.status} />
              </div>
              <div className="row between">
                <div>
                  <p className="mono">{t.code}</p>
                  <p className="muted">{data.tiers.find((x) => x.id === t.tierId)?.name}</p>
                </div>
                {['ISSUED', 'CHECKED_IN'].includes(t.status) && <QRDisplay code={t.code} />}
              </div>
              <Details
                items={[
                  ['Date', e && datetime(e.startsAt)],
                  ['Venue', e?.venue],
                  ['Payment', <Currency amount={t.amount} />],
                  ['Ticket reference', <span className="mono">{t.id}</span>],
                ]}
              />
              <Notice>
                Official cryptographically signed QR ticket. The scanner verifies ticket validity
                and prevents duplicate admission.
              </Notice>
              {t.status === 'RESERVED' && (
                <LinkButton primary to={`/checkout/ticket/${t.id}`}>
                  Resume checkout
                </LinkButton>
              )}
              {t.status === 'ISSUED' && (
                <>
                  <Button danger disabled={busy} onClick={() => setConfirm(true)}>
                    Request refund
                  </Button>
                  <div className="field">
                    <label htmlFor="transfer-user">Transfer to a verified club member</label>
                    <select
                      id="transfer-user"
                      value={transfer}
                      onChange={(e) => setTransfer(e.target.value)}
                    >
                      <option value="">Choose recipient</option>
                      {data.users
                        .filter((u) => u.id !== t.userId)
                        .map((u) => (
                          <option value={u.id} key={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <Button
                      disabled={busy || !transfer}
                      onClick={() =>
                        run(
                          () => eventService.transfer({ ticketId: t.id, userId: transfer }),
                          'Ticket transferred',
                        )
                      }
                    >
                      Transfer ticket
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
          <Card title="Ticket history">
            <div className="card-body">
              <Timeline items={t.history} />
            </div>
          </Card>
        </div>
        {confirm && (
          <Confirm
            busy={busy}
            title="Refund this ticket?"
            description="This refund reverses ticket revenue and releases the seat. It cannot be used for admission afterwards."
            onClose={() => setConfirm(false)}
            onConfirm={async () => {
              const result = await run(() => eventService.refund(t.id), 'Ticket refunded');
              if (result) setConfirm(false);
            }}
          />
        )}
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title="My tickets" description="Everything you need to show up and enjoy." />
      <Table
        rows={data.tickets.filter((t) => t.userId === data.user.id)}
        columns={[
          {
            key: 'code',
            title: 'Ticket',
            render: (t) => (
              <Link className="mono" to={`/portal/tickets/${t.id}`}>
                {t.code}
              </Link>
            ),
          },
          {
            key: 'event',
            title: 'Event',
            render: (t) => data.events.find((e) => e.id === t.eventId)?.title,
          },
          {
            key: 'amount',
            title: 'Paid / reserved',
            align: 'number',
            render: (t) => <Currency amount={t.amount} />,
          },
          { key: 'status', title: 'Status', render: (t) => <Badge value={t.status} /> },
        ]}
        empty="Your next experience awaits"
      />
      <LinkButton to="/events">Explore events</LinkButton>
    </div>
  );
}
export function EventOperations() {
  const { data } = useApp(),
    location = useLocation();
  const [eventId, setEventId] = useState(data.events[0]?.id || ''),
    [search, setSearch] = useState('');
  const e = data.events.find((e) => e.id === eventId);
  const tickets = data.tickets.filter((t) => t.eventId === eventId),
    confirmed = tickets.filter((t) => ['ISSUED', 'CHECKED_IN'].includes(t.status)),
    attended = confirmed.filter((t) => t.status === 'CHECKED_IN');
  const revenue = confirmed.reduce((a, t) => a + t.amount, 0);
  const costs = data.expenses
    .filter(
      (x) =>
        x.eventId === eventId &&
        (x.status === 'INCHARGE_APPROVED' ||
          x.status === 'PRESIDENT_APPROVED' ||
          x.status === 'DISBURSED' ||
          (x.status === 'TREASURER_APPROVED' && x.amount < 250000)),
    )
    .reduce((a, x) => a + x.amount, 0);
  const report = location.pathname.endsWith('event-reports');
  return (
    <div className="stack">
      <PageHeader
        title={report ? 'Event reconciliation' : 'Bookings & attendees'}
        description="An accurate view of every reservation, admission and event outcome."
      >
        <Button
          onClick={() =>
            download(
              'event-report.csv',
              csv([
                [
                  'Event',
                  'Capacity',
                  'Confirmed',
                  'Attended',
                  'Revenue (paise)',
                  'Approved expenses (paise)',
                  'Surplus (paise)',
                ],
                [
                  e?.title,
                  e?.capacity,
                  confirmed.length,
                  attended.length,
                  revenue,
                  costs,
                  revenue - costs,
                ],
              ]),
            )
          }
        >
          Export event summary
        </Button>
      </PageHeader>
      <div className="toolbar">
        <select
          aria-label="Select event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          {data.events.map((e) => (
            <option value={e.id} key={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <input
          className="input"
          aria-label="Search bookings"
          placeholder="Search code or attendee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {e && (
          <LinkButton to={`/scanner/${e.id}`}>
            <ScanLine size={16} />
            Door scanner
          </LinkButton>
        )}
      </div>
      <div className="grid four">
        <Card>
          <div className="metric">
            <p className="muted">Confirmed / capacity</p>
            <h2>
              {confirmed.length} / {e?.capacity || 0}
            </h2>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <p className="muted">Actual attendance</p>
            <h2>
              {attended.length}{' '}
              <span className="caption muted">
                ({confirmed.length ? Math.round((attended.length / confirmed.length) * 100) : 0}%)
              </span>
            </h2>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <p className="muted">Ticket revenue</p>
            <h2>
              <Currency amount={revenue} />
            </h2>
          </div>
        </Card>
        <Card>
          <div className="metric">
            <p className="muted">Event surplus</p>
            <h2>
              <Currency amount={revenue - costs} />
            </h2>
          </div>
        </Card>
      </div>
      <Table
        rows={tickets.filter((t) =>
          `${t.code} ${data.users.find((u) => u.id === t.userId)?.name}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )}
        columns={[
          {
            key: 'code',
            title: 'Ticket code',
            render: (t) => <span className="mono">{t.code}</span>,
          },
          {
            key: 'user',
            title: 'Attendee',
            render: (t) => data.users.find((u) => u.id === t.userId)?.name,
          },
          {
            key: 'tier',
            title: 'Tier',
            render: (t) => data.tiers.find((x) => x.id === t.tierId)?.name,
          },
          {
            key: 'amount',
            title: 'Amount',
            align: 'number',
            render: (t) => <Currency amount={t.amount} />,
          },
          { key: 'status', title: 'Status', render: (t) => <Badge value={t.status} /> },
        ]}
      />
      <Card title="Revenue by ticket tier">
        <div className="card-body stack small">
          {data.tiers
            .filter((t) => t.eventId === eventId)
            .map((t) => (
              <div className="row between" key={t.id}>
                <span>
                  {t.name} · {confirmed.filter((x) => x.tierId === t.id).length} confirmed
                </span>
                <Currency
                  amount={confirmed
                    .filter((x) => x.tierId === t.id)
                    .reduce((a, x) => a + x.amount, 0)}
                />
              </div>
            ))}
        </div>
      </Card>
      <Notice>
        Revenue excludes reserved, cancelled and refunded tickets. Approved expenses are linked by
        event ID, and dual-approval expenses count only after final approval.
      </Notice>
      <Card title="Waitlist">
        <div className="card-body">
          {data.waitlist
            .filter((w) => w.eventId === eventId)
            .map((w) => (
              <div className="row between" key={w.id}>
                <span>{data.users.find((u) => u.id === w.userId)?.name}</span>
                <Badge>
                  {w.claimedAt
                    ? 'Booked'
                    : w.expiredAt
                      ? 'Window expired'
                      : w.promotedAt
                        ? 'Promoted · 4 hour window'
                        : 'Waiting'}
                </Badge>
                {w.promotedUntil && !w.claimedAt && !w.expiredAt && (
                  <time className="caption muted" dateTime={w.promotedUntil}>
                    Until {datetime(w.promotedUntil)}
                  </time>
                )}
              </div>
            ))}
          {!data.waitlist.some((w) => w.eventId === eventId) && (
            <Empty title="No one is waiting for a seat" />
          )}
        </div>
      </Card>
    </div>
  );
}
