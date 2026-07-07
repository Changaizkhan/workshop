import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useUsersQuery, useGarageMutations } from "../hooks/useGarageQueries";
import { useConfirmModal } from "../hooks/useConfirmModal";
import ConfirmModal from "./ConfirmModal";
import { ALL_PERMISSIONS } from "../permissions";
import { Shield, UserPlus, Trash2, Edit, Check, X, Key } from "lucide-react";
const AVAILABLE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard Hub" },
  { id: "inventory", label: "Spares & Supplies" },
  { id: "customers", label: "Fleet Clients" },
  { id: "estimates", label: "Invoices & Estimates" },
  { id: "jobs", label: "Bay Repair Jobs" },
  { id: "expenses", label: "Cost Expenditures" },
  { id: "investor", label: "Investor Partners" },
  { id: "reports", label: "Business Audits" },
  { id: "approvals", label: "Authority Queue" }
];
function AdminUsersView({ currentUser, investors = [] }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const limit = 15;
  const { data, isLoading: loading, isFetching, error: queryError } = useUsersQuery({ page, limit, search, enabled: true });
  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary ?? { total: 0, admin: 0, manager: 0, staff: 0 };
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const { createUser, updateUser, deleteUser } = useGarageMutations();
  const { openConfirm, openAlert, modalProps } = useConfirmModal();
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role: "STAFF",
    password: "",
    permissions: [],
    assignedInvestorIds: []
  });
  const investorOptions = (investors || []).filter((i) => !i.isDeleted);
  const displayError = error || queryError?.message;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      username: "",
      role: "STAFF",
      password: "",
      permissions: ["dashboard", "inventory", "customers", "estimates", "jobs"],
      assignedInvestorIds: []
    });
    setError(null);
    setShowModal(true);
  };
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      password: "",
      permissions: user.permissions || ["dashboard", "inventory", "customers", "estimates", "jobs"],
      assignedInvestorIds: user.assignedInvestorIds || []
    });
    setError(null);
    setShowModal(true);
  };
  const handleTogglePermission = (permId) => {
    setFormData((prev) => {
      const active = prev.permissions.includes(permId);
      const updated = active ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId];
      const next = { ...prev, permissions: updated };
      if (permId === "investor" && active) next.assignedInvestorIds = [];
      return next;
    });
  };
  const handleToggleInvestor = (investorId) => {
    setFormData((prev) => {
      const active = prev.assignedInvestorIds.includes(investorId);
      const updated = active
        ? prev.assignedInvestorIds.filter((id) => id !== investorId)
        : [...prev.assignedInvestorIds, investorId];
      return { ...prev, assignedInvestorIds: updated };
    });
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username) {
      setError("Please provide at least Name and Username attributes.");
      return;
    }
    if (!editingUser && !formData.password) {
      setError("A secure raw password is required for new system access.");
      return;
    }
    if (formData.role !== "ADMIN" && formData.permissions.length === 0) {
      setError("Select at least one page permission for this user.");
      return;
    }
    if (
      formData.role !== "ADMIN" &&
      formData.permissions.includes("investor") &&
      formData.assignedInvestorIds.length === 0
    ) {
      setError("Select at least one investor — user will only see that investor's cars/parts.");
      return;
    }
    const payload = {
      name: formData.name,
      username: formData.username,
      role: formData.role,
      permissions: formData.role === "ADMIN" ? [...ALL_PERMISSIONS] : formData.permissions,
      assignedInvestorIds: formData.role === "ADMIN" ? [] : formData.assignedInvestorIds,
    };
    if (!editingUser || formData.password.trim()) {
      payload.password = formData.password;
    }
    try {
      setError(null);
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, payload });
        console.info(`Account specifications for ${formData.name} successfully updated.`);
      } else {
        await createUser.mutateAsync(payload);
        console.info(`Enterprise login access for ${formData.name} successfully configured.`);
      }
      setShowModal(false);
    } catch (e2) {
      setError(e2.message || "Failure writing adjustments payload to MongoDB backing.");
    }
  };
  const handleDelete = (user) => {
    if (user.id === currentUser.id) {
      openAlert({
        title: "Cannot delete account",
        message: "You cannot delete your current active admin account.",
        variant: "warning",
      });
      return;
    }
    openConfirm({
      title: "Delete workforce account?",
      message: `Are you sure you want to completely delete login access for ${user.name}? This cannot be undone.`,
      confirmLabel: "Delete account",
      onConfirm: async () => {
        try {
          setError(null);
          await deleteUser.mutateAsync(user.id);
          openAlert({
            title: "Account removed",
            message: `User account ${user.name} was removed successfully.`,
            variant: "info",
          });
        } catch (e) {
          openAlert({
            title: "Delete failed",
            message: e.message || "Failure deleting target workforce index.",
            variant: "danger",
          });
        }
      },
    });
  };
  const totalCount = summary.total;
  const adminCount = summary.admin;
  const managerCount = summary.manager;
  const staffCount = summary.staff;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-black text-slate-909 dark:text-white uppercase tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "text-blue-500 h-5 w-5" }),
          " Enterprise Workforce & Role-Based Control (RBAC)"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-450 mt-1", children: "Configure secure access, delegate administrative roles, and toggle granular system module permissions." })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleOpenCreate,
          className: "bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-500/10 cursor-pointer",
          children: [
            /* @__PURE__ */ jsx(UserPlus, { className: "h-4 w-4" }),
            " Create Workforce Account"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "Total Accounts" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 font-mono", children: totalCount })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "System Admins" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono", children: adminCount })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-201 dark:border-slate-800 p-4 rounded-2xl", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "Branch Managers" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono", children: managerCount })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-201 dark:border-slate-800 p-4 rounded-2xl", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest block", children: "Staff & Techs" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono", children: staffCount })
      ] })
    ] }),
    error && !showModal && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-red-500/10 border border-red-550/20 text-red-500 rounded-3xl text-xs font-bold font-mono", children: [
      "\u26A0\uFE0F ERROR: ",
      displayError
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "search",
          value: searchInput,
          onChange: (e) => setSearchInput(e.target.value),
          placeholder: "Search by name, username, or role...",
          className: "w-full sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs py-2.5 px-3 rounded-xl focus:border-blue-500 outline-hidden"
        }
      ),
      /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0", children: [
        total,
        " accounts",
        isFetching ? " \u2022 syncing..." : ""
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs", children: loading ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-xs text-slate-400 italic font-bold", children: "Loading workforce accounts..." }) : users.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-slate-400 italic text-xs", children: search ? "No users match your search." : 'No system users registered. Click "Create Workforce Account" to seed your branch.' }) : /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-slate-450 uppercase font-black text-[9px] tracking-widest border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 pl-6", children: "Workforce Name" }),
        /* @__PURE__ */ jsx("th", { className: "p-4", children: "Username ID" }),
        /* @__PURE__ */ jsx("th", { className: "p-4", children: "Designated Role" }),
        /* @__PURE__ */ jsx("th", { className: "p-4", children: "Module Permissions" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 pr-6 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: users.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-blue-50/10 transition-colors", children: [
        /* @__PURE__ */ jsxs("td", { className: "p-4 pl-6", children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white text-xs", children: item.name }),
          item.id === currentUser.id && /* @__PURE__ */ jsx("span", { className: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-black text-[8px] tracking-wide uppercase px-1.5 py-0.5 rounded mt-1 inline-block", children: "Primary Session" })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "p-4 font-mono font-bold text-slate-650 dark:text-slate-300", children: item.username }),
        /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.role === "ADMIN" ? "bg-blue-100 text-blue-850 dark:bg-blue-950/40 dark:text-blue-400" : item.role === "MANAGER" ? "bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-400" : item.role === "STAFF" ? "bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400" : "bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300"}`, children: item.role }) }),
        /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 max-w-xs", children: (item.permissions || AVAILABLE_PERMISSIONS.map((p) => p.id)).map((p) => /* @__PURE__ */ jsx(
          "span",
          {
            className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[9px] font-semibold px-1.5 py-0.5 rounded cursor-default border border-slate-200/20",
            children: AVAILABLE_PERMISSIONS.find((o) => o.id === p)?.label || p
          },
          p
        )) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-4 pr-6 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleOpenEdit(item),
              className: "p-1.5 hover:p-1.5 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 text-slate-450 rounded-lg transition-all cursor-pointer",
              title: "Edit user details & permissions",
              children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleDelete(item),
              disabled: item.id === currentUser.id,
              className: `p-1.5 rounded-lg transition-all cursor-pointer ${item.id === currentUser.id ? "text-slate-300 dark:text-slate-800 cursor-not-allowed" : "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-450 text-slate-450"}`,
              title: "Delete account",
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
            }
          )
        ] }) })
      ] }, item.id)) })
    ] }) }) }),
    totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: [
        "Page ",
        page,
        " of ",
        totalPages
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            disabled: page <= 1,
            onClick: () => setPage((p) => Math.max(1, p - 1)),
            className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
          },
          "Previous"
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            disabled: page >= totalPages,
            onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
            className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
          },
          "Next"
        )
      ] })
    ] }),
    showModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4 my-8", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowModal(false),
          className: "absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer",
          children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-black uppercase text-slate-850 dark:text-white tracking-wider pb-1", children: editingUser ? "\u{1F58A}\uFE0F Alter Workforce Credentials" : "\u2795 Set Up Workforce Login" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-450 uppercase", children: editingUser ? `Adjusting credentials for ${editingUser.name}` : "Provisioning new system operator credentials" })
      ] }),
      error && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-rose-500/10 border border-rose-550/20 text-rose-500 font-mono text-[10px] rounded-xl font-bold", children: [
        "\u26A0\uFE0F ",
        error
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-405 uppercase tracking-wider", children: "Employee Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                value: formData.name,
                onChange: (e) => setFormData((prev) => ({ ...prev, name: e.target.value })),
                placeholder: "e.g. Adeel Razzaq",
                className: "w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-405 uppercase tracking-wider", children: "Unique Username" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                value: formData.username,
                onChange: (e) => setFormData((prev) => ({ ...prev, username: e.target.value })),
                placeholder: "e.g. adeel_repairs",
                className: "w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-405 uppercase tracking-wider", children: "Secret Raw Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: !editingUser,
                  value: formData.password,
                  onChange: (e) => setFormData((prev) => ({ ...prev, password: e.target.value })),
                  placeholder: editingUser ? "(Keep unchanged to skip)" : "Choose robust password",
                  className: "w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 pr-8 rounded-xl focus:border-blue-500 outline-hidden font-mono"
                }
              ),
              /* @__PURE__ */ jsx(Key, { className: "absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-405 uppercase tracking-wider", children: "Designated ERP Role" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: formData.role,
                onChange: (e) => {
                  const role = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    role,
                    permissions: role === "ADMIN" ? [...ALL_PERMISSIONS] : prev.permissions,
                    assignedInvestorIds: role === "ADMIN" ? [] : prev.assignedInvestorIds,
                  }));
                },
                className: "w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "USER", children: "Staff/User (Lowest Spec)" }),
                  /* @__PURE__ */ jsx("option", { value: "STAFF", children: "Workshop Staff" }),
                  /* @__PURE__ */ jsx("option", { value: "MANAGER", children: "Branch Manager" }),
                  /* @__PURE__ */ jsx("option", { value: "ADMIN", children: "System Administrator" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-405 uppercase tracking-wider mb-0.5", children: "Custom Module Permissions" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-450 italic", children: "Explicitly grant or revoke access to individual system modules." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2 pt-1", children: AVAILABLE_PERMISSIONS.map((perm) => {
            const active = formData.permissions.includes(perm.id);
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleTogglePermission(perm.id),
                className: `p-2 rounded-xl text-left border text-[10px] font-extrabold flex items-center justify-between gap-1 transition-all cursor-pointer ${active ? "bg-blue-50/20 border-blue-500 text-blue-500 dark:bg-blue-950/15" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-450"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: perm.label }),
                  active ? /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 shrink-0" }) : /* @__PURE__ */ jsx(X, { className: "h-3 w-3 shrink-0" })
                ]
              },
              perm.id
            );
          }) })
        ] }),
        formData.role !== "ADMIN" && formData.permissions.includes("investor") && /* @__PURE__ */ jsxs("div", { className: "space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-405 uppercase tracking-wider mb-0.5", children: "Assigned Investor Partners" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-450 italic", children: "User will only see cars/parts from selected investors." })
          ] }),
          investorOptions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-[10px] text-amber-600 dark:text-amber-400 italic p-2", children: "No investors in system yet. Add investors first from Investor Partners page." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-40 overflow-y-auto", children: investorOptions.map((inv) => {
            const active = formData.assignedInvestorIds.includes(inv.id);
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleToggleInvestor(inv.id),
                className: `p-2 rounded-xl text-left border text-[10px] font-extrabold flex items-center justify-between gap-1 transition-all cursor-pointer ${active ? "bg-emerald-50/20 border-emerald-500 text-emerald-600 dark:bg-emerald-950/15" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-450"}`,
                children: [
                  /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
                    inv.investorName,
                    " \u2022 ",
                    inv.mobileNumber
                  ] }),
                  active ? /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 shrink-0" }) : /* @__PURE__ */ jsx(X, { className: "h-3 w-3 shrink-0" })
                ]
              },
              inv.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowModal(false),
              className: "px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-350 text-xs font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer",
              children: "Save Account"
            }
          )
        ] })
      ] })
    ] }) }),
    modalProps && /* @__PURE__ */ jsx(ConfirmModal, { ...modalProps })
  ] });
}
export {
  AdminUsersView as default
};
