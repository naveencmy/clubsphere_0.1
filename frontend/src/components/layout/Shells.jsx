import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CircleDot,
  LayoutDashboard,
  Users,
  CalendarDays,
  Ticket,
  ShoppingBag,
  CreditCard,
  ScanLine,
  Columns3,
  HeartHandshake,
  Megaphone,
  Receipt,
  Wallet,
  PieChart,
  Settings,
  Shield,
  Bell,
  Search,
  Menu,
  LogOut,
  FlaskConical,
  ClipboardList,
  History,
} from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { authService } from '../../services/serviceFactory.js';
import { managerRoles, financeRoles, staffRoles } from '../../services/permissions.js';
import { Avatar, Button, LinkButton, Loading } from '../common/UI.jsx';
export function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <CircleDot />
      </span>
      ClubSphere<span className="sr-only"> home</span>
    </Link>
  );
}
export function DemoStrip() {
  const { data } = useApp();
  const { run, busy } = useAction();
  const navigate = useNavigate();
  if (!data.demoControls) return null;
  return (
    <div className="demo-strip">
      <span>
        <FlaskConical size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Demo
        workspace · all payments and deliveries are simulated
      </span>
      <div className="row">
        <label htmlFor="demo-account">Demo account</label>
        <select
          id="demo-account"
          value={data.session.userId}
          disabled={busy}
          onChange={async (e) => {
            const result = await run(
              () => authService.login(e.target.value),
              'Demo account switched',
            );
            if (result) navigate(result.role === 'VISITOR' ? '/' : '/portal/dashboard');
          }}
        >
          {data.accounts.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name} · {a.role.replaceAll('_', ' ')}
            </option>
          ))}
          {!data.accounts.some((a) => a.id === data.session.userId) && (
            <option value={data.session.userId}>{data.user?.name}</option>
          )}
        </select>
        <Link to="/demo">Scenarios</Link>
      </div>
    </div>
  );
}
export function PublicShell() {
  const { data } = useApp();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="public-header">
        <div className="public-header-inner">
          <Brand />
          <nav className="public-nav" aria-label="Public navigation">
            <NavLink to="/clubs">Discover clubs</NavLink>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/store">Merchandise</NavLink>
            <NavLink to="/announcements">Announcements</NavLink>
          </nav>
          <div className="row">
            <LinkButton to={data.role === 'VISITOR' ? '/login' : '/portal/dashboard'}>
              {data.role === 'VISITOR' ? 'Log in' : 'My workspace'}
            </LinkButton>
            <LinkButton primary to="/membership">
              Become a member
            </LinkButton>
          </div>
        </div>
      </header>
      <DemoStrip />
      <main id="main" className="public-container">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="row between">
          <Brand />
          <span className="muted">Your campus. Your community. Connected.</span>
          <div className="row">
            <Link to="/membership">Membership</Link>
            <Link to="/clubs">Our clubs</Link>
            <Link to="/login">Get started</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
export function PortalShell() {
  const { data, loading } = useApp();
  const { run, busy } = useAction();
  const [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [query, setQuery] = useState('');
  const navigate = useNavigate(),
    location = useLocation();
  const root = `/dashboard/${data.club.slug}`;
  const manage = managerRoles.includes(data.role),
    finance = financeRoles.includes(data.role),
    staff = staffRoles.includes(data.role);
  const groups = [
    {
      name: 'Your workspace',
      items: [
        ['Overview', '/portal/dashboard', LayoutDashboard],
        ['My membership', '/portal/membership', CreditCard],
        ['Events', '/events', CalendarDays],
        ['My tickets', '/portal/tickets', Ticket],
        ['Merchandise', '/store', ShoppingBag],
        ['My orders', '/portal/orders', ShoppingBag],
        ['Announcements', '/portal/announcements', Megaphone],
        ['Notifications', '/portal/notifications', Bell],
      ],
    },
    ...(staff
      ? [
          {
            name: 'Get involved',
            items: [
              ['Task board', manage ? `${root}/tasks` : '/portal/tasks', Columns3],
              [
                'Fundraisers',
                manage ? `${root}/fundraisers` : '/portal/fundraisers',
                HeartHandshake,
              ],
              ['Volunteer shifts', '/portal/shifts', CalendarDays],
              ['Expense claims', manage ? `${root}/expenses` : '/portal/expenses', Receipt],
              ['Door scanner', `/scanner/${data.events[0]?.id || 'gala'}`, ScanLine],
            ],
          },
        ]
      : []),
    ...(manage
      ? [
          {
            name: 'Club operations',
            items: [
              ['Members', `${root}/members`, Users],
              ['Manage events', `${root}/events`, CalendarDays],
              ['Bookings & attendees', `${root}/bookings`, Ticket],
              ['Products & inventory', `${root}/inventory`, ShoppingBag],
              ['Orders & returns', `${root}/orders`, ClipboardList],
              ['Broadcast hub', `${root}/announcements`, Megaphone],
            ],
          },
        ]
      : []),
    ...(finance
      ? [
          {
            name: 'Finance & governance',
            items: [
              ['Financial overview', `${root}/finance`, Wallet],
              ['Financial ledger', `${root}/ledger`, Receipt],
              ['Budgets', `${root}/budgets`, PieChart],
              ['Reports', `${root}/reports`, PieChart],
              ['Audit history', `${root}/audit`, History],
            ],
          },
        ]
      : []),
    ...(['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR'].includes(data.role)
      ? [
          {
            name: 'Administration',
            items: [
              ['Club settings', `${root}/settings`, Settings],
              ['Roles & handover', `${root}/roles`, Shield],
              ['Membership plans', `${root}/plans`, CreditCard],
            ],
          },
        ]
      : []),
  ];
  async function search(e) {
    e.preventDefault();
    navigate(`/portal/search?q=${encodeURIComponent(query)}`);
  }
  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <button
        aria-label="Close navigation"
        className={`mobile-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Workspace navigation">
        <div className="sidebar-brand">
          <Brand />
        </div>
        <div className="club-select">
          <label className="sr-only" htmlFor="active-club">
            Active club
          </label>
          <select
            id="active-club"
            value={data.session.clubId}
            disabled={busy}
            onChange={async (e) => {
              await run(() => authService.switchClub(e.target.value), 'Active club changed');
              navigate('/portal/dashboard');
            }}
          >
            {data.clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <nav className="sidebar-nav">
          {groups.map((g) => (
            <div key={g.name}>
              <div className="nav-section">{g.name}</div>
              {g.items.map(([name, path, Icon]) => (
                <NavLink
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  end={name === 'Overview'}
                  key={name}
                  to={path}
                  onClick={() => setOpen(false)}
                >
                  <Icon />
                  <span>{name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/portal/profile" className="row">
            <Avatar name={data.user?.name} />
            <div>
              <strong>{data.user?.name}</strong>
              <p className="caption muted">{data.role.replaceAll('_', ' ').toLowerCase()}</p>
            </div>
          </Link>
          <button
            className="menu-button"
            disabled={busy}
            onClick={async () => {
              await run(() => authService.logout(), 'Signed out of demo');
              navigate('/');
            }}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <Button
            className="desktop-menu"
            icon
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={20} />
          </Button>
          <Button
            icon
            className="mobile-menu"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <form className="topbar-search" onSubmit={search}>
            <Search />
            <input
              className="input"
              aria-label="Search ClubSphere"
              placeholder="Search events, tasks, announcements…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <div className="topbar-right">
            <span className="caption muted">{data.club.fiscalYear}</span>
            <LinkButton to="/portal/notifications">
              <Bell size={18} />
              <span className="sr-only">Notifications</span>
              {data.notifications.filter((n) => !n.read).length || ''}
            </LinkButton>
            <Link className="profile-avatar" to="/portal/profile">
              <Avatar name={data.user?.name} />
            </Link>
          </div>
        </header>
        <DemoStrip />
        <main id="main" className="page" key={location.pathname}>
          {loading ? <Loading /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
