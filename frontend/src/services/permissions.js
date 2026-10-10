export const staffRoles = ['VOLUNTEER', 'COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'PRESIDENT'];
export const managerRoles = ['COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'PRESIDENT'];
export const financeRoles = ['TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'AUDITOR', 'PRESIDENT'];
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
  publish: ['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR', 'PRESIDENT'],
  reviewBroadcast: ['TREASURER', 'ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR', 'PRESIDENT'],
  settings: ['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR', 'PRESIDENT'],
  inventory: managerRoles,
};
