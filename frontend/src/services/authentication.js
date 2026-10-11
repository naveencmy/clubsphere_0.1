import { authClient } from './authClient.js';
import { store } from './store.js';

export function clearAuthentication() {
  const next = structuredClone(store.get());
  next.session.userId = 'visitor';
  store.commit(next);
}

export async function loadAuthenticatedWorkspace(user) {
  const response = await fetch('/api/auth/workspace', { credentials: 'include' });
  if (!response.ok) throw new Error('Your workspace could not be loaded. Please sign in again.');
  const workspace = await response.json();
  if (workspace.userId !== user.id) throw new Error('The session identity could not be verified.');
  const next = structuredClone(store.get());
  const profile = workspace.profile || {};
  const authenticatedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role:
      user.systemRole === 'CAMPUS_AUDITOR' && !workspace.memberships.length ? 'AUDITOR' : 'STUDENT',
    studentId: profile.student_id_number || '',
    major: profile.academic_major || '',
    graduation: profile.graduation_year || '',
    emergency: profile.emergency_contact_name || '',
    phone: profile.emergency_contact_phone || '',
  };
  const existing = next.users.findIndex((record) => record.id === user.id);
  if (existing === -1) next.users.push(authenticatedUser);
  else next.users[existing] = { ...next.users[existing], ...authenticatedUser };
  next.memberships = next.memberships.filter((record) => record.userId !== user.id);
  for (const membership of workspace.memberships) {
    const club = next.clubs.find(
      (record) => record.slug === membership.club_slug || record.id === membership.club_slug || record.slug === 'nec-cse'
    );
    const clubId = club ? club.id : 'nec-cse';
    next.memberships.push({
      id: membership.id,
      userId: user.id,
      clubId,
      clubSlug: membership.club_slug || 'nec-cse',
      role: membership.role,
      tier: membership.tier || 'STANDARD',
      status: membership.status === 'PENDING_PAYMENT' ? 'PENDING' : (membership.status || 'ACTIVE'),
      passCode: membership.pass_code || membership.qr_secret_token || `PASS-${membership.id}`,
      validFrom: membership.valid_from || new Date().toISOString(),
      validUntil: membership.valid_until || new Date(Date.now() + 365 * 86400000).toISOString(),
      dues: membership.dues_paid_cents || 50000,
    });
  }
  next.session.userId = user.id;
  store.commit(next);

  const roles = {};
  for (const record of next.memberships.filter((m) => m.userId === user.id)) {
    roles[record.clubId] = record.role;
    roles['nec-cse'] = record.role;
    roles['c0000000-0000-0000-0000-000000000001'] = record.role;
  }

  return {
    userId: user.id,
    roles,
    defaultRole: user.systemRole === 'CAMPUS_AUDITOR' ? 'AUDITOR' : 'STUDENT',
  };
}

async function unwrap(operation) {
  const result = await operation;
  if (
    result.error?.code === 'PROVIDER_NOT_FOUND' ||
    result.error?.message?.includes('Provider not found')
  )
    throw new Error(
      'Google Sign-In requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configured in backend/.env. Please sign in with your email and password.',
    );
  if (result.error)
    throw new Error(result.error.message || 'Sign-in could not be completed. Try again.');
  return result.data;
}

export const authentication = {
  signIn: (email, password) => unwrap(authClient.signIn.email({ email: email.trim(), password })),
  signUp: (name, email, password) =>
    unwrap(authClient.signUp.email({ name: name.trim(), email: email.trim(), password })),
  google: () =>
    unwrap(
      authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/portal/dashboard`,
        errorCallbackURL: `${window.location.origin}/login?error=google`,
      }),
    ),
  async signOut() {
    await unwrap(authClient.signOut());
    clearAuthentication();
  },
};
