import { Menu } from 'lucide-react';

export default function AppHeader({
  theme,
  onToggleTheme,
  notificationOpen,
  onToggleNotifications,
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onClearNotifications,
  onOpenSidebar,
}) {
  return (
    <header className="min-h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 shrink-0 relative z-10 no-print">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>
        <div className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1 min-w-0">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
          <span className="truncate hidden sm:inline">Shop Bay: Main Central Warehouse</span>
          <span className="truncate sm:hidden">HPG 4.0</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          title="Toggle theme mode"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer transition-all whitespace-nowrap"
        >
          <span className="hidden sm:inline">{theme === 'light' ? '🌙 Night mode' : '☀️ Day Mode'}</span>
          <span className="sm:hidden">{theme === 'light' ? '🌙' : '☀️'}</span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold cursor-pointer transition-all"
          >
            <span className="hidden sm:inline">🔔 alerts</span>
            <span className="sm:hidden">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
          {notificationOpen && (
            <div className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-1.5rem))] sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-xs">
              <div className="flex items-center justify-between border-b pb-2 text-[10px] uppercase font-black text-slate-450">
                <span>Active Notifications</span>
                <button type="button" onClick={onClearNotifications} className="text-blue-500 text-[9px] font-black hover:underline">Clear all</button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onMarkNotificationRead(n.id)}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${n.isRead ? 'opacity-50' : 'bg-blue-500/10 border-l-4 border-blue-500'}`}
                  >
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{n.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center text-[10px] text-slate-400 py-6 italic">No notifications alerts active.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
