import { useState, useEffect } from 'react';
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
  ClipboardList,
  History,
  ChevronsUpDown,
  Check,
  Building2,
} from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { authService } from '../../services/serviceFactory.js';
import { authentication } from '../../services/authentication.js';
import { managerRoles, financeRoles, staffRoles } from '../../services/permissions.js';
import { Avatar, Button, LinkButton, Loading } from '../common/UI.jsx';
export function Brand() {
  return (
    <Link
      to="/"
      className="brand"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
    >
      <img
        src="/images/clubsphere-logo.png"
        alt="ClubSphere Emblem"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        style={{ width: 30, height: 30, objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>ClubSphere</span>
      <span className="sr-only"> home</span>
    </Link>
  );
}

export function WorkspaceIdentity({ data, busy, run, navigate }) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const activeClub = data?.club;
  const multiClub = Array.isArray(data?.clubs) && data.clubs.length > 1;

  // Clean, professional title formatting for the campus club / department
  const clubTitle = activeClub?.initials
    ? `${activeClub.initials} · CSE Association`
    : activeClub?.name?.includes('MATRIX')
      ? 'CSE Association · MATRIX'
      : activeClub?.name || 'ClubSphere Workspace';

  const deptTag = activeClub?.settings?.department || 'Computer Science & Engineering';

  return (
    <div
      className="workspace-identity-container"
      style={{ position: 'relative', padding: '0 16px 18px' }}
    >
      {multiClub ? (
        <button
          type="button"
          className="workspace-switcher-btn"
          disabled={busy}
          onClick={() => setSwitcherOpen(!switcherOpen)}
          aria-expanded={switcherOpen}
          aria-haspopup="listbox"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'var(--slate-50, #f8fafc)',
            border: '1px solid var(--slate-200, #e2e8f0)',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.825rem',
                flexShrink: 0,
                boxShadow: '0 2px 5px rgba(14, 165, 233, 0.2)',
              }}
            >
              {activeClub?.initials || 'CS'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  color: 'var(--slate-900, #0f172a)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.25,
                }}
                title={activeClub?.name}
              >
                {clubTitle}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--slate-500, #64748b)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: 2,
                }}
              >
                {deptTag}
              </div>
            </div>
          </div>
          <ChevronsUpDown
            size={15}
            style={{ color: 'var(--slate-400, #94a3b8)', flexShrink: 0, marginLeft: 6 }}
          />
        </button>
      ) : (
        <div
          className="workspace-badge-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background:
              'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(37,99,235,0.03) 100%)',
            border: '1px solid rgba(14,165,233,0.18)',
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.825rem',
              flexShrink: 0,
              boxShadow: '0 2px 5px rgba(14, 165, 233, 0.25)',
            }}
          >
            {activeClub?.initials || 'CS'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.825rem',
                color: 'var(--slate-900, #0f172a)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.25,
              }}
              title={activeClub?.name}
            >
              {clubTitle}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: 'var(--slate-500, #64748b)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {deptTag}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Popover switcher if multiple clubs */}
      {multiClub && switcherOpen && (
        <div
          className="workspace-switcher-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 16,
            right: 16,
            zIndex: 50,
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid var(--slate-200, #e2e8f0)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            padding: '6px',
            marginTop: 4,
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              fontSize: '0.675rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--slate-400, #94a3b8)',
            }}
          >
            Available Clubs
          </div>
          {data.clubs.map((c) => {
            const isSelected = c.id === data.session.clubId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={async () => {
                  setSwitcherOpen(false);
                  if (!isSelected) {
                    await run(() => authService.switchClub(c.id), 'Active club changed');
                    navigate('/portal/dashboard');
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(14,165,233,0.08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#0284c7' : 'var(--slate-700, #334155)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name}
                  </div>
                </div>
                {isSelected && <Check size={14} style={{ color: '#0284c7', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
export function PublicShell() {
  const { data } = useApp();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={`public-shell${pathname === '/' ? ' landing-shell' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="public-header">
        <div className="public-header-inner">
          <Brand />
          <nav
            id="public-navigation"
            className={`public-nav ${menuOpen ? 'is-open' : ''}`}
            aria-label="Public navigation"
            onClick={() => setMenuOpen(false)}
          >
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
              Join a club
            </LinkButton>
            <Button
              icon
              className="public-menu-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="public-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={20} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="public-container">
        <Outlet />
      </main>
    </div>
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
  const root = `/dashboard/${data.club?.slug || 'nec-cse'}`;
  const manage = managerRoles.includes(data.role),
    finance = financeRoles.includes(data.role),
    staff = staffRoles.includes(data.role);
  const groups = [
    {
      name: 'Your workspace',
      icon: LayoutDashboard,
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
            icon: HeartHandshake,
            items: [
              ['Task board', manage ? `${root}/tasks` : '/portal/tasks', Columns3],
              [
                'Fundraisers',
                manage ? `${root}/fundraisers` : '/portal/fundraisers',
                HeartHandshake,
              ],
              ['Volunteer shifts', '/portal/shifts', CalendarDays],
              ['Expense claims', manage ? `${root}/expenses` : '/portal/expenses', Receipt],
              ['Door scanner', `/scanner/${data.events[0]?.id || 'synectics-26'}`, ScanLine],
            ],
          },
        ]
      : []),
    ...(manage
      ? [
          {
            name: 'Club operations',
            icon: Building2,
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
            icon: Wallet,
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
    ...([
      'ASSOCIATION_INCHARGE',
      'ASSOCIATION_COORDINATOR',
      'PRESIDENT',
      'ADMIN',
      'SUPER_ADMIN',
    ].includes(data.role)
      ? [
          {
            name: 'Administration',
            icon: Shield,
            items: [
              ['Club settings', `${root}/settings`, Settings],
              ['Roles & handover', `${root}/roles`, Shield],
              ['Membership plans', `${root}/plans`, CreditCard],
            ],
          },
        ]
      : []),
  ];

  const isRouteInGroup = (group, pathname) => {
    if (!group || !group.items) return false;
    return group.items.some(([_, path]) => {
      if (path === pathname) return true;
      if (path === '/portal/dashboard') return false;
      return pathname.startsWith(path + '/');
    });
  };

  const matchingGroup = groups.find((g) => isRouteInGroup(g, location.pathname));
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (matchingGroup) {
      setSelectedCategory(matchingGroup.name);
    }
  }, [location.pathname, matchingGroup?.name]);

  const activeCategoryName =
    selectedCategory && groups.some((g) => g.name === selectedCategory)
      ? selectedCategory
      : matchingGroup?.name || groups[0]?.name || 'Your workspace';

  const activeGroup = groups.find((g) => g.name === activeCategoryName) || groups[0];

  const handleSelectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    const target = groups.find((g) => g.name === categoryName);
    if (target && target.items.length > 0) {
      const alreadyInTarget = isRouteInGroup(target, location.pathname);
      if (!alreadyInTarget) {
        navigate(target.items[0][1]);
      }
    }
  };

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
        <div className="sidebar-header-gemini">
          <button
            type="button"
            className="gemini-hamburger-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => {
              if (window.innerWidth < 768) {
                setOpen(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={20} />
          </button>
          <div className="sidebar-brand-container">
            <Brand />
          </div>
        </div>
        <WorkspaceIdentity data={data} busy={busy} run={run} navigate={navigate} />

        {groups.length > 1 && (
          <div className="sidebar-gemini-categories">
            <div className="gemini-category-header">
              <span className="gemini-category-caption">Categories</span>
            </div>
            <div className="gemini-category-pill-list">
              {groups.map((group) => {
                const GIcon = group.icon;
                const isSelected = group.name === activeCategoryName;
                return (
                  <button
                    key={group.name}
                    type="button"
                    className={`gemini-cat-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectCategory(group.name)}
                    title={`${group.name} (${group.items.length})`}
                  >
                    <GIcon size={16} />
                    <span className="gemini-cat-text">{group.name}</span>
                    <span className="gemini-cat-badge">{group.items.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {activeGroup && (
            <>
              <div className="sidebar-active-domain-heading">
                <activeGroup.icon size={15} className="active-domain-icon" />
                <span className="active-domain-name">{activeGroup.name}</span>
              </div>

              <div className="sidebar-items-list">
                {activeGroup.items.map(([name, path, Icon]) => (
                  <NavLink
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    end={name === 'Overview' || path === '/events' || path === '/store'}
                    key={name}
                    to={path}
                    onClick={() => setOpen(false)}
                    title={name}
                  >
                    <Icon size={18} />
                    <span className="nav-item-label">{name}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}
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
              const result = await run(async () => {
                await authentication.signOut();
                return true;
              }, 'Signed out');
              if (result) navigate('/login', { replace: true });
            }}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
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
          </div>
          <div className="topbar-right">
            <span className="caption muted">{data.club?.fiscalYear || '2026–2027'}</span>
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
        <main id="main" className="page" key={location.pathname}>
          {loading ? <Loading /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
