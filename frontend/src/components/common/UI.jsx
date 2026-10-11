import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Inbox, AlertCircle, LoaderCircle, ChevronRight, ArrowUpRight } from 'lucide-react';
import { currency, date, datetime, initials, label } from '../../utils/format.js';
export function Button({ children, primary, danger, icon, className = '', ...props }) {
  return (
    <button
      className={`btn ${primary ? 'primary' : ''} ${danger ? 'danger' : ''} ${icon ? 'icon' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function LinkButton({ to, children, primary, ...props }) {
  return (
    <Link to={to} className={`btn ${primary ? 'primary' : ''}`} {...props}>
      {children}
    </Link>
  );
}
export function Badge({ value, children, tone }) {
  const success = [
    'ACTIVE',
    'ISSUED',
    'CHECKED_IN',
    'PAID',
    'FULFILLED',
    'DONE',
    'DELIVERED',
    'DISBURSED',
    'INCHARGE_APPROVED',
    'SUCCEEDED',
  ];
  const danger = [
    'EXPIRED',
    'REJECTED',
    'BLOCKED',
    'URGENT',
    'EXCEEDED',
    'FAILED',
    'BOUNCED',
    'REVOKED',
  ];
  const warning = [
    'GRACE_PERIOD',
    'RENEWAL_DUE',
    'RESERVED',
    'PENDING',
    'NEEDS_CORRECTION',
    'WARNING',
    'AT_RISK',
    'TREASURER_APPROVED',
  ];
  const t =
    tone ||
    (success.includes(value)
      ? 'success'
      : danger.includes(value)
        ? 'danger'
        : warning.includes(value)
          ? 'warning'
          : ['MEDIUM', 'IN_PROGRESS', 'REVIEWED'].includes(value)
            ? 'info'
            : '');
  return <span className={`badge ${t}`}>{children || label(value)}</span>;
}
export const Currency = ({ amount }) => <span className="currency">{currency(amount)}</span>;
export const Avatar = ({ name, large }) => (
  <span className={`avatar ${large ? 'large' : ''}`} aria-label={name}>
    {initials(name)}
  </span>
);
export function PageHeader({ title, description, children }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </header>
  );
}
export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-head">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Metric({ label, value, icon: Icon, detail, to, actionLabel, className = '' }) {
  const content = (
    <>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        {Icon && (
          <span className="metric-icon">
            <Icon size={18} />
          </span>
        )}
      </div>
      <strong className="metric-value">{value}</strong>
      {(detail || actionLabel) && (
        <div className="metric-footer">
          {detail && <span className="caption muted metric-detail">{detail}</span>}
          {actionLabel && (
            <span className="metric-action">
              <span>{actionLabel}</span>
              <ArrowUpRight size={14} className="metric-action-icon" />
            </span>
          )}
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`card metric metric-interactive ${className}`}>
        {content}
      </Link>
    );
  }

  return <Card className={`metric ${className}`}>{content}</Card>;
}
export function Empty({
  title = 'Nothing here yet',
  description = 'New activity will appear here.',
  action,
}) {
  return (
    <div className="empty">
      <Inbox aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Notice({ children, tone = '' }) {
  return (
    <div className={`info-note ${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <AlertCircle size={20} />
      <div>{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="stack" role="status" aria-label="Loading ClubSphere">
      <div className="row">
        <LoaderCircle className="muted" size={20} /> Loading your workspace…
      </div>
      <div className="grid three">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}
export function Modal({ title, children, onClose, persistent = false, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!persistent) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        {!persistent && (
          <Button icon aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </Button>
        )}
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Confirm({ title = 'Confirm this action', description, onConfirm, onClose, busy }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{description}</p>
      <div className="form-actions">
        <Button onClick={onClose}>Keep current state</Button>
        <Button danger disabled={busy} onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
export function Progress({ value, tone = '', name = 'Completion progress' }) {
  return (
    <div
      className={`progress ${tone}`}
      role="progressbar"
      aria-label={name}
      aria-valuenow={Math.min(100, Math.max(0, Math.round(value)))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function Timeline({ items }) {
  return (
    <div className="timeline">
      {items?.map((item, i) => (
        <div className="timeline-item" key={i}>
          <strong>{label(item.status || item.action)}</strong>
          <p className="caption muted">
            <time dateTime={item.at}>{datetime(item.at)}</time>
          </p>
        </div>
      ))}
    </div>
  );
}
export function Details({ items }) {
  return (
    <dl className="detail-grid">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="detail-label">{k}</dt>
          <dd style={{ margin: 0 }}>{v || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Table({
  columns,
  rows,
  empty = 'No matching records',
  rowKey = 'id',
  onRow,
  selected,
}) {
  const [page, setPage] = useState(0),
    [sort, setSort] = useState(null);
  useEffect(() => setPage(0), [rows.length]);
  let list = [...rows];
  if (sort)
    list.sort(
      (a, b) =>
        String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), undefined, {
          numeric: true,
        }) * sort.direction,
    );
  const pages = Math.ceil(list.length / 10),
    visible = list.slice(page * 10, page * 10 + 10);
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Data table">
      <table className={selected !== undefined ? 'ledger' : ''}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align || ''}>
                {c.sort ? (
                  <button
                    className="btn"
                    onClick={() =>
                      setSort({ key: c.key, direction: sort?.key === c.key ? -sort.direction : 1 })
                    }
                  >
                    {c.title}
                  </button>
                ) : (
                  c.title
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => (
            <tr
              key={r[rowKey] ?? i}
              className={selected === r[rowKey] ? 'selected' : ''}
              onClick={onRow ? () => onRow(r) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.align || ''}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty title={empty} />}
      <div className="pagination">
        <span className="caption muted">
          {rows.length
            ? `${page * 10 + 1}–${Math.min((page + 1) * 10, rows.length)} of ${rows.length}`
            : '0 records'}
        </span>
        {pages > 1 && (
          <div className="row">
            <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
export const Breadcrumbs = ({ name }) => (
  <nav className="breadcrumb" aria-label="Breadcrumb">
    <Link to="/portal/dashboard">Workspace</Link>
    <ChevronRight size={12} />
    <span>{name}</span>
  </nav>
);
export const ViewLink = ({ to, children = 'View all' }) => (
  <Link className="row" to={to}>
    {children}
    <ArrowUpRight size={14} />
  </Link>
);
