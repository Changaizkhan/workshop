/** Page/module permissions — must match AdminUsersView checkboxes */
export const ALL_PERMISSIONS = [
  'dashboard',
  'inventory',
  'customers',
  'estimates',
  'jobs',
  'expenses',
  'investor',
  'reports',
  'approvals',
];

export const ADMIN_ONLY_TABS = ['admin-users'];

const ROLE_DEFAULTS = {
  ADMIN: ALL_PERMISSIONS,
  MANAGER: ['dashboard', 'inventory', 'customers', 'estimates', 'jobs', 'expenses', 'investor', 'reports', 'approvals'],
  STAFF: ['dashboard', 'inventory', 'customers', 'estimates', 'jobs'],
  USER: ['dashboard', 'jobs', 'estimates'],
};

/** Resolve effective permissions for a logged-in user */
export function getUserPermissions(user) {
  if (!user) return [];
  if (user.role === 'ADMIN') return [...ALL_PERMISSIONS];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.filter((p) => ALL_PERMISSIONS.includes(p));
  }
  return ROLE_DEFAULTS[user.role] || ['dashboard'];
}

export function canAccessTab(user, tab) {
  if (!user) return false;
  if (tab === 'admin-users') return user.role === 'ADMIN';
  return getUserPermissions(user).includes(tab);
}

export function firstAllowedTab(user) {
  const allowed = getUserPermissions(user);
  if (user?.role === 'ADMIN') return allowed[0] || 'dashboard';
  return allowed[0] || 'dashboard';
}
