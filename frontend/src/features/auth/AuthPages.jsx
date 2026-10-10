import Preferences from './Preferences.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { authService } from '../../services/serviceFactory.js';
import {
  Card,
  PageHeader,
  Button,
  Notice,
  Avatar,
  LinkButton,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
export function Login() {
  const { data } = useApp(),
    { run, busy } = useAction(),
    navigate = useNavigate();
  const [selected, setSelected] = useState('member');
  return (
    <div className="auth-container stack">
      <PageHeader title="Welcome back." description="Your campus community is right here." />
      <Card>
        <div className="card-body stack">
          <Notice>
            This prototype signs in with a demo account. No passwords or production credentials are
            collected.
          </Notice>
          <div className="field">
            <label htmlFor="login-account">Choose your demo account</label>
            <select
              id="login-account"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {data.accounts
                .filter((a) => a.role !== 'VISITOR')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.role.replaceAll('_', ' ')}
                  </option>
                ))}
            </select>
          </div>
          <Button
            primary
            disabled={busy}
            onClick={async () => {
              const value = await run(
                () => authService.login(selected),
                'Welcome to your demo workspace',
              );
              if (value) navigate('/portal/dashboard');
            }}
          >
            Enter workspace
          </Button>
          <LinkButton to="/register">New here? Create a profile</LinkButton>
        </div>
      </Card>
    </div>
  );
}
export const profileFields = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'email', label: 'Campus email', type: 'email', required: true },
  { name: 'studentId', label: 'Student ID · SKY-2026-001', required: true },
  { name: 'major', label: 'Academic major', required: true },
  { name: 'graduation', label: 'Graduation year', type: 'number', required: true },
  { name: 'emergency', label: 'Emergency contact name', required: true },
  { name: 'phone', label: 'Emergency contact phone · 10 digits', required: true },
];
export function Register() {
  const { toast } = useApp(),
    navigate = useNavigate();
  return (
    <div className="auth-container stack">
      <PageHeader
        title="A new chapter starts here."
        description="Create your demo student profile, then choose your club membership."
      />
      <Card>
        <div className="card-body stack">
          <Notice>
            Local demo registration. Use example information; no production account is created.
          </Notice>
          <RecordForm
            fields={profileFields}
            submitLabel="Create demo profile"
            onSubmit={async (value) => {
              await authService.register({ ...value, graduation: Number(value.graduation) });
              toast('Your demo profile is ready');
              navigate('/membership');
            }}
          />
        </div>
      </Card>
    </div>
  );
}
export function Profile() {
  const { data, toast } = useApp();
  return (
    <div className="stack">
      <PageHeader title="My profile" description="The details that make your membership yours." />
      <Card>
        <div className="card-body stack">
          <div className="row">
            <Avatar name={data.user.name} large />
            <div>
              <h2>{data.user.name}</h2>
              <p className="mono muted">{data.user.studentId}</p>
            </div>
          </div>
          <RecordForm
            fields={profileFields}
            initial={data.user}
            onSubmit={async (value) => {
              await authService.updateProfile(value);
              toast('Profile updated');
            }}
          />
        </div>
      </Card>
      <Preferences />
    </div>
  );
}
