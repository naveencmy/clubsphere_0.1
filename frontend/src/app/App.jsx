import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './providers/AppProvider.jsx';
import { PublicShell, PortalShell } from '../components/layout/Shells.jsx';
import { Home, Clubs } from '../features/public/PublicPages.jsx';
import { Login, Register, Profile } from '../features/auth/AuthPages.jsx';
import Dashboard from '../features/dashboard/Dashboard.jsx';
import Membership from '../features/memberships/Membership.jsx';
import Events, { EventEditor, Tickets, EventOperations } from '../features/events/Events.jsx';
import Commerce, { Cart, Orders } from '../features/commerce/Commerce.jsx';
import Checkout from '../features/commerce/Checkout.jsx';
import Scanner from '../features/scanner/Scanner.jsx';
import Tasks from '../features/tasks/Tasks.jsx';
import Fundraisers from '../features/fundraisers/Fundraisers.jsx';
import Announcements from '../features/broadcast/Announcements.jsx';
import Expenses from '../features/expenses/Expenses.jsx';
import Finance, { Budgets } from '../features/finance/Finance.jsx';
import MemberAdmin from '../features/admin/MemberAdmin.jsx';
import Inventory from '../features/admin/Inventory.jsx';
import Administration from '../features/admin/Administration.jsx';
import Support, {
  DemoSettings,
  Notifications,
  SearchResults,
} from '../features/support/Support.jsx';
import { managerRoles, staffRoles, financeRoles } from '../services/permissions.js';
function Guard({ roles, children }) {
  const { data } = useApp();
  if (data.role === 'VISITOR') return <Navigate to="/login" replace />;
  if (roles && !roles.includes(data.role)) return <Navigate to="/unauthorized" replace />;
  return children || <Outlet />;
}
function ClubGuard() {
  const { data } = useApp(),
    { club } = useParams();
  return club !== data.club.slug ? <Navigate to="/unauthorized" replace /> : <Outlet />;
}
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="page stack">
          <h1>We couldn’t render this view.</h1>
          <p>{this.state.error.message}</p>
          <button
            className="btn primary"
            onClick={() => {
              this.setState({ error: null });
              window.location.href = '/';
            }}
          >
            Recover to home
          </button>
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicShell />}>
              <Route index element={<Home />} />
              <Route path="clubs" element={<Clubs />} />
              <Route path="clubs/:slug" element={<Clubs />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<Events />} />
              <Route path="membership" element={<Membership />} />
              <Route path="store" element={<Commerce />} />
              <Route path="store/:id" element={<Commerce />} />
              <Route path="cart" element={<Cart />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="demo" element={<DemoSettings />} />
              <Route path="unauthorized" element={<Support unauthorized />} />
              <Route path="support/:state" element={<Support />} />
              <Route path="*" element={<Support />} />
            </Route>
            <Route element={<Guard />}>
              <Route element={<PortalShell />}>
                <Route path="portal/dashboard" element={<Dashboard />} />
                <Route path="portal/profile" element={<Profile />} />
                <Route path="portal/membership" element={<Membership />} />
                <Route path="portal/pass" element={<Membership />} />
                <Route path="portal/renew" element={<Membership />} />
                <Route path="portal/tickets" element={<Tickets />} />
                <Route path="portal/tickets/:id" element={<Tickets />} />
                <Route path="portal/orders" element={<Orders />} />
                <Route path="portal/orders/:id" element={<Orders />} />
                <Route path="portal/announcements" element={<Announcements />} />
                <Route path="portal/notifications" element={<Notifications />} />
                <Route path="portal/search" element={<SearchResults />} />
                <Route path="checkout/:kind/:id" element={<Checkout />} />
                <Route element={<Guard roles={staffRoles} />}>
                  <Route path="portal/tasks" element={<Tasks />} />
                  <Route path="portal/tasks/:id" element={<Tasks />} />
                  <Route path="portal/fundraisers" element={<Fundraisers />} />
                  <Route path="portal/shifts" element={<Fundraisers />} />
                  <Route path="portal/expenses" element={<Expenses />} />
                  <Route path="portal/expenses/new" element={<Expenses />} />
                  <Route path="portal/expenses/:id" element={<Expenses />} />
                </Route>
                <Route path="dashboard/:club" element={<ClubGuard />}>
                  <Route index element={<Dashboard />} />
                  <Route element={<Guard roles={managerRoles} />}>
                    <Route path="members" element={<MemberAdmin />} />
                    <Route path="members/:id" element={<MemberAdmin />} />
                    <Route path="events" element={<Events />} />
                    <Route path="events/new" element={<EventEditor />} />
                    <Route path="events/:id/edit" element={<EventEditor />} />
                    <Route path="bookings" element={<EventOperations />} />
                    <Route path="attendees" element={<EventOperations />} />
                    <Route path="event-reports" element={<EventOperations />} />
                    <Route path="products" element={<Inventory />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<Orders />} />
                    <Route path="returns" element={<Orders />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="tasks/:id" element={<Tasks />} />
                    <Route path="fundraisers" element={<Fundraisers />} />
                    <Route path="shifts" element={<Fundraisers />} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="broadcasts" element={<Announcements />} />
                    <Route path="deliveries" element={<Announcements />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="expenses/:id" element={<Expenses />} />
                    <Route path="approvals" element={<Expenses />} />
                  </Route>
                  <Route element={<Guard roles={financeRoles} />}>
                    <Route path="finance" element={<Finance />} />
                    <Route path="ledger" element={<Finance />} />
                    <Route path="budgets" element={<Budgets />} />
                    <Route path="reports" element={<Finance />} />
                    <Route path="audit" element={<Administration />} />
                  </Route>
                  <Route element={<Guard roles={['PRESIDENT']} />}>
                    <Route path="settings" element={<Administration />} />
                    <Route path="roles" element={<Administration />} />
                    <Route path="plans" element={<MemberAdmin />} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route
              path="scanner/:eventId"
              element={
                <Guard roles={staffRoles}>
                  <Scanner />
                </Guard>
              }
            />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
