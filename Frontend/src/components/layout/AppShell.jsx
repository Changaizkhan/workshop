import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

export default function AppShell({
  user,
  theme,
  canSee,
  stats,
  notifications,
  unreadCount,
  sidebarOpen,
  notificationOpen,
  onCloseSidebar,
  onOpenSidebar,
  onToggleTheme,
  onToggleNotifications,
  onMarkNotificationRead,
  onClearNotifications,
  onLogout,
  children,
}) {
  return (
    <div className={`flex min-h-dvh h-dvh w-full overflow-hidden font-sans ${theme === 'dark' ? 'dark text-slate-100 bg-slate-950' : 'text-slate-900 bg-slate-50'}`}>
      <AppSidebar
        user={user}
        canSee={canSee}
        stats={stats}
        sidebarOpen={sidebarOpen}
        onClose={onCloseSidebar}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <AppHeader
          theme={theme}
          onToggleTheme={onToggleTheme}
          notificationOpen={notificationOpen}
          onToggleNotifications={onToggleNotifications}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkNotificationRead={onMarkNotificationRead}
          onClearNotifications={onClearNotifications}
          onOpenSidebar={onOpenSidebar}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
