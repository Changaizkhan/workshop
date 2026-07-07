import { firstAllowedTab } from './permissions';

export const TAB_ROUTES = {
  dashboard: '/dashboard',
  inventory: '/inventory',
  customers: '/customers',
  estimates: '/estimates',
  jobs: '/jobs',
  expenses: '/expenses',
  investor: '/investor',
  reports: '/reports',
  approvals: '/approvals',
  'admin-users': '/admin/users',
};

export const tabToPath = (tab) => TAB_ROUTES[tab] ?? '/dashboard';

export const pathToTab = (pathname) => {
  const match = Object.entries(TAB_ROUTES).find(([, path]) => path === pathname);
  return match?.[0] ?? null;
};

export const firstAllowedPath = (user) => tabToPath(firstAllowedTab(user));

/** Only fetch datasets needed for the current page (+ shared header/sidebar data). */
export function getRequiredDataForPath(pathname) {
  const tab = pathToTab(pathname);
  const always = new Set(['stats', 'notifications']);
  const byTab = {
    dashboard: ['inventory', 'jobs'],
    inventory: ['inventory'],
    customers: ['customers'],
    estimates: ['estimates', 'inventory', 'technicians', 'customers'],
    jobs: ['jobs', 'technicians'],
    expenses: ['expenses'],
    investor: ['investors', 'inventory'],
    reports: ['inventory', 'jobs', 'customers'],
    approvals: ['approvals'],
    'admin-users': ['investors'],
  };
  const required = new Set([...always, ...(byTab[tab] || [])]);
  return required;
}
