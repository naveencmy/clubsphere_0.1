import Markdown from '../../components/common/Markdown.jsx';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Pin, Megaphone } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { broadcastService } from '../../services/serviceFactory.js';
import { managerRoles } from '../../services/permissions.js';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  Empty,
  Table,
  Avatar,
  Notice,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { date, datetime } from '../../utils/format.js';
export default function Announcements() {
  const { data, toast } = useApp(),
    { run, busy } = useAction(),
    location = useLocation();
  const [search, setSearch] = useState(''),
    [audience, setAudience] = useState('ALL'),
    [edit, setEdit] = useState(null),
    [revisions, setRevisions] = useState(null),
    [deliveries, setDeliveries] = useState(null),
    [preview, setPreview] = useState(false);
  const management = location.pathname.startsWith('/dashboard') && managerRoles.includes(data.role);
  const list = data.announcements
    .filter(
      (a) =>
        `${a.title} ${a.content}`.toLowerCase().includes(search.toLowerCase()) &&
        (audience === 'ALL' || a.audience === audience),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt),
    );
  const isRead = (a) =>
    data.readReceipts.some((r) => r.announcementId === a.id && r.userId === data.user?.id);
  return (
    <div className="stack">
      <PageHeader
        title={management ? 'One message. Your whole community.' : 'From your community.'}
        description="Official updates, clear dates and a history you can return to."
      >
        {management && (
          <Button primary onClick={() => setEdit({ audience: 'ALL_MEMBERS' })}>
            Compose announcement
          </Button>
        )}
      </PageHeader>
      <div className="toolbar">
        <input
          className="input"
          aria-label="Search announcements"
          placeholder="Search announcements…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Announcement audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        >
          {['ALL', 'PUBLIC', 'ALL_MEMBERS', 'COMMITTEE_ONLY'].map((v) => (
            <option value={v} key={v}>
              {v.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      {list.map((a) => (
        <article key={a.id} className="card announcement">
          <div className="row between">
            <div className="row">
              <Badge>{a.audience.replaceAll('_', ' ')}</Badge>
              {a.pinned && (
                <Badge tone="info">
                  <Pin size={12} />
                  Pinned
                </Badge>
              )}
              {a.status !== 'PUBLISHED' && <Badge value={a.status} />}
            </div>
            <span className="caption muted">
              <time dateTime={a.publishedAt || a.updatedAt}>
                {datetime(a.publishedAt || a.updatedAt)}
              </time>
            </span>
          </div>
          <h3>{a.title}</h3>
          <Markdown content={a.content} />
          <footer className="announcement-footer">
            <div className="row">
              <Avatar name={data.users.find((u) => u.id === a.authorId)?.name} />
              <span className="caption muted">
                {data.users.find((u) => u.id === a.authorId)?.name || 'Club team'}
                {a.updatedAt && (
                  <>
                    {' '}
                    · Updated <time dateTime={a.updatedAt}>{date(a.updatedAt)}</time>
                  </>
                )}
              </span>
            </div>
            <div className="row">
              {a.status === 'PUBLISHED' && data.role !== 'VISITOR' && (
                <Button
                  disabled={busy || isRead(a)}
                  onClick={() => run(() => broadcastService.read(a.id), 'Marked as read')}
                >
                  {isRead(a) ? 'Read' : 'Mark as read'}
                </Button>
              )}
              <Button onClick={() => setRevisions(a.id)}>Publication history</Button>
              {management && (
                <>
                  <Button onClick={() => setEdit(a)}>Edit</Button>
                  {a.status === 'DRAFT' && ['TREASURER', 'PRESIDENT'].includes(data.role) && (
                    <Button
                      disabled={busy}
                      onClick={() => run(() => broadcastService.review(a.id), 'Draft reviewed')}
                    >
                      Review draft
                    </Button>
                  )}
                  {a.status !== 'PUBLISHED' && data.role === 'PRESIDENT' && (
                    <Button
                      primary
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => broadcastService.publish(a.id),
                          'Announcement published; demo deliveries queued',
                        )
                      }
                    >
                      Publish announcement
                    </Button>
                  )}
                  {data.role === 'PRESIDENT' && (
                    <Button
                      disabled={busy}
                      onClick={() => run(() => broadcastService.pin(a.id), 'Pin updated')}
                    >
                      {a.pinned ? 'Unpin' : 'Pin'}
                    </Button>
                  )}
                  <Button onClick={() => setDeliveries(a.id)}>Delivery report</Button>
                </>
              )}
            </div>
          </footer>
        </article>
      ))}
      {!list.length && (
        <Empty
          title="No updates match this view"
          description="Try another search or audience filter."
        />
      )}
      {revisions && (
        <Modal title="Publication & revision history" onClose={() => setRevisions(null)}>
          <div className="stack">
            {data.revisions
              .filter((r) => r.announcementId === revisions)
              .map((r) => (
                <section className="stack small" key={r.id}>
                  <strong>
                    Revision {r.number} · {r.title}
                  </strong>
                  <time className="muted caption" dateTime={r.at}>
                    {datetime(r.at)}
                  </time>
                  <p className="announcement-body">{r.content}</p>
                  <p className="mono caption" style={{ overflowWrap: 'anywhere' }}>
                    SHA-256: {r.hash}
                  </p>
                  {r.hash === 'seed-unverified' && (
                    <Notice>
                      Seed revision hash is not verified. New edits calculate a local SHA-256
                      digest.
                    </Notice>
                  )}
                </section>
              ))}
          </div>
        </Modal>
      )}
      {deliveries && (
        <Modal title="Demo delivery report" onClose={() => setDeliveries(null)}>
          <div className="stack">
            <Notice>
              Email dispatch is simulated. Reading an announcement is tracked separately from
              delivery.
            </Notice>
            {['TREASURER', 'PRESIDENT'].includes(data.role) && (
              <Button
                primary
                disabled={busy}
                onClick={() =>
                  run(() => broadcastService.dispatch(deliveries), 'Demo deliveries advanced')
                }
              >
                Advance queued → sent → delivered
              </Button>
            )}
            <Table
              rows={data.deliveries.filter((d) => d.announcementId === deliveries)}
              columns={[
                {
                  key: 'user',
                  title: 'Recipient',
                  render: (d) => data.users.find((u) => u.id === d.userId)?.name || d.userId,
                },
                { key: 'status', title: 'Delivery', render: (d) => <Badge value={d.status} /> },
                {
                  key: 'read',
                  title: 'Read status',
                  render: (d) =>
                    data.readReceipts.some(
                      (r) => r.announcementId === d.announcementId && r.userId === d.userId,
                    )
                      ? 'Read'
                      : 'Unread',
                },
              ]}
            />
          </div>
        </Modal>
      )}
      {edit && (
        <Modal
          title={edit.id ? 'Revise announcement' : 'Compose announcement'}
          onClose={() => setEdit(null)}
        >
          <div className="stack">
            <Notice>
              {data.role === 'COMMITTEE_LEAD'
                ? 'Your announcement is saved as a draft for officer review.'
                : edit.status === 'PUBLISHED'
                  ? 'Saving appends a revision. Existing publication history is retained.'
                  : 'Save the draft, then publish from the broadcast hub.'}
            </Notice>
            <RecordForm
              fields={[
                { name: 'title', label: 'Announcement title', required: true, full: true },
                {
                  name: 'audience',
                  label: 'Audience',
                  required: true,
                  options: ['PUBLIC', 'ALL_MEMBERS', 'COMMITTEE_ONLY'],
                },
                {
                  name: 'pinned',
                  label: 'Pinned',
                  options: [
                    { value: 'false', label: 'No' },
                    { value: 'true', label: 'Yes' },
                  ],
                },
                {
                  name: 'content',
                  label: 'Markdown content',
                  type: 'textarea',
                  required: true,
                  full: true,
                },
              ]}
              initial={{ ...edit, pinned: String(edit.pinned || false) }}
              onCancel={() => setEdit(null)}
              submitLabel="Save announcement"
              onSubmit={async (v) => {
                await broadcastService.save({ ...v, id: edit.id, pinned: v.pinned === 'true' });
                toast('Announcement and revision saved');
                setEdit(null);
              }}
            >
              {(values) => (
                <section style={{ marginTop: 16 }}>
                  <Button type="button" onClick={() => setPreview(!preview)}>
                    {preview ? 'Hide preview' : 'Preview Markdown'}
                  </Button>
                  {preview && (
                    <Card title="Announcement preview">
                      <div className="card-body">
                        <h3>{values.title}</h3>
                        <Markdown content={values.content} />
                      </div>
                    </Card>
                  )}
                </section>
              )}
            </RecordForm>
          </div>
        </Modal>
      )}
    </div>
  );
}
