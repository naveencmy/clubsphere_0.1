import PresidentOverview from './PresidentOverview.jsx';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Ticket,
  ShoppingBag,
  Users,
  ArrowRight,
  CreditCard,
  Receipt,
  Columns3,
  HeartHandshake,
} from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { managerRoles, staffRoles } from '../../services/permissions.js';
import {
  Card,
  PageHeader,
  Metric,
  Badge,
  LinkButton,
  ViewLink,
  Currency,
  Empty,
  Progress,
} from '../../components/common/UI.jsx';
import { date } from '../../utils/format.js';
import Finance from '../finance/Finance.jsx';
export default function Dashboard() {
  const { data } = useApp();
  if (['TREASURER', 'AUDITOR'].includes(data.role)) return <Finance dashboard />;
  const manage = managerRoles.includes(data.role),
    volunteer = data.role === 'VOLUNTEER',
    root = `/dashboard/${data.club.slug}`,
    ownTickets = data.tickets.filter((t) => t.userId === data.user.id),
    ownOrders = data.orders.filter((o) => o.userId === data.user.id),
    mine = data.tasks.filter((t) => t.assignee === data.user.id);
  const dayLeft = data.membership
    ? Math.ceil((new Date(data.membership.validUntil) - data.clock) / 86400000)
    : 0;
  return (
    <div className="stack">
      <PageHeader
        title={
          manage ? 'A clear view of your community.' : `Hello, ${data.user.name.split(' ')[0]}.`
        }
        description={`${data.club.name} · ${manage ? 'Your club’s people, progress and upcoming moments.' : volunteer ? 'Make good things happen. Here’s where you can help.' : 'A little less admin. A little more campus life.'}`}
      >
        <LinkButton primary to={manage ? `${root}/events/new` : '/events'}>
          <CalendarDays size={16} />
          {manage ? 'Create an event' : 'Explore events'}
        </LinkButton>
      </PageHeader>
      {data.role === 'PRESIDENT' && <PresidentOverview />}
      <section className="welcome">
        <div className="stack small">
          <span className="eyebrow">{data.club.fiscalYear} · YOUR COMMUNITY</span>
          <h2>
            {manage
              ? 'Good things happen when we’re organized.'
              : volunteer
                ? 'Your time makes a difference.'
                : 'Your community is waiting for you.'}
          </h2>
          <p>
            {manage
              ? 'Keep an eye on your upcoming events, support your volunteers and make every club moment count.'
              : volunteer
                ? 'Your tasks, shifts and reimbursements are connected. Pick up where you left off.'
                : 'Your membership, your next event and the people you’ll meet — all in one place.'}
          </p>
        </div>
        <LinkButton to={manage ? `${root}/tasks` : volunteer ? '/portal/tasks' : '/portal/pass'}>
          {manage ? 'Open task board' : volunteer ? 'View my tasks' : 'View my member pass'}
          <ArrowRight size={16} />
        </LinkButton>
      </section>
      <div className="grid four">
        {manage ? (
          <>
            <Metric
              label="Club members"
              value={data.memberships.length}
              icon={Users}
              detail={`${data.memberships.filter((m) => m.status === 'ACTIVE').length} active memberships`}
            />
            <Metric
              label="Upcoming events"
              value={data.events.filter((e) => new Date(e.startsAt) > data.clock).length}
              icon={CalendarDays}
              detail="Published and planned experiences"
            />
            <Metric
              label="Confirmed tickets"
              value={data.tickets.filter((t) => ['ISSUED', 'CHECKED_IN'].includes(t.status)).length}
              icon={Ticket}
              detail={`${data.tickets.filter((t) => t.status === 'CHECKED_IN').length} checked in`}
            />
            <Metric
              label="Open tasks"
              value={data.tasks.filter((t) => t.status !== 'DONE').length}
              icon={Columns3}
              detail={`${data.tasks.filter((t) => t.status === 'BLOCKED').length} need attention`}
            />
          </>
        ) : volunteer ? (
          <>
            <Metric
              label="Assigned tasks"
              value={mine.filter((t) => t.status !== 'DONE').length}
              icon={Columns3}
            />
            <Metric
              label="Your shifts"
              value={data.shifts.filter((s) => s.userId === data.user.id).length}
              icon={CalendarDays}
            />
            <Metric label="Expense claims" value={data.expenses.length} icon={Receipt} />
            <Metric label="Your tickets" value={ownTickets.length} icon={Ticket} />
          </>
        ) : (
          <>
            <Metric
              label="Membership"
              value={<Badge value={data.membership?.status || 'NOT_REGISTERED'} />}
              icon={CreditCard}
              detail={
                data.membership
                  ? `${Math.max(0, dayLeft)} days until renewal`
                  : 'Find a plan that fits you'
              }
            />
            <Metric
              label="Your tickets"
              value={ownTickets.filter((t) => ['ISSUED', 'CHECKED_IN'].includes(t.status)).length}
              icon={Ticket}
              detail="Ready for your next experience"
            />
            <Metric
              label="Your orders"
              value={ownOrders.length}
              icon={ShoppingBag}
              detail="Campus essentials, made for you"
            />
            <Metric
              label="Unread updates"
              value={data.notifications.filter((n) => !n.read).length}
              icon={Users}
              detail="The latest from your club"
            />
          </>
        )}
      </div>
      <div className="quick-actions">
        {(volunteer
          ? [
              ['My tasks', '/portal/tasks', Columns3],
              ['Find a shift', '/portal/shifts', CalendarDays],
              ['Submit an expense', '/portal/expenses/new', Receipt],
              ['Fundraisers', '/portal/fundraisers', HeartHandshake],
            ]
          : manage
            ? [
                ['Manage members', `${root}/members`, Users],
                ['Event operations', `${root}/bookings`, Ticket],
                ['Expense approvals', `${root}/expenses`, Receipt],
                ['Broadcast hub', `${root}/announcements`, Users],
              ]
            : [
                ['Digital member pass', '/portal/pass', CreditCard],
                ['My tickets', '/portal/tickets', Ticket],
                ['Shop merchandise', '/store', ShoppingBag],
                ['Latest announcements', '/portal/announcements', Users],
              ]
        ).map(([title, to, Icon]) => (
          <Link className="quick-action" to={to} key={title}>
            <Icon />
            {title}
            <ArrowRight size={14} />
          </Link>
        ))}
      </div>
      <div className="grid two">
        <Card
          title={volunteer ? 'Your next tasks' : 'Coming up on campus'}
          action={<ViewLink to={volunteer ? '/portal/tasks' : '/events'} />}
        >
          {volunteer ? (
            mine.length ? (
              mine.map((t) => (
                <div className="list-item" key={t.id}>
                  <div>
                    <h3>{t.title}</h3>
                    <p>Due {date(t.due)}</p>
                  </div>
                  <Badge value={t.status} />
                </div>
              ))
            ) : (
              <Empty title="No assigned tasks" />
            )
          ) : (
            data.events.slice(0, 3).map((e) => (
              <div className="list-item" key={e.id}>
                <div className="row">
                  <div className="date-tile">
                    <span>
                      {new Date(e.startsAt).toLocaleString('en-IN', {
                        month: 'short',
                        timeZone: 'Asia/Kolkata',
                      })}
                    </span>
                    <strong>{new Date(e.startsAt).getUTCDate()}</strong>
                  </div>
                  <div>
                    <h3>
                      <Link to={`/events/${e.id}`}>{e.title}</Link>
                    </h3>
                    <p>{e.venue}</p>
                  </div>
                </div>
                <Badge>{e.category}</Badge>
              </div>
            ))
          )}
        </Card>
        <Card title="From your community" action={<ViewLink to="/portal/announcements" />}>
          {data.announcements.slice(0, 3).map((a) => (
            <article className="list-item" key={a.id}>
              <div>
                <p>
                  <time dateTime={a.publishedAt || a.updatedAt}>
                    {date(a.publishedAt || a.updatedAt)}
                  </time>
                </p>
                <h3>
                  <Link to="/portal/announcements">{a.title}</Link>
                </h3>
              </div>
              {a.pinned && <Badge tone="info">Pinned</Badge>}
            </article>
          ))}
          {!data.announcements.length && <Empty title="No announcements yet" />}
        </Card>
      </div>
      <div className="grid two">
        <Card
          title={manage ? 'Fundraiser progress' : 'Your membership'}
          action={<ViewLink to={manage ? `${root}/fundraisers` : '/portal/membership'} />}
        >
          {manage ? (
            <div className="card-body stack small">
              {data.fundraisers.map((f) => (
                <div className="stack small" key={f.id}>
                  <strong>{f.title}</strong>
                  <div className="row between">
                    <Currency amount={data.raised[f.id]} />
                    <span className="caption muted">
                      of <Currency amount={f.target} />
                    </span>
                  </div>
                  <Progress value={((data.raised[f.id] || 0) / f.target) * 100} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-body stack small">
              <div className="row between">
                <strong>{data.membership?.tier || 'Join your community'}</strong>
                <Badge value={data.membership?.status || 'NOT_REGISTERED'} />
              </div>
              <p className="muted">
                {data.membership
                  ? `Valid until ${date(data.membership.validUntil)}. Your benefits travel with you.`
                  : 'Join to unlock member ticket pricing, merchandise savings and your digital pass.'}
              </p>
              <LinkButton to={data.membership ? '/portal/renew' : '/membership'}>
                {data.membership ? 'Renew membership' : 'Explore plans'}
              </LinkButton>
            </div>
          )}
        </Card>
        <Card
          title="Recent orders"
          action={<ViewLink to={manage ? `${root}/orders` : '/portal/orders'} />}
        >
          {(manage ? data.orders : ownOrders).slice(0, 3).map((o) => (
            <div className="list-item" key={o.id}>
              <div>
                <h3>
                  <Link className="mono" to={`/portal/orders/${o.id}`}>
                    {o.id}
                  </Link>
                </h3>
                <p>
                  {date(o.createdAt)} · <Currency amount={o.amount} />
                </p>
              </div>
              <Badge value={o.status} />
            </div>
          ))}
          {!ownOrders.length && !manage && (
            <Empty
              title="Your first campus essential awaits"
              action={<LinkButton to="/store">Browse merchandise</LinkButton>}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
