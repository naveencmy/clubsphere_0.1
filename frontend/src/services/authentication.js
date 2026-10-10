import { authClient } from './authClient.js';
import { store } from '../mock/mockStore.js';

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
    const club = next.clubs.find((record) => record.slug === membership.club_slug);
    if (!club) continue;
    next.memberships.push({
      id: membership.id,
      userId: user.id,
      clubId: club.id,
      role: membership.role,
      tier: membership.tier,
      status: membership.status === 'PENDING_PAYMENT' ? 'PENDING' : membership.status,
      validFrom: membership.valid_from,
      validUntil: membership.valid_until,
      dues: membership.dues_paid_cents,
    });
  }
  next.session.userId = user.id;
  store.commit(next);
  return {
    userId: user.id,
    roles: Object.fromEntries(
      next.memberships
        .filter((record) => record.userId === user.id)
        .map((record) => [record.clubId, record.role]),
    ),
    defaultRole: user.systemRole === 'CAMPUS_AUDITOR' ? 'AUDITOR' : 'STUDENT',
  };
}

async function unwrap(operation) {
  const result = await operation;
  if (result.error?.code === 'PROVIDER_NOT_FOUND')
    throw new Error('Google sign-in is not available yet. Please use your email and password.');
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
