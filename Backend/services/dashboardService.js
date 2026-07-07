export function createDashboardService(repos, jobService) {
  const { customers, jobs, products, expenses, approvals, vehicles } = repos;

  return {
    async getStats(query = {}) {
      const [customerList, jobList, productList, expenseList, approvalList, vehicleList] = await Promise.all([
        customers.findAll(),
        jobs.findAll(),
        products.findAll(),
        expenses.findAll(),
        approvals.findAll(),
        vehicles.findAll(),
      ]);

      const totalInventoryValue = productList.reduce((acc, p) => acc + p.costPrice * p.quantity, 0);
      const todayStr = new Date().toISOString().substring(0, 10);
      const { from, to, range } = query;
      const dateKey = (v) => String(v || "").substring(0, 10);

      const inFinancialRange = (dateStr) => {
        const d = dateKey(dateStr);
        if (!d) return false;
        if (range === "overall") return true;
        if (from && to) return d >= from && d <= to;
        return d === todayStr;
      };

      const deliveredInRange = jobList.filter((j) => {
        if (j.workStatus !== "DELIVERED") return false;
        const payDate = j.lastPaymentAt || j.deliveredAt || j.dateUpdated || j.dateCreated;
        return inFinancialRange(payDate);
      });

      const periodRevenue = deliveredInRange.reduce(
        (acc, j) => acc + jobService.jobCollectedAmount(j),
        0,
      );
      const periodExpenses = expenseList
        .filter((e) => inFinancialRange(e.date))
        .reduce((acc, e) => acc + e.amount, 0);
      const periodProfit = periodRevenue - periodExpenses;

      let financialRange = "today";
      let financialRangeLabel = "Today";
      if (range === "overall") {
        financialRange = "overall";
        financialRangeLabel = "Overall (All Time)";
      } else if (from && to) {
        financialRange = "custom";
        financialRangeLabel = `${from} — ${to}`;
      }

      const pendingJobs = jobList.filter((j) => j.workStatus !== "COMPLETED" && j.workStatus !== "DELIVERED").length;
      const completedJobs = jobList.filter((j) => j.workStatus === "COMPLETED" || j.workStatus === "DELIVERED").length;
      const pendingApprovals = approvalList.filter((a) => a.status === "PENDING").length;

      return {
        totalCustomers: customerList.length,
        totalVehicles: vehicleList.length,
        totalInventoryValue,
        todayRevenue: periodRevenue,
        todayExpenses: periodExpenses,
        todayProfit: periodProfit,
        financialRange,
        financialRangeLabel,
        financialFrom: range === "overall" ? null : (from || todayStr),
        financialTo: range === "overall" ? null : (to || todayStr),
        pendingJobs,
        completedJobs,
        approvalRequests: pendingApprovals,
      };
    },
  };
}
