import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import AuditInfo from "./AuditInfo";
import ConfirmModal from "./ConfirmModal";
import TechnicianSelect from "./TechnicianSelect";
import TechnicianManager from "./TechnicianManager";
import JobInvoiceView from "./JobInvoiceView";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { filterJobsByDate, exportJobsToExcel } from "../utils/exportJobsExcel";

const todayIso = () => new Date().toISOString().substring(0, 10);
function JobsView({
  jobs,
  technicians = [],
  user,
  onUpdateJob,
  onDeleteJob,
  onAddTechnician,
  onDeleteTechnician
}) {
  const isAdmin = user?.role === "ADMIN";
  const canManageTechs = isAdmin || user?.role === "MANAGER";
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());
  const [invoiceJob, setInvoiceJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [newStatus, setNewStatus] = useState("PENDING");
  const [newTech, setNewTech] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paidNow, setPaidNow] = useState("");
  const [addMorePaid, setAddMorePaid] = useState("");
  const [statusError, setStatusError] = useState("");
  const { openConfirm, openAlert, modalProps } = useConfirmModal();
  const jobTotal = (job) => Number(job?.calculations?.grandTotal || 0);
  const resetPaymentForm = () => {
    setPaymentMode("");
    setPaidNow("");
    setAddMorePaid("");
    setStatusError("");
  };
  const openStatusModal = (job) => {
    setSelectedJob(job);
    setNewStatus(job.workStatus);
    setNewTech(job.assignedTechnician);
    resetPaymentForm();
  };
  const dateFiltered = filterJobsByDate(jobs, dateFilter, customFrom, customTo);
  const filtered = dateFiltered.filter(
    (j) =>
      (j.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.jobNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.vehicleNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.assignedTechnician || "").toLowerCase().includes(search.toLowerCase())
  );
  const handleExportExcel = () => {
    const label = dateFilter === "custom" ? `${customFrom}_to_${customTo}` : dateFilter;
    const ok = exportJobsToExcel(dateFiltered, label);
    if (!ok) {
      openAlert({
        title: "No jobs to export",
        message: "Selected date range mein koi bay repair job nahi mili.",
        variant: "warning",
      });
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30";
      case "WAITING_PARTS":
        return "bg-rose-100 text-rose-850 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200 dark:border-rose-900/30";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-405 border border-emerald-205 dark:border-emerald-900/30";
      case "DELIVERED":
        return "bg-indigo-100 text-indigo-805 dark:bg-indigo-950/40 dark:text-indigo-405 border border-indigo-205 dark:border-indigo-900/30";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400";
    }
  };
  const handleUpdateStatus = async (jobId, clearPayment = false) => {
    if (!selectedJob) return;
    const total = jobTotal(selectedJob);
    const updates = { workStatus: newStatus, assignedTechnician: newTech };
    const alreadyDelivered = selectedJob.workStatus === "DELIVERED";
    const currentPaid = Number(selectedJob.amountPaid || 0);
    const currentPending = Number(
      selectedJob.amountPending ?? Math.max(0, total - currentPaid),
    );

    if (newStatus === "DELIVERED") {
      if (clearPayment) {
        updates.amountPaid = total;
        updates.amountPending = 0;
        updates.paymentStatus = "PAID";
      } else if (alreadyDelivered && selectedJob.paymentStatus === "PARTIAL") {
        const extra = Number(addMorePaid);
        if (extra > 0) {
          const nextPaid = Math.min(total, currentPaid + extra);
          updates.amountPaid = nextPaid;
          updates.amountPending = Math.max(0, total - nextPaid);
          updates.paymentStatus = updates.amountPending <= 0 ? "PAID" : "PARTIAL";
        }
      } else if (!alreadyDelivered) {
        if (!paymentMode) {
          setStatusError("Delivered ke liye Full Payment ya Mixed Payment select karein.");
          return;
        }
        if (paymentMode === "FULL") {
          updates.amountPaid = total;
          updates.amountPending = 0;
          updates.paymentStatus = "PAID";
        } else {
          const paid = Number(paidNow);
          if (!paid || paid <= 0) {
            setStatusError("Mixed payment mein abhi ki amount likhein.");
            return;
          }
          if (paid > total) {
            setStatusError("Paid amount total se zyada nahi ho sakti.");
            return;
          }
          updates.amountPaid = paid;
          updates.amountPending = total - paid;
          updates.paymentStatus = updates.amountPending > 0 ? "PARTIAL" : "PAID";
        }
        updates.deliveredAt = new Date().toISOString();
        updates.lastPaymentAt = new Date().toISOString();
      }
    }

    setStatusError("");
    try {
      await onUpdateJob(jobId, updates);
      setSelectedJob(null);
      resetPaymentForm();
      console.info("Repair worksheet updated successfully.");
    } catch (err) {
      setStatusError(err.message || "Status transition failure.");
    }
  };
  const handleDeleteJob = (id) => {
    openConfirm({
      title: isAdmin ? "Permanently delete this job?" : "Remove this job?",
      message: isAdmin
        ? "This repair job will be permanently deleted."
        : "This job will be removed. Admin will see who deleted it.",
      confirmLabel: isAdmin ? "Delete permanently" : "Remove",
      onConfirm: async () => {
        try {
          await onDeleteJob(id);
          setSelectedJob(null);
          resetPaymentForm();
        } catch (err) {
          openAlert({ title: "Delete failed", message: err.message || "Delete failed.", variant: "danger" });
        }
      },
    });
  };
  const handleRemoveTechnician = (name) => {
    openConfirm({
      title: "Remove technician?",
      message: `Remove "${name}" from the technician list?`,
      confirmLabel: "Remove",
      onConfirm: () => onDeleteTechnician(name),
    });
  };
  if (invoiceJob) {
    return /* @__PURE__ */ jsx(JobInvoiceView, { job: invoiceJob, onClose: () => setInvoiceJob(null) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-905 dark:text-white", children: "Active Workshop Job Sheets" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Track and update diagnostic states, assign mechanics, and process checkout completions" })
    ] }) }),
    /* @__PURE__ */ jsx(TechnicianManager, {
      technicians,
      canManage: canManageTechs,
      onAdd: onAddTechnician,
      onDelete: handleRemoveTechnician
    }),
    /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Search job sheets by customer, plate number, assigned tech or Job ID...",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: "w-full bg-slate-55 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs py-2.5 pr-4 pl-10 h-10 outline-hidden focus:ring-1 focus:ring-blue-500"
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-3 text-xs opacity-50", children: "\u{1F50D}" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDateFilter("all"), className: `px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${dateFilter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`, children: "All Jobs" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDateFilter("today"), className: `px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${dateFilter === "today" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`, children: "Today" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDateFilter("custom"), className: `px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${dateFilter === "custom" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`, children: "Custom Range" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: handleExportExcel, className: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer whitespace-nowrap", children: "📥 Export to Excel" })
      ] }),
      dateFilter === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 uppercase mb-1", children: "From" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: customFrom, onChange: (e) => setCustomFrom(e.target.value), className: "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 uppercase mb-1", children: "To" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: customTo, onChange: (e) => setCustomTo(e.target.value), className: "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 font-bold uppercase", children: ["Showing ", filtered.length, " of ", dateFiltered.length, " job sheets", search ? " (search filtered)" : ""] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      filtered.map((job) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-755 transition-all shadow-xs flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "font-mono font-black text-xs text-blue-500", children: job.jobNumber }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: `px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(job.workStatus)}`, children: job.workStatus.replace("_", " ") }),
              job.workStatus === "DELIVERED" && job.paymentStatus === "PARTIAL" && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-amber-600 dark:text-amber-400", children: "Payment: Partial" }),
              job.workStatus === "DELIVERED" && job.paymentStatus === "PAID" && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-emerald-600 dark:text-emerald-400", children: "Payment: Done" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 mb-4 text-xs", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase font-bold text-slate-400", children: "Client Details" }),
              /* @__PURE__ */ jsx("p", { className: "font-black text-slate-900 dark:text-slate-100", children: job.customerName }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-mono mt-0.5", children: job.mobileNumber })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase font-bold text-slate-400", children: "Assigned Vehicle" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-900 dark:text-slate-200 truncate", children: [
                job.vehicleMake,
                " ",
                job.vehicleModel
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 font-mono mt-0.5", children: [
                "Plate: ",
                /* @__PURE__ */ jsx("span", { className: "font-black", children: job.vehicleNumber })
              ] })
            ] })
          ] }),
          job.workRequired && /* @__PURE__ */ jsxs("div", { className: "text-xs mb-3 text-slate-700 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-850 p-2.5 rounded-lg border border-dashed border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("span", { className: "font-bold block text-[9px] text-slate-400 uppercase tracking-widest mb-1", children: "Instruction details" }),
            /* @__PURE__ */ jsxs("p", { className: "italic text-[11px]", children: [
              '"',
              job.workRequired,
              '"'
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs pt-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-bold", children: "Assigned Foreman:" }),
            /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-lg text-[10px]", children: job.assignedTechnician })
          ] }),
          job.workStatus === "DELIVERED" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-[10px] mt-2", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-emerald-600 dark:text-emerald-400 font-bold", children: ["Paid: Rs. ", Number(job.amountPaid || 0).toLocaleString()] }),
            /* @__PURE__ */ jsxs("p", { className: "text-amber-600 dark:text-amber-400 font-bold", children: ["Pending: Rs. ", Number(job.amountPending ?? Math.max(0, jobTotal(job) - Number(job.amountPaid || 0))).toLocaleString()] })
          ] }),
          isAdmin && /* @__PURE__ */ jsx(AuditInfo, { record: job, className: "mt-2" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-black text-slate-900 dark:text-white", children: [
            "Total Parts + Labour: ",
            /* @__PURE__ */ jsxs("span", { className: "text-blue-500", children: [
              "Rs. ",
              job.calculations.grandTotal.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setInvoiceJob(job),
                className: "bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                children: "\u{1F9FE} Invoice"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => openStatusModal(job),
                className: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all text-slate-700 dark:text-slate-200 cursor-pointer",
                children: "\u2699\uFE0F Update Status"
              }
            ),
            !job.isDeleted && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleDeleteJob(job.id),
                className: "px-2.5 py-1.5 rounded-lg hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black cursor-pointer border border-rose-500/25 transition-all",
                title: isAdmin ? "Permanently delete job" : "Remove job",
                children: "\u{1F5D1}\uFE0F Delete"
              }
            )
          ] })
        ] })
      ] }, job.id)),
      filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full py-16 text-center text-xs text-slate-400 italic", children: search ? "No job worksheets matched your search." : dateFilter === "all" ? "No bay repair job worksheets present." : "No jobs in selected date range." })
    ] }),
    selectedJob && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-905 dark:text-white uppercase tracking-wider mb-2", children: "Update Workshop Job worksheet state" }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mb-4", children: [
        selectedJob.jobNumber,
        " \u2022 client Account: ",
        selectedJob.customerName
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5", children: "Work Progress Status" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: newStatus,
              onChange: (e) => setNewStatus(e.target.value),
              autoComplete: "off",
              "data-lpignore": "true",
              "data-1p-ignore": true,
              "data-form-type": "other",
              className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden",
              children: [
                /* @__PURE__ */ jsx("option", { value: "PENDING", disabled: false, children: "Pending (Awaiting Bay Entry)" }),
                /* @__PURE__ */ jsx("option", { value: "IN_PROGRESS", disabled: false, children: "In Progress (Mechanic Active)" }),
                /* @__PURE__ */ jsx("option", { value: "WAITING_PARTS", disabled: false, children: "Waiting Parts (Stock Ordered)" }),
                /* @__PURE__ */ jsx("option", { value: "COMPLETED", disabled: false, children: "Completed (Repairs finished, Deduct master parts volume)" }),
                /* @__PURE__ */ jsx("option", { value: "DELIVERED", disabled: false, children: "Delivered (Keys and invoices handed to Client)" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5", children: "Assigned Mechanic Specialist" }),
          /* @__PURE__ */ jsx(TechnicianSelect, {
            technicians,
            value: newTech,
            onChange: setNewTech,
            placeholder: "Select technician"
          })
        ] }),
        newStatus === "COMPLETED" && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-[10px] text-amber-600 dark:text-amber-400", children: [
          "\u26A0\uFE0F Alert: Transitioning to COMPLETED will cause automatic stock volume reduction of ",
          selectedJob.productsUsed.length,
          " inventory parts currently allocated in worksheets."
        ] }),
        newStatus === "DELIVERED" && selectedJob.workStatus !== "DELIVERED" && /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 space-y-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400", children: "Payment Option" }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500", children: ["Total bill: Rs. ", jobTotal(selectedJob).toLocaleString()] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPaymentMode("FULL"), className: `px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${paymentMode === "FULL" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"}`, children: "Full Payment" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPaymentMode("MIXED"), className: `px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${paymentMode === "MIXED" ? "bg-amber-600 text-white" : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"}`, children: "Mixed / Partial" })
          ] }),
          paymentMode === "MIXED" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-500 uppercase mb-1", children: "Abhi ki payment" }),
              /* @__PURE__ */ jsx("input", { type: "number", min: "0", value: paidNow, onChange: (e) => setPaidNow(e.target.value), className: "w-full bg-white dark:bg-slate-950 border rounded-lg py-2 px-2 text-xs", placeholder: "0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-500 uppercase mb-1", children: "Pending (udhar)" }),
              /* @__PURE__ */ jsx("input", { type: "text", readOnly: true, value: Math.max(0, jobTotal(selectedJob) - Number(paidNow || 0)).toLocaleString(), className: "w-full bg-slate-100 dark:bg-slate-800 border rounded-lg py-2 px-2 text-xs" })
            ] })
          ] })
        ] }),
        newStatus === "DELIVERED" && selectedJob.workStatus === "DELIVERED" && selectedJob.paymentStatus === "PARTIAL" && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-[10px]", children: [
            /* @__PURE__ */ jsxs("p", { children: ["Paid: Rs. ", Number(selectedJob.amountPaid || 0).toLocaleString()] }),
            /* @__PURE__ */ jsxs("p", { children: ["Pending: Rs. ", Number(selectedJob.amountPending ?? Math.max(0, jobTotal(selectedJob) - Number(selectedJob.amountPaid || 0))).toLocaleString()] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-500 uppercase mb-1", children: "Aur payment add karein" }),
            /* @__PURE__ */ jsx("input", { type: "number", min: "0", value: addMorePaid, onChange: (e) => setAddMorePaid(e.target.value), className: "w-full bg-white dark:bg-slate-950 border rounded-lg py-2 px-2 text-xs", placeholder: "0" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handleUpdateStatus(selectedJob.id, true), className: "w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2 rounded-lg cursor-pointer", children: "Done — Full Payment Clear" })
        ] }),
        statusError && /* @__PURE__ */ jsx("div", { className: "bg-rose-500/10 border border-rose-500/25 text-rose-600 p-3 rounded-xl text-[10px]", children: statusError }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleDeleteJob(selectedJob.id),
              className: "text-[10px] font-bold text-rose-600 hover:bg-rose-500/10 px-3 py-2 rounded-xl cursor-pointer border border-rose-500/25",
              children: "\u{1F5D1}\uFE0F Delete job"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => { setSelectedJob(null); resetPaymentForm(); },
              className: "border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-505 dark:text-slate-300 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleUpdateStatus(selectedJob.id),
              className: "bg-blue-600 hover:bg-blue-550 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer",
              children: "Save alterations"
            }
          )
          ] })
        ] })
      ] })
    ] }) }),
    modalProps && /* @__PURE__ */ jsx(ConfirmModal, { ...modalProps })
  ] });
}
export {
  JobsView as default
};
