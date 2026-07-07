import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../queryKeys";
import AuditInfo from "./AuditInfo";
import ConfirmModal from "./ConfirmModal";
import { useConfirmModal } from "../hooks/useConfirmModal";
function InventoryView({
  user,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}) {
  const { data: products = [] } = useQuery({
    queryKey: queryKeys.inventory(),
    queryFn: () => api.get("/api/inventory"),
    staleTime: 15_000
  });
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { openConfirm, openAlert, modalProps } = useConfirmModal();
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const part = (p.partNumber || "").toLowerCase();
    return p.productName.toLowerCase().includes(q) || p.productCategory.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q) || part.includes(q);
  });
  const totalInventoryValuation = products.reduce((acc, p) => acc + p.costPrice * p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity <= p.lowStockAlert).length;
  const resetForm = () => {
    setName("");
    setCategory("");
    setBrand("");
    setPartNumber("");
    setSupplierName("");
    setSupplierPhone("");
    setCostPrice(0);
    setSellingPrice(0);
    setQuantity(0);
    setLowStockAlert(5);
    setNotes("");
    setError("");
  };
  const handleOpenAdd = () => {
    resetForm();
    setEditMode(false);
    setModalOpen(true);
  };
  const handleOpenEdit = (p) => {
    setCurrentId(p.id);
    setName(p.productName);
    setCategory(p.productCategory);
    setBrand(p.brand);
    setPartNumber(p.partNumber || "");
    setSupplierName(p.supplierName);
    setSupplierPhone(p.supplierPhone);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setQuantity(p.quantity);
    setLowStockAlert(p.lowStockAlert);
    setNotes(p.notes);
    setEditMode(true);
    setModalOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !brand || !supplierName || costPrice === void 0 || sellingPrice === void 0) {
      setError("Please fill out Name, Category, Brand, Supplier, Cost, and Selling Price.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const payload = {
        productName: name,
        productCategory: category,
        brand,
        partNumber: partNumber || "",
        supplierName,
        supplierPhone,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        quantity: Number(quantity),
        lowStockAlert: Number(lowStockAlert),
        notes
      };
      if (editMode) {
        await onEditProduct(currentId, payload);
        setSuccess("Inventory stock record updated successfully.");
      } else {
        await onAddProduct(payload);
        setSuccess("Master product added successfully.");
        setSearch("");
      }
      setTimeout(() => {
        setModalOpen(false);
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Operation failed.");
    }
  };
  const handleDelete = (id) => {
    openConfirm({
      title: isAdmin ? "Permanently delete product?" : "Remove this product?",
      message: isAdmin
        ? "This product will be permanently removed from inventory."
        : "This product will be removed. Admin will see who deleted it.",
      confirmLabel: isAdmin ? "Delete permanently" : "Remove",
      onConfirm: async () => {
        try {
          await onDeleteProduct(id);
        } catch (err) {
          openAlert({ title: "Delete failed", message: err.message || "Purge action failed.", variant: "danger" });
        }
      },
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider", children: "Total master products" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-slate-800 dark:text-white mt-1", children: [
          products.length,
          " registered"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider", children: "Inventory valuation (At Cost)" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold mt-1 text-blue-600 dark:text-blue-400", children: [
          "Rs. ",
          totalInventoryValuation.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider", children: "Low stock alerts" }),
        /* @__PURE__ */ jsxs("p", { className: `text-xl font-bold mt-1 ${lowStockCount > 0 ? "text-rose-500 font-black" : "text-emerald-500"}`, children: [
          lowStockCount,
          " items low"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold tracking-tight text-slate-900 dark:text-white", children: "Master Parts & Supplies Catalogue" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Add, audit, and trace current garage spares inventory counts" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleOpenAdd,
          className: "bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer",
          children: [
            /* @__PURE__ */ jsx("span", { children: "\u2795" }),
            " Add New Product Range"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Search parts by name, category, brand, supplier name...",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: "w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs py-2.5 pr-4 pl-10 rounded-xl"
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-3.5 text-xs opacity-50", children: "\u{1F50D}" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
      filtered.map((p) => {
        const isLowStock = p.quantity <= p.lowStockAlert;
        const profitMargin = p.sellingPrice - p.costPrice;
        const valCost = p.costPrice * p.quantity;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-xs transition-all flex flex-col justify-between ${p.isDeleted ? "opacity-60 border-rose-400 dark:border-rose-900" : isLowStock ? "border-rose-300 dark:border-rose-950 bg-rose-50/10" : "border-slate-200 dark:border-slate-800"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md", children: p.productCategory }),
                    /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-900 dark:text-slate-100 mt-1.5 text-sm", children: p.productName }),
                    /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
                      "Brand: ",
                      p.brand
                    ] })
                  ] }),
                  isLowStock && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md animate-pulse", children: "Low Stock Alert" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 my-4", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase font-bold text-slate-400", children: "In Stock Count" }),
                    /* @__PURE__ */ jsxs("p", { className: `text-sm font-black ${isLowStock ? "text-rose-500 font-extrabold" : "text-slate-700 dark:text-slate-350"}`, children: [
                      p.quantity,
                      " units"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase font-bold text-slate-400", children: "Total Valuation" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-sm font-black text-slate-700 dark:text-slate-350", children: [
                      "Rs. ",
                      valCost.toLocaleString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-slate-100 dark:border-slate-800 mt-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase font-bold text-slate-400", children: "Dealer Cost" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-800 dark:text-slate-300", children: [
                      "Rs. ",
                      p.costPrice.toLocaleString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-slate-100 dark:border-slate-800 mt-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase font-bold text-slate-400", children: "Retail price" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-emerald-600 dark:text-emerald-400", children: [
                      "Rs. ",
                      p.sellingPrice.toLocaleString()
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-[10px] font-semibold uppercase", children: "Expected Margin per unit:" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-blue-600 dark:text-blue-400", children: [
                    "+Rs. ",
                    profitMargin.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-[10px] space-y-0.5 text-slate-500 dark:text-slate-400", children: [
                  /* @__PURE__ */ jsxs("p", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-650", children: "Supplier:" }),
                    " ",
                    p.supplierName
                  ] }),
                  /* @__PURE__ */ jsxs("p", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-650", children: "Phone:" }),
                    " ",
                    p.supplierPhone
                  ] }),
                  p.notes && /* @__PURE__ */ jsxs("p", { className: "italic text-slate-400 truncate mt-1", children: [
                    '"',
                    p.notes,
                    '"'
                  ] }),
                  isAdmin && /* @__PURE__ */ jsx(AuditInfo, { record: p, className: "mt-2 border-t border-slate-200 dark:border-slate-700 pt-2" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-3 mt-3.5 flex items-center justify-end gap-2 text-xs", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleOpenEdit(p),
                    className: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    children: "\u270F\uFE0F Edit Specs"
                  }
                ),
                !p.isDeleted && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleDelete(p.id),
                    className: "hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    children: "\u{1F5D1}\uFE0F Delete Range"
                  }
                )
              ] })
            ]
          },
          p.id
        );
      }),
      filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full py-16 text-center text-xs text-slate-400 italic", children: "No matching inventory listings found in this workshop branch." })
    ] }),
    modalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2", children: editMode ? "Edit Spare/Lubricant Range" : "Register New Inventory Range" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-2", children: "Changes save immediately. Admin can see who added or edited each item." }),
      editMode && isAdmin && /* @__PURE__ */ jsx(AuditInfo, { record: products.find((x) => x.id === currentId), className: "mb-4" }),
      error && /* @__PURE__ */ jsx("div", { className: "bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 p-3.5 rounded-xl text-xs mb-4", children: error }),
      success && /* @__PURE__ */ jsx("div", { className: "bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs mb-4", children: success }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 max-h-[70vh] overflow-y-auto pr-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Product Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: name,
                onChange: (e) => setName(e.target.value),
                placeholder: "Syntronic 5W-30 Full Synthetic (5L)",
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Product Category" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: category,
                onChange: (e) => setCategory(e.target.value),
                placeholder: "e.g. Lubricants / Brakes",
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
              }
            )
          ] })
        ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Brand / Manufacturer" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: brand,
            onChange: (e) => setBrand(e.target.value),
            placeholder: "Castrol / Brembo",
            className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Part Number / SKU" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: partNumber,
            onChange: (e) => setPartNumber(e.target.value),
            placeholder: "e.g. GA-OL-5W30-001",
            className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Stock Volume Units" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            value: quantity,
            onChange: (e) => setQuantity(Number(e.target.value)),
            className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
          }
        )
      ] })
    ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Cost Price (Rs.)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                value: costPrice,
                onChange: (e) => setCostPrice(Number(e.target.value)),
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Retail Price (Rs.)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                value: sellingPrice,
                onChange: (e) => setSellingPrice(Number(e.target.value)),
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Low Stock Alert Limit" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: lowStockAlert,
                onChange: (e) => setLowStockAlert(Number(e.target.value)),
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Supplier Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: supplierName,
                onChange: (e) => setSupplierName(e.target.value),
                placeholder: "Apex Supplies Wholesale",
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Supplier Contact Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: supplierPhone,
                onChange: (e) => setSupplierPhone(e.target.value),
                placeholder: "+1-555-0922",
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Parts Notes / Fitments description" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              placeholder: "OEM fits for Honda/Acura filter bays...",
              className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-905 dark:text-white",
              rows: 2
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setModalOpen(false),
              className: "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md",
              children: editMode ? "Confirm Edits" : "Add to inventory"
            }
          )
        ] })
      ] })
    ] }) }),
    modalProps && /* @__PURE__ */ jsx(ConfirmModal, { ...modalProps })
  ] });
}
export {
  InventoryView as default
};
