export const staffRoles = ['VOLUNTEER', 'COMMITTEE_LEAD', 'TREASURER', 'SECRETARY', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'PRESIDENT'];
export const managerRoles = ['COMMITTEE_LEAD', 'TREASURER', 'SECRETARY', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'PRESIDENT'];
export const financeRoles = ['TREASURER', 'SECRETARY', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'AUDITOR', 'PRESIDENT'];
export const taskStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
export function roleFor(state) {
  const user = state.users.find((u) => u.id === state.session.userId);
  if (!user) return 'VISITOR';
  if (user.role === 'AUDITOR' || user.systemRole === 'CAMPUS_AUDITOR') return 'AUDITOR';
  const found = state.memberships.find(
    (m) =>
      m.userId === user.id &&
      (m.clubId === state.session.clubId ||
        m.clubId === 'nec-cse' ||
        m.clubId === 'c0000000-0000-0000-0000-000000000001' ||
        m.clubSlug === 'nec-cse')
  );
  return found?.role || (user.role === 'VISITOR' ? 'VISITOR' : 'STUDENT');
}
export function eligible(m, now = Date.now()) {
  if (!m) return false;
  if (!['ACTIVE', 'RENEWAL_DUE', 'GRACE_PERIOD', 'PAID'].includes(m.status)) return false;
  if (!m.validUntil) return true;
  const time = new Date(m.validUntil).getTime();
  if (isNaN(time)) return true;
  return m.status === 'ACTIVE' || (time + 14 * 86400000 > now);
}
export const permissions = {
  manage: managerRoles,
  finance: financeRoles,
  scanner: staffRoles,
  expense: staffRoles,
  publish: ['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR', 'SECRETARY', 'PRESIDENT'],
  reviewBroadcast: ['TREASURER', 'ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR', 'SECRETARY', 'PRESIDENT'],
  settings: ['ASSOCIATION_INCHARGE', 'ASSOCIATION_COORDINATOR', 'SECRETARY', 'PRESIDENT'],
  inventory: managerRoles,
};
