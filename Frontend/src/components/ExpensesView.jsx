import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import AuditInfo from "./AuditInfo";
import ConfirmModal from "./ConfirmModal";
import { useConfirmModal } from "../hooks/useConfirmModal";

const todayIso = () => new Date().toISOString().substring(0, 10);
const expenseDateKey = (expense) => String(expense.date || "").substring(0, 10);
const expensePaymentStatus = (expense) => {
  const status = String(expense.paymentStatus || "").toUpperCase();
  return status === "PENDING" ? "PENDING" : "PAID";
};
const isExpensePending = (expense) => expensePaymentStatus(expense) === "PENDING";

function ExpensesView({
  expenses,
  user,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}) {
  const isAdmin = user?.role === "ADMIN";
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [category, setCategory] = useState("Miscellaneous");
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());
  const { openConfirm, openAlert, modalProps } = useConfirmModal();
  const categories = ["Rent", "Electricity", "Water", "Salaries", "Internet", "Fuel", "Miscellaneous"];
  const dateFiltered = expenses.filter((e) => {
    if (timeFilter === "all") return true;
    const d = expenseDateKey(e);
    const now = /* @__PURE__ */ new Date();
    if (timeFilter === "today") {
      return new Date(e.date).toDateString() === now.toDateString();
    }
    if (timeFilter === "weekly") {
      const oneWeekAgo = /* @__PURE__ */ new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return new Date(e.date) >= oneWeekAgo;
    }
    if (timeFilter === "monthly") {
      const oneMonthAgo = /* @__PURE__ */ new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return new Date(e.date) >= oneMonthAgo;
    }
    if (timeFilter === "custom" && customFrom && customTo) {
      return d >= customFrom && d <= customTo;
    }
    return true;
  });
  const filtered = dateFiltered.filter((e) => {
    if (statusFilter === "pending") return isExpensePending(e);
    if (statusFilter === "paid") return !isExpensePending(e);
    return true;
  });
  const cumulativeSpend = filtered.reduce((acc, e) => acc + e.amount, 0);
  const pendingTotal = dateFiltered.filter(isExpensePending).reduce((acc, e) => acc + e.amount, 0);
  const pendingCount = dateFiltered.filter(isExpensePending).length;
  const filterLabels = {
    all: 'All time',
    today: "Today's",
    weekly: 'Past 7 days',
    monthly: 'Past 30 days',
    custom: customFrom && customTo ? `${customFrom} to ${customTo}` : 'Custom range',
    pending: 'Pending payments',
    paid: 'Paid expenses',
  };
  const segmentLabel = statusFilter === "pending"
    ? filterLabels.pending
    : statusFilter === "paid"
      ? filterLabels.paid
      : filterLabels[timeFilter] || 'Current';
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expenseName || amount <= 0) {
      setError("Please provide a descriptive expense label and dynamic payment value.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const payload = {
        expenseName,
        category,
        amount: Number(amount),
        date: (/* @__PURE__ */ new Date()).toISOString(),
        notes,
        paymentStatus
      };
      await onAddExpense(payload);
      setSuccess("Operating costs audited and registered successfully.");
      setTimeout(() => {
        setModalOpen(false);
        setExpenseName("");
        setAmount(0);
        setNotes("");
        setPaymentStatus("PAID");
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Operation failed.");
    }
  };
  const handleDelete = (id) => {
    openConfirm({
      title: isAdmin ? "Permanently delete this expense?" : "Remove this expense?",
      message: isAdmin
        ? "This expense record will be permanently deleted."
        : "This expense will be removed. Admin will see who deleted it.",
      confirmLabel: isAdmin ? "Delete permanently" : "Remove",
      onConfirm: async () => {
        try {
          await onDeleteExpense(id);
        } catch (err) {
          openAlert({ title: "Delete failed", message: err.message || "Erase failed.", variant: "danger" });
        }
      },
    });
  };
  const handleMarkPaid = async (id) => {
    try {
      await onUpdateExpense(id, { paymentStatus: "PAID" });
    } catch (err) {
      openAlert({ title: "Update failed", message: err.message || "Payment status update failed.", variant: "danger" });
    }
  };
  const handleMarkPending = async (id) => {
    try {
      await onUpdateExpense(id, { paymentStatus: "PENDING" });
    } catch (err) {
      openAlert({ title: "Update failed", message: err.message || "Payment status update failed.", variant: "danger" });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-905 dark:text-white", children: "Shop Operating Expenditure Ledger" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Track facility rents, energy water service bills, worker paychecks, and supplies overheads" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            setError("");
            setSuccess("");
            setModalOpen(true);
          },
          className: "bg-blue-600 hover:bg-blue-550 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all",
          children: "\u{1F4B3} Add Expense Entry"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 text-slate-100 p-5 rounded-2xl shadow-xs", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider", children: "Accumulative Spend Total" }),
        /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black mt-1 text-slate-100", children: [
          "Rs. ",
          cumulativeSpend.toLocaleString()
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1.5 font-mono", children: `${segmentLabel} segment view sum` })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setStatusFilter(statusFilter === "pending" ? "all" : "pending"),
          className: `text-left p-5 rounded-2xl shadow-xs border transition-all cursor-pointer ${statusFilter === "pending" ? "bg-amber-600 border-amber-500 text-white ring-2 ring-amber-400/50" : "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"}`,
          children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider opacity-80", children: "Pending Payments" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black mt-1", children: [
              "Rs. ",
              pendingTotal.toLocaleString()
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[9px] uppercase font-black tracking-widest mt-1.5 font-mono opacity-80", children: [
              pendingCount,
              " pending expense",
              pendingCount === 1 ? "" : "s",
              " — click to view"
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs min-w-0", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-750 dark:text-slate-250 uppercase mb-3 text-[10px] tracking-wider", children: [
          segmentLabel,
          " expenditures split by categorized sectors"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs", children: categories.map((cat) => {
          const categoryTotal = filtered.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
          return /* @__PURE__ */ jsxs("div", { className: "p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-505 dark:text-slate-400 text-[10px] uppercase", children: cat }),
            /* @__PURE__ */ jsxs("p", { className: "font-extrabold text-slate-900 dark:text-slate-100 mt-1", children: [
              "Rs. ",
              categoryTotal.toLocaleString()
            ] })
          ] }, cat);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setTimeFilter("all"),
              className: `px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${timeFilter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100"}`,
              children: "All Ledger"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setTimeFilter("today"),
              className: `px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${timeFilter === "today" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100"}`,
              children: "Today Operations"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setTimeFilter("weekly"),
              className: `px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${timeFilter === "weekly" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100"}`,
              children: "Past 7 Days"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setTimeFilter("monthly"),
              className: `px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${timeFilter === "monthly" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100"}`,
              children: "Past 30 Days"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setTimeFilter("custom"),
              className: `px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${timeFilter === "custom" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100"}`,
              children: "Custom Range"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter(statusFilter === "pending" ? "all" : "pending"),
              className: `px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${statusFilter === "pending" ? "bg-amber-600 text-white shadow-md" : "hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400"}`,
              children: "Pending"
            }
          ),
          statusFilter === "pending" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("all"),
              className: "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer hover:bg-slate-100 text-slate-500",
              children: "Clear Pending Filter"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-400 font-extrabold uppercase font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded-xl whitespace-nowrap", children: [
          "Showing ",
          filtered.length,
          " of ",
          expenses.length,
          " records"
        ] })
      ] }),
      timeFilter === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 uppercase mb-1", children: "From" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: customFrom, onChange: (e) => setCustomFrom(e.target.value), className: "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 uppercase mb-1", children: "To" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: customTo, onChange: (e) => setCustomTo(e.target.value), className: "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-55 dark:bg-slate-800/60", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-slate-400", children: "Date recorded" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-slate-400", children: "Expense Spec Description" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-slate-400", children: "Operational Category" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-slate-400", children: "Payment" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-slate-400", children: "Audit notes" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-slate-400", children: "Cash Amount" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-slate-400 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800 text-xs", children: [
        filtered.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-rose-50/10 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "p-4 font-mono text-[11px] text-slate-500", children: new Date(item.date).toLocaleDateString() }),
          /* @__PURE__ */ jsx("td", { className: "p-4 font-bold text-slate-900 dark:text-slate-100", children: item.expenseName }),
          /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "bg-slate-100 dark:bg-slate-800 p-1 px-2.5 rounded font-bold text-[10px] text-slate-600 dark:text-slate-300", children: item.category }) }),
          /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isExpensePending(item) ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"}`, children: isExpensePending(item) ? "Pending" : "Paid" }) }),
          /* @__PURE__ */ jsx("td", { className: "p-4 max-w-[200px]", children: isAdmin ? /* @__PURE__ */ jsx(AuditInfo, { record: item }) : /* @__PURE__ */ jsx("span", { className: "text-slate-500 italic truncate block", children: item.notes ? `"${item.notes}"` : "\u2014" }) }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 font-black text-slate-905 dark:text-slate-200", children: [
            "Rs. ",
            item.amount.toLocaleString()
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
            isExpensePending(item) && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleMarkPaid(item.id),
                className: "p-1 px-2 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md transition-all cursor-pointer font-bold text-[10px]",
                children: "\u2713 Mark Paid"
              }
            ),
            !isExpensePending(item) && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleMarkPending(item.id),
                className: "p-1 px-2 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md transition-all cursor-pointer font-bold text-[10px]",
                children: "\u23F3 Mark Pending"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleDelete(item.id),
                className: "p-1 px-2 hover:bg-rose-500/10 text-rose-500 rounded-md transition-all cursor-pointer font-bold text-[10px]",
                children: "\u{1F5D1}\uFE0F Purge"
              }
            )
          ] }) })
        ] }, item.id)),
        filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "text-center p-12 text-slate-400 italic", children: statusFilter === "pending" ? "No pending expenses in selected range." : timeFilter === "all" ? "No operational expenses registered." : "No expenses in selected date range." }) })
      ] })
    ] }) }),
    modalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2", children: "Audit New Shop Expense" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-6", children: "Expense saves immediately. Admin can see who added each entry." }),
      error && /* @__PURE__ */ jsx("div", { className: "bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 p-3 rounded-xl text-xs mb-4", children: error }),
      success && /* @__PURE__ */ jsx("div", { className: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-605 dark:text-emerald-400 p-3 rounded-xl text-xs mb-4", children: success }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Expense Description Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: expenseName,
              onChange: (e) => setExpenseName(e.target.value),
              placeholder: "e.g. Workshop Bay 4 Rent",
              className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-950 dark:text-white"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Category Class" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: category,
                onChange: (e) => setCategory(e.target.value),
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs",
                children: categories.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Amount Spent (Rs.)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                value: amount,
                onChange: (e) => setAmount(Number(e.target.value)),
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-950 dark:text-white"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Payment Status" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: paymentStatus,
              onChange: (e) => setPaymentStatus(e.target.value),
              className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs",
              children: [
                /* @__PURE__ */ jsx("option", { value: "PAID", children: "Paid (abhi pay ho gaya)" }),
                /* @__PURE__ */ jsx("option", { value: "PENDING", children: "Pending (baad mein pay hoga)" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Auditing notes (Receipt numbers, etc)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              placeholder: "invoice #X-2292 from Western Power...",
              className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-950 dark:text-white",
              rows: 2
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setModalOpen(false),
              className: "border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer",
              children: "Post Expense"
            }
          )
        ] })
      ] })
    ] }) }),
    modalProps && /* @__PURE__ */ jsx(ConfirmModal, { ...modalProps })
  ] });
}
export {
  ExpensesView as default
};
