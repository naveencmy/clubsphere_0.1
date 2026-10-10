export const staffRoles = ['VOLUNTEER', 'COMMITTEE_LEAD', 'TREASURER', 'PRESIDENT'];
export const managerRoles = ['COMMITTEE_LEAD', 'TREASURER', 'PRESIDENT'];
export const financeRoles = ['TREASURER', 'PRESIDENT', 'AUDITOR'];
export const taskStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
export function roleFor(state) {
  const user = state.users.find((u) => u.id === state.session.userId);
  if (!user) return 'VISITOR';
  if (user.role === 'AUDITOR') return 'AUDITOR';
  return (
    state.memberships.find((m) => m.userId === user.id && m.clubId === state.session.clubId)
      ?.role || (user.role === 'VISITOR' ? 'VISITOR' : 'STUDENT')
  );
}
export function eligible(m, now) {
  return (
    !!m &&
    ['ACTIVE', 'RENEWAL_DUE', 'GRACE_PERIOD'].includes(m.status) &&
    new Date(m.validUntil).getTime() + 14 * 86400000 > now
  );
}
export const permissions = {
  manage: managerRoles,
  finance: financeRoles,
  scanner: staffRoles,
  expense: staffRoles,
  publish: ['PRESIDENT'],
  reviewBroadcast: ['TREASURER', 'PRESIDENT'],
  settings: ['PRESIDENT'],
  inventory: managerRoles,
};
