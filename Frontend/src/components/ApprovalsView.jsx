import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
function ApprovalsView({
  approvals,
  userRole,
  onResolveApproval
}) {
  const [resolverNotes, setResolverNotes] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;
  const handleResolve = async (id, decision) => {
    try {
      await onResolveApproval(id, decision, resolverNotes);
      setSelectedReq(null);
      setResolverNotes("");
      console.info(`Successfully registered decision: ${decision} for transaction ID: ${id}`);
    } catch (err) {
      console.info(err.message || "Authorization failed.");
    }
  };
  const getBadgeStyle = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-bold";
      default:
        return "bg-slate-100 dark:bg-slate-850";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-slate-905 dark:text-white", children: "Admin Authorizations Queue" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Review, approve, or reject inventory additions, price changes, or daily shop expenditures created by standard technicians" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-3.5 py-1 rounded-full text-xs font-black uppercase shrink-0 self-start sm:self-center", children: [
        pendingCount,
        " Awaiting Review"
      ] })
    ] }),
    userRole !== "ADMIN" && /* @__PURE__ */ jsx("div", { className: "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl text-xs", children: "\u{1F512} Note: You are logged in as a Standard Technician. You can view the queue but do not possess the necessary access credentials to authorize transactions." }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      approvals.map((req) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 flex-1 max-w-xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${req.type.includes("PRODUCT") ? "bg-blue-105 text-blue-600" : "bg-purple-105 text-purple-600"}`, children: req.type.replace("_", " ") }),
            /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeStyle(req.status)}`, children: req.status })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-905 dark:text-slate-100", children: [
            "Transaction initiated by: ",
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-extrabold", children: req.requestedBy })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 text-xs mt-2 space-y-1", children: [
            req.type === "ADD_PRODUCT" && req.details.productData && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-bold block text-[9px] uppercase", children: "Draft Product specifications:" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-705 dark:text-slate-200", children: [
                req.details.productData.productName,
                " (",
                req.details.productData.productCategory,
                ")"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "font-mono text-[10px] text-slate-500", children: [
                "Retail price: Rs. ",
                req.details.productData.sellingPrice?.toLocaleString(),
                " | Cost: Rs. ",
                req.details.productData.costPrice?.toLocaleString(),
                " | Current: ",
                req.details.productData.quantity,
                " units"
              ] })
            ] }),
            req.type === "CREATE_EXPENSE" && req.details.expenseData && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-bold block text-[9px] uppercase", children: "Draft Shop Operational Expense:" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-705 dark:text-slate-200", children: [
                req.details.expenseData.expenseName,
                " - Rs. ",
                req.details.expenseData.amount?.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "font-mono text-[10px] text-slate-500", children: [
                "Category: ",
                req.details.expenseData.category,
                ' | notes: "',
                req.details.expenseData.notes,
                '"'
              ] })
            ] }),
            req.type === "EDIT_PRODUCT" && req.details.productData && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-bold block text-[9px] uppercase", children: "Requested Master Specs Change:" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-705 dark:text-slate-200", children: [
                "Product Ref: ",
                req.details.productId
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "font-mono text-[11px] text-slate-500", children: [
                "Proposed Adjustments: ",
                JSON.stringify(req.details.productData)
              ] })
            ] }),
            req.type === "EDIT_QUANTITY" && req.details.inventoryChange && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-bold block text-[9px] uppercase", children: "Proposed Stock Vol adjustments:" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-705 dark:text-slate-200", children: [
                "Product: ",
                req.details.inventoryChange.productId
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "font-mono text-[11px] text-slate-500", children: [
                "Change: ",
                req.details.inventoryChange.oldQuantity,
                " units \u27A1\uFE0F ",
                req.details.inventoryChange.newQuantity,
                " units"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 italic", children: [
            "Created: ",
            new Date(req.requestedAt).toLocaleString()
          ] }),
          req.notes && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded", children: [
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Resolver Notes:" }),
            ' "',
            req.notes,
            '" by ',
            req.approvedBy,
            " at ",
            new Date(req.approvedAt || "").toLocaleDateString()
          ] })
        ] }),
        req.status === "PENDING" && userRole === "ADMIN" && /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedReq(req),
            className: "bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer",
            children: "\u2699\uFE0F Review & Resolve"
          }
        ) })
      ] }, req.id)),
      approvals.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-16 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800", children: "No transaction records found in the approval queues." })
    ] }),
    selectedReq && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2", children: "Authorize Proposed Action" }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mb-4", children: [
        "You are resolving the transaction initiated by ",
        selectedReq.requestedBy
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5", children: "Decision auditing notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: resolverNotes,
              onChange: (e) => setResolverNotes(e.target.value),
              placeholder: "e.g. Validated supplier price changes. Proceeding.",
              className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs",
              rows: 2
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSelectedReq(null),
              className: "border border-slate-150 dark:border-slate-800 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-300",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleResolve(selectedReq.id, "REJECTED"),
              className: "bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm",
              children: "Reject Change"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleResolve(selectedReq.id, "APPROVED"),
              className: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm animate-pulse",
              children: "Approve & Write DB"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  ApprovalsView as default
};
