import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { api } from "../api";
function ReportsView({ products, jobs, customers }) {
  const [reportType, setReportType] = useState("pl");
  const [plData, setPlData] = useState(null);
  const [techData, setTechData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchReportData();
  }, [reportType]);
  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (reportType === "pl") {
        const data = await api.get("/api/reports/profit-loss");
        setPlData(data);
      } else if (reportType === "technician") {
        const data = await api.get("/api/reports/technician");
        setTechData(data);
      }
    } catch (e) {
      console.error("Failed fetching reports data:", e);
    } finally {
      setLoading(false);
    }
  };
  const handlePrint = () => {
    window.print();
  };
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportType === "pl" && plData) {
      csvContent += "Financial Metric,Value ($)\r\n";
      csvContent += `Revenues,${plData.revenue}\r
`;
      csvContent += `Daily Expenses,${plData.dailyExpenses}\r
`;
      csvContent += `COGS (Inventory utilized),${plData.inventoryPurchases}\r
`;
      csvContent += `Net Profit,${plData.profit}\r
`;
    } else if (reportType === "inventory") {
      csvContent += "Product Name,Category,Quantity,Cost Price,Selling Price,Total Value\r\n";
      products.forEach((p) => {
        csvContent += `"${p.productName}","${p.productCategory}",${p.quantity},${p.costPrice},${p.sellingPrice},${(p.costPrice * p.quantity).toFixed(2)}\r
`;
      });
    } else if (reportType === "technician") {
      csvContent += "Technician Name,Total Jobs Assigned,Completed repairs,Total Invoiced value ($)\r\n";
      techData.forEach((t) => {
        csvContent += `"${t.technicianName}",${t.jobsCount},${t.completed},${t.totalValue}\r
`;
      });
    } else if (reportType === "customers") {
      csvContent += "Customer Name,Phone Number,Plate plate,Make,Model\r\n";
      customers.forEach((c) => {
        csvContent += `"${c.customerName}","${c.mobileNumber}","${c.vehicleNumber}","${c.vehicleMake}","${c.vehicleModel}"\r
`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hpg-4.0-${reportType}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-905 dark:text-white", children: "Business Analytics & Auditing Reports" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-medium", children: "Export raw data assets, review operations performance, and audit cash flows" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleExportCSV,
            className: "border border-slate-205 dark:border-slate-800 hover:border-slate-450 text-xs px-3.5 py-2 rounded-xl text-slate-705 dark:text-slate-300 font-bold transition-all flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900",
            children: [
              /* @__PURE__ */ jsx("span", { children: "\u{1F4E5}" }),
              " Export CSV / Excel"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handlePrint,
            className: "bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm cursor-pointer",
            children: [
              /* @__PURE__ */ jsx("span", { children: "\u{1F5A8}\uFE0F" }),
              " Print Current Sheet"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl flex flex-wrap gap-2 text-xs", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setReportType("pl"),
          className: `px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${reportType === "pl" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`,
          children: "\u{1F4C8} Complete Profit & Loss Balance"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setReportType("inventory"),
          className: `px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${reportType === "inventory" ? "bg-slate-905 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 drak:hover:bg-slate-800"}`,
          children: "\u{1F4E6} Spares Inventory Status"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setReportType("technician"),
          className: `px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${reportType === "technician" ? "bg-slate-905 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 drak:hover:bg-slate-800"}`,
          children: "\u{1F6E0}\uFE0F Technician Performance Metrics"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setReportType("customers"),
          className: `px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${reportType === "customers" ? "bg-slate-905 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 drak:hover:bg-slate-800"}`,
          children: "\u{1F465} Customer History Index"
        }
      )
    ] }),
    loading && /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-xs text-slate-400", children: "Loading aggregates data..." }),
    !loading && /* @__PURE__ */ jsxs("div", { id: "print-area", children: [
      reportType === "pl" && plData && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 rounded-3xl p-6 space-y-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-905 dark:text-white uppercase tracking-wider mb-2", children: "Profit & Loss audit statement" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-bold text-emerald-500 block", children: "System Revenues" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-emerald-600 mt-1", children: [
              "Rs. ",
              plData.revenue.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 mt-1 uppercase font-semibold", children: "Allocated from Completed repair worksheets" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-5 bg-rose-500/10 border border-rose-500/15 rounded-2xl", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-bold text-rose-500 block", children: "Operational Expenses (COGS Included)" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-rose-500 mt-1", children: [
              "Rs. ",
              plData.expenses.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 mt-1 uppercase font-semibold", children: "Cumulative parts costs + registered expenses" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-5 bg-blue-500/10 border border-blue-500/15 rounded-2xl", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-bold text-blue-500 block", children: "System Net Income" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-blue-600 mt-1", children: [
              "Rs. ",
              plData.profit.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 mt-1 uppercase font-semibold", children: "Net P&L margin" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border border-slate-105 dark:border-slate-800 rounded-2xl p-5 mt-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold text-xs text-slate-800 dark:text-slate-200 uppercase mb-3", children: "Operating ledger categories break downs" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 text-xs", children: Object.entries(plData.expensesByCategory || {}).map(([cat, val]) => {
            const percentage = Math.max(5, Math.min(100, val / Math.max(1, plData.expenses) * 100));
            return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-medium", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-650 truncate", children: cat }),
                /* @__PURE__ */ jsxs("span", { className: "font-black text-slate-900 dark:text-slate-100", children: [
                  "Rs. ",
                  val.toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full h-2 bg-slate-105 dark:bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-rose-500 rounded-full", style: { width: `${percentage}%` } }) })
            ] }, cat);
          }) })
        ] })
      ] }),
      reportType === "inventory" && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden p-6 space-y-4 shadow-xs", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xs font-black text-slate-905 dark:text-white uppercase tracking-wider mb-2", children: "Spares Inventory levels report" }),
        /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 font-bold p-3", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-slate-500", children: "Part Description" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-slate-500", children: "Category" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-slate-500 text-center", children: "Available Stock" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-slate-500 text-right", children: "Cost Price" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-slate-500 text-right", children: "Selling Price" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-slate-500 text-right", children: "Cumulative Value" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800 text-slate-705 dark:text-slate-350", children: products.map((p) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "p-3 font-bold", children: p.productName }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: p.productCategory }),
            /* @__PURE__ */ jsxs("td", { className: "p-3 text-center font-bold", children: [
              p.quantity,
              " units"
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-3 text-right", children: [
              "Rs. ",
              p.costPrice.toLocaleString()
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-3 text-right", children: [
              "Rs. ",
              p.sellingPrice.toLocaleString()
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "p-3 text-right font-black text-slate-900 dark:text-slate-100", children: [
              "Rs. ",
              (p.costPrice * p.quantity).toLocaleString()
            ] })
          ] }, p.id)) })
        ] }) })
      ] }),
      reportType === "technician" && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-905 dark:text-white uppercase tracking-wider mb-2", children: "Technician Productivity performance roster" }),
        /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold font-mono", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase", children: "Mechanic Specialist Name" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-center", children: "Total Jobs Allocated" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-center", children: "Completed Repairs" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase text-right", children: "Invoiced revenues generated" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
            techData.map((t, idx) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "p-3 font-bold text-slate-900 dark:text-slate-100", children: t.technicianName }),
              /* @__PURE__ */ jsxs("td", { className: "p-3 text-center", children: [
                t.jobsCount,
                " jobs"
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "p-3 text-center font-bold text-emerald-500", children: [
                t.completed,
                " finishes"
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "p-3 text-right text-blue-500 font-black", children: [
                "Rs. ",
                t.totalValue.toLocaleString()
              ] })
            ] }, idx)),
            techData.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "text-center p-8 text-xs text-slate-400 italic", children: "No technician logs processed yet." }) })
          ] })
        ] }) })
      ] }),
      reportType === "customers" && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xs font-black text-slate-905 dark:text-white uppercase tracking-wider mb-2", children: "Master customer roster index" }),
        /* @__PURE__ */ jsx("div", { className: "table-scroll font-mono", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs font-mono", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold font-mono", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase", children: "Client Name" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase", children: "Mobile Number" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase", children: "License plate" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] uppercase", children: "Mapped Vehicle" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: customers.map((c) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "p-3 font-bold text-slate-900 dark:text-slate-100", children: c.customerName }),
            /* @__PURE__ */ jsx("td", { className: "p-3 font-mono", children: c.mobileNumber }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "bg-slate-100 dark:bg-slate-800 font-black p-1 px-2.5 rounded text-[11px] text-slate-700 dark:text-slate-350", children: c.vehicleNumber }) }),
            /* @__PURE__ */ jsxs("td", { className: "p-3 italic", children: [
              c.vehicleMake,
              " ",
              c.vehicleModel
            ] })
          ] }, c.id)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  ReportsView as default
};
