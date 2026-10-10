import { useState } from 'react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { authService } from '../../services/serviceFactory.js';
import { useAction } from '../../hooks/useAction.js';
import { Card, Button, Notice } from '../../components/common/UI.jsx';
export default function Preferences() {
  const { data } = useApp(),
    { run, busy } = useAction();
  const [values, setValues] = useState(
    data.user.preferences || { renewals: true, announcements: true, orderUpdates: true },
  );
  return (
    <Card title="Notification preferences">
      <div className="card-body stack">
        <Notice>These preferences affect simulated notifications. No email is sent.</Notice>
        {[
          ['renewals', 'Membership renewal reminders'],
          ['announcements', 'Published community announcements'],
          ['orderUpdates', 'Ticket and order updates'],
        ].map(([key, label]) => (
          <label className="checkbox-label" key={key}>
            <input
              type="checkbox"
              checked={values[key]}
              onChange={(e) => setValues({ ...values, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
        <div>
          <Button
            primary
            disabled={busy}
            onClick={() =>
              run(() => authService.savePreferences(values), 'Notification preferences saved')
            }
          >
            Save preferences
          </Button>
        </div>
      </div>
    </Card>
  );
}
