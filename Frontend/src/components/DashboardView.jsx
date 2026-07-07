import { useState } from 'react';
import { useDashboardFinancialStats } from '../hooks/useGarageQueries';

const todayIso = () => new Date().toISOString().substring(0, 10);

const fmtPkr = (n) => Number(n || 0).toLocaleString('en-PK');

const defaultRange = () => ({
  mode: 'today',
  from: todayIso(),
  to: todayIso(),
});

const rangeLabel = (mode, from, to, dataLabel) => {
  if (dataLabel) return dataLabel;
  if (mode === 'overall') return 'Overall';
  if (mode === 'custom' && from && to) return `${from} — ${to}`;
  return 'Today';
};

const cardTitle = (base, mode) => {
  if (mode === 'today') return `Today's ${base}`;
  if (mode === 'overall') return `Overall ${base}`;
  return base;
};

export default function DashboardView({
  stats,
  jobs,
  products,
  onCreateEstimateClick,
  onViewJobDetail,
}) {
  const [activeFilter, setActiveFilter] = useState(null);
  const [collectedRange, setCollectedRange] = useState(defaultRange);
  const [expensesRange, setExpensesRange] = useState(defaultRange);
  const [profitRange, setProfitRange] = useState(defaultRange);
  const [draftMode, setDraftMode] = useState('today');
  const [draftFrom, setDraftFrom] = useState(todayIso());
  const [draftTo, setDraftTo] = useState(todayIso());

  const collectedQuery = useDashboardFinancialStats({
    metric: 'collected',
    mode: collectedRange.mode,
    from: collectedRange.from,
    to: collectedRange.to,
  });
  const expensesQuery = useDashboardFinancialStats({
    metric: 'expenses',
    mode: expensesRange.mode,
    from: expensesRange.from,
    to: expensesRange.to,
  });
  const profitQuery = useDashboardFinancialStats({
    metric: 'profit',
    mode: profitRange.mode,
    from: profitRange.from,
    to: profitRange.to,
  });

  const collectedAmount = collectedQuery.data?.todayRevenue ?? stats.todayRevenue;
  const expensesAmount = expensesQuery.data?.todayExpenses ?? stats.todayExpenses;
  const profitAmount = profitQuery.data?.todayProfit ?? stats.todayProfit;

  const lowStockProducts = products.filter((p) => p.quantity <= p.lowStockAlert).slice(0, 3);
  const activeJobs = jobs.filter((j) => j.workStatus !== 'DELIVERED').slice(0, 4);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
      case 'WAITING_PARTS':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  const getRangeState = (key) => {
    if (key === 'collected') return collectedRange;
    if (key === 'expenses') return expensesRange;
    return profitRange;
  };

  const openFilter = (key) => {
    const r = getRangeState(key);
    setActiveFilter(key);
    setDraftMode(r.mode);
    setDraftFrom(r.from);
    setDraftTo(r.to);
  };

  const applyFilter = () => {
    if (draftMode === 'custom' && (!draftFrom || !draftTo || draftFrom > draftTo)) return;
    const next = { mode: draftMode, from: draftFrom, to: draftTo };
    if (activeFilter === 'collected') setCollectedRange(next);
    else if (activeFilter === 'expenses') setExpensesRange(next);
    else if (activeFilter === 'profit') setProfitRange(next);
    setActiveFilter(null);
  };

  const filterTitles = {
    collected: 'Collected (Paid)',
    expenses: 'Expenses',
    profit: 'Profit (Collected)',
  };

  const FinancialCard = ({
    filterKey,
    title,
    amount,
    subtitle,
    amountClass = 'text-slate-900 dark:text-white',
    range,
    queryData,
    isFetching,
  }) => (
    <button
      type="button"
      onClick={() => openFilter(filterKey)}
      className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-xs text-left hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer w-full ${
        activeFilter === filterKey ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
          📅 {rangeLabel(range.mode, range.from, range.to, queryData?.financialRangeLabel)}
        </span>
      </div>
      <p className={`text-2xl font-black tracking-tight ${amountClass}`}>
        {isFetching ? '...' : `Rs. ${fmtPkr(amount)}`}
      </p>
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">{subtitle}</span>
        <span className="text-[9px] font-bold text-blue-500">Click → is card ka filter</span>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialCard
          filterKey="collected"
          title={cardTitle('Collected (Paid)', collectedRange.mode)}
          amount={collectedAmount}
          subtitle="Delivered — jo payment hui"
          amountClass="text-emerald-600 dark:text-emerald-400"
          range={collectedRange}
          queryData={collectedQuery.data}
          isFetching={collectedQuery.isFetching && collectedRange.mode !== 'today'}
        />
        <FinancialCard
          filterKey="expenses"
          title={cardTitle('Expenses', expensesRange.mode)}
          amount={expensesAmount}
          subtitle="Operating costs"
          range={expensesRange}
          queryData={expensesQuery.data}
          isFetching={expensesQuery.isFetching && expensesRange.mode !== 'today'}
        />
        <FinancialCard
          filterKey="profit"
          title={cardTitle('Profit (Collected)', profitRange.mode)}
          amount={profitAmount}
          subtitle="Collected minus expenses"
          amountClass={profitAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}
          range={profitRange}
          queryData={profitQuery.data}
          isFetching={profitQuery.isFetching && profitRange.mode !== 'today'}
        />
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Bay Repairs</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.pendingJobs}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-500">Service Worksheets</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Customers</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.totalCustomers}</p>
          </div>
          <span className="text-2xl">👥</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Logged Fleet Vehicles</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.totalVehicles}</p>
          </div>
          <span className="text-2xl">🚗</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Inventory Valuation</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">Rs. {fmtPkr(stats.totalInventoryValue)}</p>
          </div>
          <span className="text-2xl">🛡️</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden min-w-0">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Live Shop Worksheets</h3>
              <p className="text-xs text-slate-400">Track real time repair state in specific bays</p>
            </div>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-black px-2.5 py-1 rounded-full">
              {stats.pendingJobs} Active
            </span>
          </div>
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-55 dark:bg-slate-800/50">
                <tr>
                  <th className="p-4 text-[10px] uppercase font-black text-slate-400">Job ID</th>
                  <th className="p-4 text-[10px] uppercase font-black text-slate-400">Vehicle specs</th>
                  <th className="p-4 text-[10px] uppercase font-black text-slate-400">Customer</th>
                  <th className="p-4 text-[10px] uppercase font-black text-slate-400">Bay State</th>
                  <th className="p-4 text-[10px] uppercase font-black text-slate-400">Lookup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-900 dark:text-slate-100 font-bold">{job.jobNumber}</td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        {job.vehicleMake} {job.vehicleModel}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {job.vehicleNumber} • {job.vehicleMileage}
                      </p>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-700 dark:text-slate-300">{job.customerName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(job.workStatus)}`}>
                        {job.workStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => onViewJobDetail(job)}
                        className="p-1 px-2.5 rounded-lg bg-slate-100 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-[11px] text-slate-600 dark:text-slate-300 dark:hover:text-white hover:text-white font-bold transition-all cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {activeJobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-xs text-slate-400 italic">
                      No job sheets found at present.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <button
            type="button"
            onClick={onCreateEstimateClick}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20 text-left transition-all active:scale-98 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">📝</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-200">ERP Fast Action</span>
            </div>
            <p className="mt-4 text-lg font-bold text-white tracking-tight">Create New Estimate</p>
            <p className="text-xs text-blue-100 max-w-[240px] mt-1 font-medium">
              Specify repairs, pull parts from stock, configure labor rates, and print.
            </p>
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex-1 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <span className="text-rose-500">⚠️</span>
                Critical Parts Levels
              </h4>
              <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">Alert</span>
            </div>
            <div className="space-y-4">
              {lowStockProducts.map((p) => {
                const percentage = Math.max(8, Math.min(100, (p.quantity / (p.lowStockAlert || 5)) * 100));
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-300 truncate max-w-[140px]">{p.productName}</span>
                      <span className="text-rose-500 font-extrabold">
                        {p.quantity} {p.quantity === 1 ? 'unit' : 'units'} left
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">Reorder Spec from: {p.supplierName}</p>
                  </div>
                );
              })}
              {lowStockProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs italic">
                  <span>✨</span>
                  <span>Parts levels are secure!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              {filterTitles[activeFilter]} — Date Filter
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Sirf is card ka data change hoga. Baqi cards apni date par rahenge.
            </p>

            <div className="space-y-2 mb-4">
              {[
                { id: 'today', label: 'Today', desc: 'Sirf aaj ki entries' },
                { id: 'overall', label: 'Overall (All Time)', desc: 'Shuru se ab tak sab' },
                { id: 'custom', label: 'Custom Range', desc: 'From date — To date' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDraftMode(opt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    draftMode === opt.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>

            {draftMode === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
                  <input
                    type="date"
                    value={draftFrom}
                    onChange={(e) => setDraftFrom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
                  <input
                    type="date"
                    value={draftTo}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyFilter}
                disabled={draftMode === 'custom' && (!draftFrom || !draftTo || draftFrom > draftTo)}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
