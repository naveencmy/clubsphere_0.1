import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { demoService, notificationService } from '../../services/serviceFactory.js';
import { edgeCases } from '../../mock/scenarios/edgeCases.js';
import {
  Card,
  PageHeader,
  Button,
  LinkButton,
  Notice,
  Empty,
  Loading,
  Badge,
  Confirm,
} from '../../components/common/UI.jsx';
import { datetime } from '../../utils/format.js';
export function DemoSettings() {
  const { data } = useApp(),
    { run, busy } = useAction();
  const [scenario, setScenario] = useState('grace'),
    [reset, setReset] = useState(false);
  if (!data.demoControls) return <Notice>Demo controls are disabled in this build.</Notice>;
  return (
    <div className="stack">
      <PageHeader
        title="Demo workspace settings"
        description="Reproducible scenarios, shared state and a clean slate whenever you need it."
      />
      <Card>
        <div className="card-body stack">
          <Notice>
            These controls modify local prototype data. All roles, payments, messages and QR
            verification are simulations.
          </Notice>
          <p>
            Current demo time:{' '}
            <time className="mono" dateTime={new Date(data.clock).toISOString()}>
              {datetime(data.clock)}
            </time>{' '}
            · Asia/Kolkata
          </p>
          <div className="field">
            <label htmlFor="scenario">Scenario</label>
            <select id="scenario" value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {edgeCases.map(([value, name]) => (
                <option value={value} key={value}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <Button
            primary
            disabled={busy}
            onClick={async () => {
              const r = await run(() => demoService.scenario(scenario));
              if (r) run(async () => r, r.message);
            }}
          >
            Apply scenario
          </Button>
          <div className="row">
            <Button
              disabled={busy}
              onClick={() =>
                run(() => demoService.advance(7 * 86400000), 'Demo clock advanced by seven days')
              }
            >
              Advance 7 days
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                run(() => demoService.advance(15 * 86400000), 'Demo clock advanced by fifteen days')
              }
            >
              Advance 15 days
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                run(() => demoService.advance(601000), 'Ten-minute checkout holds expired')
              }
            >
              Expire checkout holds
            </Button>
          </div>
          <Button danger disabled={busy} onClick={() => setReset(true)}>
            Reset demo data
          </Button>
        </div>
      </Card>
      {reset && (
        <Confirm
          title="Reset this demo workspace?"
          description="Local transactions, tasks, uploads and revisions will be replaced with the original fixtures. Your selected account and club remain selected."
          busy={busy}
          onClose={() => setReset(false)}
          onConfirm={async () => {
            await run(() => demoService.reset(), 'Demo data reset');
            setReset(false);
          }}
        />
      )}
    </div>
  );
}
export function Notifications() {
  const { data } = useApp(),
    { run, busy } = useAction();
  return (
    <div className="stack">
      <PageHeader
        title="Your community, in the loop."
        description="Tickets, membership reminders and the updates that matter."
      />
      {data.notifications.toReversed().map((n) => (
        <Card key={n.id}>
          <div className="card-body stack small">
            <div className="row between">
              <h3>{n.title}</h3>
              <Badge tone={n.read ? '' : 'info'}>{n.read ? 'Read' : 'New'}</Badge>
            </div>
            <p className="muted">{n.body}</p>
            <time className="caption muted" dateTime={n.at}>
              {datetime(n.at)}
            </time>
            <div className="row">
              <LinkButton to={n.link || '/portal/dashboard'}>Open details</LinkButton>
              {!n.read && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(() => notificationService.read(n.id), 'Notification marked as read')
                  }
                >
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
      {!data.notifications.length && (
        <Empty title="You’re all caught up" description="New community updates will appear here." />
      )}
    </div>
  );
}
export function SearchResults() {
  const { data } = useApp(),
    location = useLocation(),
    query = new URLSearchParams(location.search).get('q') || '';
  const root = `/dashboard/${data.club.slug}`;
  const matches = [
    ...data.events.map((e) => ({ id: e.id, title: e.title, type: 'Event', to: `/events/${e.id}` })),
    ...data.announcements.map((a) => ({
      id: a.id,
      title: a.title,
      type: 'Announcement',
      to: '/portal/announcements',
    })),
    ...data.products.map((p) => ({
      id: p.id,
      title: p.title,
      type: 'Merchandise',
      to: `/store/${p.id}`,
    })),
    ...data.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: 'Task',
      to: data.role === 'VOLUNTEER' ? '/portal/tasks' : `${root}/tasks`,
    })),
  ].filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="stack">
      <PageHeader
        title={`Search results for “${query}”`}
        description={`${matches.length} results in your current club.`}
      />
      {matches.map((r) => (
        <Card key={r.id}>
          <div className="card-body row between">
            <div>
              <Badge>{r.type}</Badge>
              <h3>{r.title}</h3>
            </div>
            <LinkButton to={r.to}>Open</LinkButton>
          </div>
        </Card>
      ))}
      {!matches.length && (
        <Empty
          title="No matches found"
          description="Try a shorter search or switch your active club."
        />
      )}
    </div>
  );
}
export default function Support({ unauthorized = false }) {
  const { state } = useParams();
  return (
    <div className="stack">
      <PageHeader
        title={
          unauthorized
            ? 'This space needs a different role.'
            : state
              ? 'Shared interface states'
              : 'That page isn’t here.'
        }
        description={
          unauthorized
            ? 'Your current role cannot access this workflow. Use an authorized demo account to continue.'
            : 'Find your way back to your campus community.'
        }
      />
      {state === 'loading' ? (
        <Loading />
      ) : state === 'error' ? (
        <Notice tone="error">Demo error state. Retry by returning to your workspace.</Notice>
      ) : (
        <Empty
          title={
            unauthorized
              ? 'Access denied'
              : state === 'empty'
                ? 'Nothing here yet'
                : 'Page not found'
          }
          action={
            <LinkButton primary to="/portal/dashboard">
              Back to workspace
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
