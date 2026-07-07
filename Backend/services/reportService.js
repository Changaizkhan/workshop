export function createReportService(repos) {
  const { jobs, expenses, products } = repos;

  return {
    async profitLoss() {
      const [jobList, expenseList, productList] = await Promise.all([
        jobs.findAll(),
        expenses.findAll(),
        products.findAll(),
      ]);

      const completedJobs = jobList.filter((j) => j.workStatus === "COMPLETED" || j.workStatus === "DELIVERED");
      const expensesSum = expenseList.reduce((acc, e) => acc + e.amount, 0);
      let inventoryCOGS = 0;

      completedJobs.forEach((job) => {
        job.productsUsed.forEach((item) => {
          const master = productList.find((p) => p.id === item.productId);
          const cost = master ? master.costPrice : item.unitPrice * 0.6;
          inventoryCOGS += cost * item.quantity;
        });
      });

      const totalLabourCost = completedJobs.reduce((sum, j) => sum + j.calculations.labourTotal, 0);
      const totalRevenue = completedJobs.reduce((sum, j) => sum + j.calculations.grandTotal, 0);
      const totalExpenses = inventoryCOGS + expensesSum;
      const netProfit = totalRevenue - totalExpenses;
      const categorySummary = expenseList.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {});
      categorySummary["Inventory COGS (Used)"] = Number(inventoryCOGS.toFixed(2));

      return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        inventoryPurchases: inventoryCOGS,
        laborTotal: totalLabourCost,
        dailyExpenses: expensesSum,
        profit: netProfit,
        expensesByCategory: categorySummary,
      };
    },

    async technicianPerformance() {
      const jobList = await jobs.findAll();
      const performance = {};

      jobList.forEach((job) => {
        const tech = job.assignedTechnician || "Unassigned";
        if (!performance[tech]) {
          performance[tech] = { jobsCount: 0, completed: 0, totalValue: 0 };
        }
        performance[tech].jobsCount++;
        if (job.workStatus === "COMPLETED" || job.workStatus === "DELIVERED") {
          performance[tech].completed++;
          performance[tech].totalValue += job.calculations.grandTotal;
        }
      });

      return Object.entries(performance).map(([technicianName, metrics]) => ({
        technicianName,
        ...metrics,
      }));
    },
  };
}
