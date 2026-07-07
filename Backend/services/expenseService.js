export function createExpenseService(repos, notifications) {
  const { expenses } = repos;

  const normalizePaymentStatus = (value) =>
    String(value || "").toUpperCase() === "PENDING" ? "PENDING" : "PAID";

  const withPaymentStatus = (expense) => ({
    ...expense,
    paymentStatus: normalizePaymentStatus(expense.paymentStatus),
  });

  return {
    list: async (includeDeleted) => {
      const rows = await expenses.findAll(includeDeleted);
      return rows.map(withPaymentStatus);
    },

    async ensurePaymentStatus() {
      const { Expense } = await import("../db/models.js");
      await Expense.updateMany(
        {
          $or: [
            { paymentStatus: { $exists: false } },
            { paymentStatus: null },
            { paymentStatus: "" },
          ],
        },
        { $set: { paymentStatus: "PAID" } },
      );
    },

    async add(expense) {
      const saved = await expenses.create({
        ...expense,
        id: expense.id || `exp-${Date.now()}`,
        date: expense.date || new Date().toISOString(),
        paymentStatus: normalizePaymentStatus(expense.paymentStatus),
      });
      await notifications.add({
        type: "DAILY_EXPENSE",
        title: "New Expense Audited",
        message: `Expense registered: "${saved.expenseName}" under category "${saved.category}" - $${saved.amount.toFixed(2)}${saved.paymentStatus === "PENDING" ? " (Pending payment)" : ""}.`,
      });
      return withPaymentStatus(saved);
    },

    async update(id, updates) {
      const set = { ...updates };
      if (set.paymentStatus !== undefined) {
        set.paymentStatus = normalizePaymentStatus(set.paymentStatus);
      }
      const updated = await expenses.update(id, set);
      return updated ? withPaymentStatus(updated) : null;
    },

    delete: (id, audit = null) => (audit ? expenses.softDelete(id, audit) : expenses.hardDelete(id)),
  };
}
