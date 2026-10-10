import Preferences from './Preferences.jsx';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { authService } from '../../services/serviceFactory.js';
import { authentication, loadAuthenticatedWorkspace } from '../../services/authentication.js';
import { Card, PageHeader, Button, Notice, Avatar } from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import '../../styles/auth.css';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.7 4.7 0 0 1-2 3.1V20h3.3c1.9-1.8 2.9-4.4 2.9-7.8Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.7A10 10 0 0 0 12 22Z"
      />
      <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.5H3a10 10 0 0 0 0 9l3.4-2.7Z" />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.9 1.5L18.8 4A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.7C7.2 7.8 9.4 6 12 6Z"
      />
    </svg>
  );
}

function AuthenticationPage({ signup = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { authError, data, authenticationPending } = useApp();
  const { run, busy, error } = useAction();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [destination, setDestination] = useState(null);
  useEffect(() => {
    if (destination && !authenticationPending && data.role !== 'VISITOR')
      navigate(destination, { replace: true });
  }, [destination, authenticationPending, data.role, navigate]);
  const message =
    error ||
    authError ||
    (params.has('error') ? 'Google sign-in could not be completed. Please try again.' : null);

  async function submit(event) {
    event.preventDefault();
    const result = await run(
      async () => {
        const account = signup
          ? await authentication.signUp(name, email, password)
          : await authentication.signIn(email, password);
        if (!account?.user) throw new Error('Sign-in did not return an authenticated account.');
        await loadAuthenticatedWorkspace(account.user);
        return account;
      },
      signup ? 'Your account is ready' : 'Welcome back',
    );
    if (result) setDestination(signup ? '/membership' : '/portal/dashboard');
  }

  return (
    <section className="account-access" aria-labelledby="account-access-title">
      <header className="account-access-heading">
        <span className="eyebrow">Your campus. Your community.</span>
        <h1 id="account-access-title">{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p>
          {signup
            ? 'Make room for your next campus experience.'
            : 'Sign in to your ClubSphere workspace.'}
        </p>
      </header>
      <div className="account-access-card">
        {message && (
          <div role="alert">
            <Notice error>{message}</Notice>
          </div>
        )}
        <Button
          className="account-google"
          disabled={busy}
          onClick={() => run(authentication.google)}
        >
          <GoogleIcon /> Continue with Google
        </Button>
        <div className="account-divider">
          <span>or continue with email</span>
        </div>
        <form className="account-form" onSubmit={submit} aria-busy={busy}>
          {signup && (
            <div className="field">
              <label htmlFor="account-name">Full name</label>
              <input
                className="input"
                id="account-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={255}
                required
                disabled={busy}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="account-email">Email address</label>
            <input
              className="input"
              id="account-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
              disabled={busy}
            />
          </div>
          <div className="field">
            <label htmlFor="account-password">Password</label>
            <div className="account-password">
              <input
                className="input"
                id="account-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={signup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={signup ? 8 : undefined}
                maxLength={72}
                required
                disabled={busy}
                aria-describedby={signup ? 'password-hint' : undefined}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={busy}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            {signup && (
              <p className="caption muted" id="password-hint">
                Use 8–72 characters.
              </p>
            )}
          </div>
          <Button primary type="submit" disabled={busy}>
            {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        <p className="account-switch">
          {signup ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <Link to={signup ? '/login' : '/register'}>{signup ? 'Sign in' : 'Sign up'}</Link>
        </p>
      </div>
    </section>
  );
}

export function Login() {
  return <AuthenticationPage />;
}
export function Register() {
  return <AuthenticationPage signup />;
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
