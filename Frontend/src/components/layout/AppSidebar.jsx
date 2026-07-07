import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { tabToPath } from '../../routes';
import { NAV_ITEMS, ADMIN_NAV } from './navConfig';

const navClass = (isActive) =>
  `w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
    isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
      : 'text-slate-400 hover:text-white hover:bg-slate-800'
  }`;

export default function AppSidebar({
  user,
  canSee,
  stats,
  sidebarOpen,
  onClose,
  onLogout,
}) {
  const adminNavVisible = ADMIN_NAV.some((item) => canSee(item.id));

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden cursor-pointer"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[min(18rem,88vw)] lg:w-64 xl:w-72 bg-slate-900 flex flex-col text-white shadow-2xl shrink-0 transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">H</div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase truncate">
              HPG<span className="text-blue-400"> 4.0</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.filter((item) => canSee(item.id)).map((item) => (
            <NavLink
              key={item.id}
              to={tabToPath(item.id)}
              onClick={onClose}
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="w-5 text-center text-sm">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {adminNavVisible && (
            <div className="pt-4 border-t border-slate-800">
              <p className="px-3 text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 font-mono">Administration</p>
              {ADMIN_NAV.filter((item) => canSee(item.id)).map((item) => (
                <NavLink
                  key={item.id}
                  to={tabToPath(item.id)}
                  onClick={onClose}
                  className={({ isActive }) => `${navClass(isActive)} ${item.id === 'admin-users' ? 'mt-1.5' : ''}`}
                >
                  <span className="w-5 text-center text-sm">{item.icon}</span>
                  {item.label}
                  {item.badge && stats.approvalRequests > 0 && (
                    <span className="ml-auto bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full select-none">
                      {stats.approvalRequests} pending
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-emerald-500 shrink-0 font-bold flex items-center justify-center text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-slate-100">{user.name}</p>
              <p className="text-[10px] text-emerald-400 font-bold font-mono uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Exit workspace session"
            className="p-1 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
