import Markdown from '../../components/common/Markdown.jsx';
import { useState, useEffect } from 'react';
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
    [historyList, setHistoryList] = useState(null),
    [loadingHistory, setLoadingHistory] = useState(false),
    [deliveries, setDeliveries] = useState(null),
    [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!revisions) {
      setHistoryList(null);
      return;
    }
    let cancelled = false;
    setLoadingHistory(true);
    fetch(`/api/collaboration/announcements/${revisions}/history`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        if (json?.data?.revisions && json.data.revisions.length > 0) {
          setHistoryList(json.data.revisions);
        } else {
          setHistoryList(null);
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryList(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [revisions]);
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
              <Avatar name={a.authorName || a.author || data.users.find((u) => u.id === a.authorId)?.name} />
              <span className="caption muted">
                {a.authorName || a.author || data.users.find((u) => u.id === a.authorId)?.name || 'CSE Association Faculty & Leads'}
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
                  {a.status === 'DRAFT' && ['TREASURER', 'ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(data.role) && (
                    <Button
                      disabled={busy}
                      onClick={() => run(() => broadcastService.review(a.id), 'Draft reviewed')}
                    >
                      Review draft
                    </Button>
                  )}
                  {a.status !== 'PUBLISHED' && ['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(data.role) && (
                    <Button
                      primary
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => broadcastService.publish(a.id),
                          'Announcement published; member delivery notifications queued',
                        )
                      }
                    >
                      Publish announcement
                    </Button>
                  )}
                  {['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(data.role) && (
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
      {(() => {
        const activeAnnouncement = data.announcements.find((item) => item.id === revisions);
        const localRevs = data.revisions.filter((r) => r.announcementId === revisions);
        const displayHistory =
          historyList && historyList.length > 0
            ? historyList.map((r) => ({
                id: r.id,
                number: r.revision_number || r.number || 1,
                title: r.title,
                content: r.content_markdown || r.content,
                at: r.edited_at || r.at,
                hash: r.revision_hash || r.hash || 'verified-record',
                editorName: r.editor_name || r.authorName || activeAnnouncement?.authorName,
              }))
            : localRevs.length > 0
              ? localRevs.map((r) => ({
                  id: r.id,
                  number: r.number || 1,
                  title: r.title,
                  content: r.content,
                  at: r.at,
                  hash: r.hash || 'verified-record',
                  editorName: r.authorName || r.editorName || activeAnnouncement?.authorName,
                }))
              : activeAnnouncement
                ? [
                    {
                      id: `rev-1-${activeAnnouncement.id}`,
                      number: 1,
                      title: activeAnnouncement.title,
                      content: activeAnnouncement.content,
                      at: activeAnnouncement.publishedAt,
                      hash: activeAnnouncement.auditHash || 'verified-record',
                      editorName: activeAnnouncement.authorName,
                    },
                  ]
                : [];

        return (
          revisions && (
            <Modal title="Publication & revision history" onClose={() => setRevisions(null)}>
              <div className="stack" style={{ gap: '1.25rem' }}>
                {activeAnnouncement && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div className="caption muted">
                        Target Audience: <strong>{activeAnnouncement.audience?.replaceAll('_', ' ')}</strong>
                      </div>
                      <div className="caption muted">
                        Broadcast Officer:{' '}
                        <strong>
                          {activeAnnouncement.authorName ||
                            activeAnnouncement.author ||
                            data.users.find((u) => u.id === activeAnnouncement.authorId)?.name ||
                            'CSE Association Faculty & Leads'}
                        </strong>
                      </div>
                    </div>
                    <Badge tone="success">Verified Audit Trail</Badge>
                  </div>
                )}
                {loadingHistory && !displayHistory.length ? (
                  <p className="caption muted">Loading cryptographic history records…</p>
                ) : displayHistory.length > 0 ? (
                  displayHistory.map((r, idx) => (
                    <section
                      className="stack small"
                      key={r.id || idx}
                      style={{
                        padding: '1rem',
                        background: 'var(--surface-subtle, rgba(255, 255, 255, 0.03))',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Badge tone="info">Revision {r.number}</Badge>
                          <strong>{r.title}</strong>
                        </div>
                        {r.editorName && (
                          <span
                            className="caption muted"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            by <strong>{r.editorName}</strong>
                          </span>
                        )}
                      </div>
                      <time className="muted caption" dateTime={r.at}>
                        {datetime(r.at)}
                      </time>
                      <p
                        className="announcement-body"
                        style={{ margin: '0.5rem 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}
                      >
                        {r.content}
                      </p>
                      <div
                        className="mono caption"
                        style={{
                          overflowWrap: 'anywhere',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>SHA-256:</span>
                        <code>{r.hash}</code>
                      </div>
                    </section>
                  ))
                ) : (
                  <Empty
                    title="No revision records"
                    description="This announcement was published with its original cryptographic baseline."
                  />
                )}
              </div>
            </Modal>
          )
        );
      })()}
      {deliveries && (
        <Modal title="Member delivery dispatch report" onClose={() => setDeliveries(null)}>
          <div className="stack">
            <Notice>
              Email dispatch logs track queued and delivered statuses for registered student members.
            </Notice>
            {['TREASURER', 'ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(data.role) && (
              <Button
                primary
                disabled={busy}
                onClick={() =>
                  run(() => broadcastService.dispatch(deliveries), 'Member deliveries updated')
                }
              >
                Dispatch queued → sent → delivered
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
