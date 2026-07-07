import { useState, useEffect, useCallback, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { canAccessTab } from '../permissions';
import { firstAllowedPath, pathToTab, tabToPath } from '../routes';
import { useGarageQueries, useGarageMutations } from '../hooks/useGarageQueries';
import { useAuthSession } from '../hooks/useAuthSession';
import { useGarageHandlers } from '../hooks/useGarageHandlers';
import LoginView from './LoginView';
import AppShell from './layout/AppShell';
import PageLoader from './layout/PageLoader';
import GarageRoutes from './routing/GarageRoutes';

function BootstrapScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-300 font-sans">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-bold tracking-wider uppercase">HPG 4.0</p>
      <p className="text-xs text-slate-500">Starting local session…</p>
    </div>
  );
}

export default function AppRoot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, bootstrapping, isAuthenticated, handleLoginSuccess, handleLogout } = useAuthSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [notificationOpen, setNotificationOpen] = useState(false);

  const {
    products,
    customers,
    estimates,
    jobs,
    expenses,
    investors,
    technicians,
    notifications,
    approvals,
    stats,
  } = useGarageQueries(isAuthenticated, location.pathname);

  const mutations = useGarageMutations();
  const handlers = useGarageHandlers(mutations);

  const canSee = useCallback((tab) => canAccessTab(user, tab), [user]);

  const goToTab = (tab) => {
    if (!canAccessTab(user, tab)) return;
    navigate(tabToPath(tab));
    setSidebarOpen(false);
    setNotificationOpen(false);
  };

  const closeNav = () => {
    setSidebarOpen(false);
    setNotificationOpen(false);
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!user || location.pathname === '/login') return;
    const tab = pathToTab(location.pathname);
    if (!tab || !canAccessTab(user, tab)) {
      navigate(firstAllowedPath(user), { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (bootstrapping) return <BootstrapScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const defaultPath = firstAllowedPath(user);

  return (
    <AppShell
      user={user}
      theme={theme}
      canSee={canSee}
      stats={stats}
      notifications={notifications}
      unreadCount={unreadNotifications.length}
      sidebarOpen={sidebarOpen}
      notificationOpen={notificationOpen}
      onCloseSidebar={closeNav}
      onOpenSidebar={() => setSidebarOpen(true)}
      onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      onToggleNotifications={() => setNotificationOpen(!notificationOpen)}
      onMarkNotificationRead={handlers.handleMarkNotificationRead}
      onClearNotifications={handlers.handleClearNotifications}
      onLogout={handleLogout}
    >
      <Suspense fallback={<PageLoader />}>
        <GarageRoutes
          user={user}
          defaultPath={defaultPath}
          canSee={canSee}
          goToTab={goToTab}
          stats={stats}
          products={products}
          customers={customers}
          estimates={estimates}
          jobs={jobs}
          expenses={expenses}
          investors={investors}
          technicians={technicians}
          approvals={approvals}
          handlers={handlers}
        />
      </Suspense>
    </AppShell>
  );
}
