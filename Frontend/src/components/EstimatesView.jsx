import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import AuditInfo from "./AuditInfo";
import ConfirmModal from "./ConfirmModal";
import TechnicianSelect from "./TechnicianSelect";
import WorkshopEstimatePrint from "./WorkshopEstimatePrint";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { filterEstimatesByDate, exportEstimatesToExcel } from "../utils/exportEstimatesExcel";

const todayIso = () => new Date().toISOString().substring(0, 10);
function EstimatesView({
  estimates,
  products,
  customers = [],
  technicians = [],
  user,
  onCreateEstimate,
  onUpdateEstimate,
  onDeleteEstimate,
  onConvertToJob
}) {
  const isAdmin = user?.role === "ADMIN";
  const [activeView, setActiveView] = useState("list");
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [editingEstimateId, setEditingEstimateId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [address, setAddress] = useState("");
  const [customerCnic, setCustomerCnic] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [mileage, setMileage] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [colour, setColour] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [selectedFleetId, setSelectedFleetId] = useState("");
  const [selectedFleetCarId, setSelectedFleetCarId] = useState("");
  const [fleetClientSearch, setFleetClientSearch] = useState("");
  const [fleetClientPickerOpen, setFleetClientPickerOpen] = useState(false);
  const [linkedCustomerId, setLinkedCustomerId] = useState("");
  const [workRequired, setWorkRequired] = useState("");
  const [items, setItems] = useState([]);
  const [labours, setLabours] = useState([]);
  const [customs, setCustoms] = useState([]);
  const [selectedProdId, setSelectedProdId] = useState("");
  const [prodQty, setProdQty] = useState(1);
  const [externalPartName, setExternalPartName] = useState("");
  const [externalPartQty, setExternalPartQty] = useState(1);
  const [externalPartPrice, setExternalPartPrice] = useState(0);
  const [labourName, setLabourName] = useState("");
  const [labourCost, setLabourCost] = useState(0);
  const [customName, setCustomName] = useState("");
  const [customCost, setCustomCost] = useState(0);
  const [taxPercent, setTaxPercent] = useState(8.25);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [techPromptOpen, setTechPromptOpen] = useState(false);
  const [assignedTech, setAssignedTech] = useState("");
  const [targetEstId, setTargetEstId] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());
  const [search, setSearch] = useState("");
  const { openConfirm, openAlert, modalProps } = useConfirmModal();
  const dateFilteredEstimates = filterEstimatesByDate(estimates, dateFilter, customFrom, customTo);
  const searchKey = search.trim().toLowerCase();
  const filteredEstimates = dateFilteredEstimates.filter((est) => {
    if (!searchKey) return true;
    return (
      (est.customerName || "").toLowerCase().includes(searchKey) ||
      (est.estimateNumber || "").toLowerCase().includes(searchKey) ||
      (est.vehicleNumber || "").toLowerCase().includes(searchKey) ||
      (est.mobileNumber || "").toLowerCase().includes(searchKey) ||
      (est.status || "").toLowerCase().includes(searchKey)
    );
  });
  const fleetList = customers.filter((c) => !c.isDeleted);
  const getCustomerCars = (c) => {
    if (!c) return [];
    if (Array.isArray(c.cars) && c.cars.length) return c.cars;
    if (c.vehicleNumber) {
      return [{
        id: `legacy-${c.id}`,
        vehicleNumber: c.vehicleNumber,
        vehicleMake: c.vehicleMake || "",
        vehicleModel: c.vehicleModel || "",
        chassisNumber: "",
        colour: "",
        engineNumber: ""
      }];
    }
    return [];
  };
  const selectedFleetCustomer = fleetList.find((c) => c.id === selectedFleetId);
  const fleetCars = getCustomerCars(selectedFleetCustomer);
  const fleetCarCount = (c) => getCustomerCars(c).length;
  const matchFleetClient = (c, q) => {
    const key = q.trim().toLowerCase();
    if (!key) return false;
    const carPlates = getCustomerCars(c).map((car) => car.vehicleNumber || "").join(" ");
    return (
      (c.customerName || "").toLowerCase().includes(key) ||
      (c.mobileNumber || "").toLowerCase().includes(key) ||
      (c.vehicleNumber || "").toLowerCase().includes(key) ||
      carPlates.toLowerCase().includes(key)
    );
  };
  const fleetClientSuggestions = fleetClientSearch.trim()
    ? fleetList.filter((c) => matchFleetClient(c, fleetClientSearch)).slice(0, 8)
    : [];
  const pickFleetClient = (c) => {
    setFleetClientPickerOpen(false);
    handleFleetCustomerChange(c.id);
    setFleetClientSearch(c.customerName || "");
  };
  const clearFleetClient = () => {
    handleFleetCustomerChange("");
    setFleetClientSearch("");
    setFleetClientPickerOpen(false);
  };
  const applyFleetCar = (car) => {
    if (!car) return;
    setVehicleNo(car.vehicleNumber || "");
    setVehicleMake(car.vehicleMake || "");
    setVehicleModel(car.vehicleModel || "");
    setChassisNumber(car.chassisNumber || "");
    setColour(car.colour || "");
    setEngineNumber(car.engineNumber || "");
  };
  const handleFleetCustomerChange = (id) => {
    setSelectedFleetId(id);
    setSelectedFleetCarId("");
    if (!id) {
      setLinkedCustomerId("");
      setFleetClientSearch("");
      setFleetClientPickerOpen(false);
      return;
    }
    const c = fleetList.find((x) => x.id === id);
    if (!c) return;
    setLinkedCustomerId(c.id);
    setFleetClientSearch(c.customerName || "");
    setCustomerName(c.customerName || "");
    setContactNo(c.mobileNumber || "");
    setAddress(c.address || "");
    const cars = getCustomerCars(c);
    if (cars.length === 1) {
      const only = cars[0];
      setSelectedFleetCarId(only.id || only.vehicleNumber);
      applyFleetCar(only);
    }
  };
  const handleFleetCarChange = (carKey) => {
    setSelectedFleetCarId(carKey);
    const car = fleetCars.find((x) => (x.id || x.vehicleNumber) === carKey);
    applyFleetCar(car);
  };
  const syncFleetSelectionFromEstimate = (est) => {
    let fleet = null;
    if (est.customerId) {
      fleet = fleetList.find((c) => c.id === est.customerId);
    }
    if (!fleet && est.customerName) {
      const key = est.customerName.trim().toLowerCase();
      fleet = fleetList.find((c) => c.customerName?.trim().toLowerCase() === key);
    }
    if (fleet) {
      setSelectedFleetId(fleet.id);
      setLinkedCustomerId(fleet.id);
      setFleetClientSearch(fleet.customerName || "");
      const cars = getCustomerCars(fleet);
      const car = cars.find(
        (x) => x.vehicleNumber?.trim().toUpperCase() === est.vehicleNumber?.trim().toUpperCase()
      );
      setSelectedFleetCarId(car ? car.id || car.vehicleNumber : "");
    } else {
      setSelectedFleetId("");
      setSelectedFleetCarId("");
      setLinkedCustomerId(est.customerId || "");
      setFleetClientSearch("");
      setFleetClientPickerOpen(false);
    }
  };
  const productTotal = items.reduce((acc, i) => acc + i.total, 0);
  const labourTotal = labours.reduce((acc, l) => acc + l.labourCost, 0);
  const customTotal = customs.reduce((acc, c) => acc + c.chargeCost, 0);
  const subtotal = productTotal + labourTotal + customTotal;
  const taxAmount = subtotal * taxPercent / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);
  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    const existingIdx = items.findIndex((i) => i.productId === selectedProdId);
    if (existingIdx !== -1) {
      const updated = [...items];
      updated[existingIdx].quantity += Number(prodQty);
      updated[existingIdx].total = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setItems(updated);
    } else {
      setItems([...items, {
        productId: prod.id,
        productName: prod.productName,
        quantity: Number(prodQty),
        unitPrice: prod.sellingPrice,
        total: Number(prodQty) * prod.sellingPrice
      }]);
    }
    setSelectedProdId("");
    setProdQty(1);
  };
  const handleAddExternalPart = () => {
    const name = externalPartName.trim();
    const qty = Number(externalPartQty);
    const price = Number(externalPartPrice);
    if (!name) {
      setFormError("Enter outside part name.");
      return;
    }
    if (qty < 1) {
      setFormError("Outside part quantity must be at least 1.");
      return;
    }
    if (price < 0) {
      setFormError("Outside part price cannot be negative.");
      return;
    }
    setFormError("");
    const extKey = `ext-manual-${name.toLowerCase().replace(/\s+/g, "-")}`;
    const existingIdx = items.findIndex((i) => i.productId === extKey);
    if (existingIdx !== -1) {
      const updated = [...items];
      updated[existingIdx].quantity += qty;
      updated[existingIdx].total = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setItems(updated);
    } else {
      setItems([...items, {
        productId: extKey,
        productName: name,
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        isExternal: true
      }]);
    }
    setExternalPartName("");
    setExternalPartQty(1);
    setExternalPartPrice(0);
  };
  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };
  const handleAddLabour = () => {
    if (!labourName || labourCost <= 0) return;
    setLabours([...labours, {
      id: `lab-${Date.now()}`,
      labourName,
      labourCost: Number(labourCost)
    }]);
    setLabourName("");
    setLabourCost(0);
  };
  const handleRemoveLabour = (id) => {
    setLabours(labours.filter((l) => l.id !== id));
  };
  const handleAddCustom = () => {
    if (!customName || customCost <= 0) return;
    setCustoms([...customs, {
      id: `cc-${Date.now()}`,
      chargeName: customName,
      chargeCost: Number(customCost)
    }]);
    setCustomName("");
    setCustomCost(0);
  };
  const handleRemoveCustom = (id) => {
    setCustoms(customs.filter((c) => c.id !== id));
  };
  const handleSaveEstimate = async () => {
    if (!customerName || !vehicleNo || !mileage) {
      setFormError("Please fill customer name, vehicle plate, and mileage.");
      return;
    }
    setFormError("");
    setFormSuccess("");
    const calculations = {
      productTotal,
      labourTotal,
      customTotal,
      tax: Number(taxAmount.toFixed(2)),
      discount: Number(discountAmount),
      grandTotal: Number(grandTotal.toFixed(2))
    };
    const payload = {
      ...(linkedCustomerId ? { customerId: linkedCustomerId } : {}),
      customerName,
      mobileNumber: contactNo,
      address,
      customerCnic,
      customerEmail,
      vehicleMake,
      vehicleModel,
      vehicleNumber: vehicleNo,
      vehicleMileage: mileage,
      chassisNumber,
      colour,
      engineNumber,
      workRequired,
      productsUsed: items,
      labourCharges: labours,
      customCharges: customs,
      calculations
    };
    try {
      if (editingEstimateId) {
        const { syncedJobCount } = await onUpdateEstimate(editingEstimateId, payload);
        setFormSuccess(
          syncedJobCount > 0
            ? `Estimate updated. Linked bay repair job also updated automatically.`
            : "Estimate updated successfully."
        );
      } else {
        await onCreateEstimate(payload);
        setFormSuccess("Estimate saved successfully.");
      }
      setCustomerName("");
      setContactNo("");
      setAddress("");
      setCustomerCnic("");
      setCustomerEmail("");
      setSelectedFleetId("");
      setSelectedFleetCarId("");
      setFleetClientSearch("");
      setFleetClientPickerOpen(false);
      setLinkedCustomerId("");
      setVehicleMake("");
      setVehicleModel("");
      setVehicleNo("");
      setMileage("");
      setChassisNumber("");
      setColour("");
      setEngineNumber("");
      setWorkRequired("");
      setItems([]);
      setLabours([]);
      setCustoms([]);
      setExternalPartName("");
      setExternalPartQty(1);
      setExternalPartPrice(0);
      setEditingEstimateId(null);
      setTimeout(() => {
        setFormSuccess("");
        setActiveView("list");
      }, 800);
    } catch (e) {
      setFormError(e.message || "Failed saving estimate sheet.");
    }
  };
  const triggerConvertToJob = (id) => {
    setTargetEstId(id);
    setAssignedTech(technicians[0] || "");
    setTechPromptOpen(true);
  };
  const confirmJobConversion = async () => {
    try {
      await onConvertToJob(targetEstId, assignedTech || "Unassigned");
      setTechPromptOpen(false);
      console.info("SUCCESS! converted estimate to active repairs sheet.");
      setActiveView("list");
    } catch (err) {
      console.info(err.message || "Conversion failed.");
    }
  };

  const handleEdit = (est) => {
    setEditingEstimateId(est.id);
    setCustomerName(est.customerName || "");
    setContactNo(est.mobileNumber || "");
    setAddress(est.address || "");
    setCustomerCnic(est.customerCnic || "");
    setCustomerEmail(est.customerEmail || "");
    setVehicleMake(est.vehicleMake || "");
    setVehicleModel(est.vehicleModel || "");
    setVehicleNo(est.vehicleNumber || "");
    setMileage(est.vehicleMileage || "");
    setChassisNumber(est.chassisNumber || "");
    setColour(est.colour || "");
    setEngineNumber(est.engineNumber || "");
    setWorkRequired(est.workRequired || "");
    setItems(est.productsUsed || []);
    setLabours(est.labourCharges || []);
    setCustoms(est.customCharges || []);
    const calc = est.calculations || {};
    setTaxPercent(
      calc.productTotal || calc.labourTotal || calc.customTotal
        ? ((calc.tax || 0) * 100) / ((calc.productTotal || 0) + (calc.labourTotal || 0) + (calc.customTotal || 0)) || 8.25
        : 8.25
    );
    setDiscountAmount(calc.discount || 0);
    syncFleetSelectionFromEstimate(est);
    setActiveView("create");
  };

  const handleExportExcel = () => {
    const label = dateFilter === "custom" ? `${customFrom}_to_${customTo}` : dateFilter;
    const ok = exportEstimatesToExcel(dateFilteredEstimates, label);
    if (!ok) {
      openAlert({
        title: "No estimates to export",
        message: "Selected date range mein koi estimate nahi mili.",
        variant: "warning",
      });
    }
  };

  const handleDelete = (id) => {
    openConfirm({
      title: "Delete estimate sheet?",
      message: "Are you sure you want to permanently delete this estimate sheet? This cannot be undone.",
      confirmLabel: "Delete permanently",
      onConfirm: async () => {
        try {
          await onDeleteEstimate(id);
        } catch (e) {
          openAlert({ title: "Delete failed", message: e.message || "Failed to delete estimate.", variant: "danger" });
        }
      },
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-slate-900 dark:text-white", children: "Estimate Sheets Panel" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Generate commercial quotes and convert approved orders to repairs worksheets" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 shrink-0", children: [
        activeView !== "list" && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setActiveView("list"),
            className: "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs px-3 py-2 rounded-xl text-slate-705 dark:text-slate-300 font-bold transition-all cursor-pointer",
            children: "\u2B05\uFE0F All Estimates"
          }
        ),
        activeView === "list" && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setEditingEstimateId(null);
              setSelectedFleetId("");
              setSelectedFleetCarId("");
              setFleetClientSearch("");
              setFleetClientPickerOpen(false);
              setLinkedCustomerId("");
              setActiveView("create");
            },
            className: "bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer",
            children: "\u2795 Draft New Estimate"
          }
        )
      ] })
    ] }),
    activeView === "list" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search by customer, estimate code, plate number, phone or status...",
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
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDateFilter("all"), className: `px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${dateFilter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`, children: "All Estimates" }),
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
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 font-bold uppercase", children: ["Showing ", filteredEstimates.length, " of ", dateFilteredEstimates.length, " estimate sheets", searchKey ? " (search filtered)" : ""] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-55 dark:bg-slate-800/60 text-slate-400", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black", children: "Est Code" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black", children: "Customer Details" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black", children: "Vehicle plate" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black", children: "Grand Financial Code" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] uppercase font-black text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
        filteredEstimates.map((est) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-blue-50/10 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "p-4 font-mono font-bold text-xs text-slate-900 dark:text-slate-100", children: est.estimateNumber }),
          /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-905 dark:text-slate-200", children: est.customerName }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-450 italic", children: [
              "Drafted: ",
              new Date(est.dateCreated).toLocaleDateString()
            ] }),
            isAdmin && /* @__PURE__ */ jsx(AuditInfo, { record: est, className: "mt-1" })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "bg-slate-100 dark:bg-slate-800 p-1 px-2 rounded font-mono font-extrabold text-[10px] text-slate-700 dark:text-slate-300", children: est.vehicleNumber }) }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-xs font-black text-slate-905 dark:text-slate-200", children: [
            "Rs. ",
            est.calculations.grandTotal.toLocaleString()
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${est.status === "CONVERTED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"}`, children: est.status }) }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 min-w-[10rem]", children: [
            /* View / print */
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setSelectedEstimate(est);
                  setActiveView("invoice");
                },
                className: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all text-slate-700 dark:text-slate-100 cursor-pointer",
                children: "\u{1F441}\uFE0F View"
              }
            ),
            /* Edit */
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleEdit(est),
                className: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                children: "\u270F\uFE0F Edit"
              }
            ),
            est.status !== "CONVERTED" && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => triggerConvertToJob(est.id),
                className: "bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-sm cursor-pointer",
                children: "\u{1F6E0}\uFE0F To Job"
              }
            ),
            /* Delete */
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleDelete(est.id),
                className: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                children: "\u{1F5D1}\uFE0F Delete"
              }
            )
          ] }) })
        ] }, est.id)),
        filteredEstimates.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "text-center p-12 text-xs text-slate-400 italic", children: searchKey ? "No estimates matched your search." : dateFilter === "all" ? "No drafted estimate logs present." : "No estimates in selected date range." }) })
      ] })
    ] }) }) })
    ] }),
    activeView === "create" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        formError && /* @__PURE__ */ jsx("div", { className: "bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs", children: formError }),
        formSuccess && /* @__PURE__ */ jsx("div", { className: "bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs", children: formSuccess }),
        editingEstimateId && isAdmin && /* @__PURE__ */ jsx(AuditInfo, { record: estimates.find((e) => e.id === editingEstimateId), className: "bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl" }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-black uppercase text-slate-450 tracking-widest border-b border-slate-100 dark:border-slate-880 pb-2", children: "1. Customer & Repairs Details" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Fleet Client (search & auto-fill)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: selectedFleetId && selectedFleetCustomer ? selectedFleetCustomer.customerName : fleetClientSearch,
                    readOnly: Boolean(selectedFleetId),
                    onFocus: () => {
                      if (!selectedFleetId) setFleetClientPickerOpen(true);
                    },
                    onBlur: () => {
                      setTimeout(() => setFleetClientPickerOpen(false), 150);
                    },
                    onChange: (e) => {
                      if (selectedFleetId) return;
                      const v = e.target.value;
                      setFleetClientSearch(v);
                      setFleetClientPickerOpen(true);
                    },
                    placeholder: "Search client by name, phone or plate...",
                    className: `w-full bg-slate-50 dark:bg-slate-950 border text-xs py-2 pl-3 rounded-xl focus:border-blue-500 outline-hidden ${selectedFleetId ? "pr-16 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20" : "pr-3 border-slate-200 dark:border-slate-800"}`,
                    autoComplete: "off",
                    "data-lpignore": "true"
                  }
                ),
                selectedFleetId && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onMouseDown: (e) => e.preventDefault(),
                    onClick: clearFleetClient,
                    className: "absolute right-2 top-1.5 text-[10px] font-bold text-slate-500 hover:text-rose-500 px-2 py-1 cursor-pointer",
                    children: "Clear"
                  }
                ),
                fleetClientPickerOpen && !selectedFleetId && fleetClientSearch.trim() && fleetClientSuggestions.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl", children: fleetClientSuggestions.map((c) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onMouseDown: (e) => e.preventDefault(),
                    onClick: () => pickFleetClient(c),
                    className: "w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer",
                    children: /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 dark:text-white", children: c.customerName }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-400 ml-2", children: ["📞 ", c.mobileNumber || "—"] }),
                      /* @__PURE__ */ jsxs("span", { className: "block text-[10px] text-slate-400 mt-0.5", children: [
                        fleetCarCount(c),
                        " ",
                        fleetCarCount(c) === 1 ? "vehicle" : "vehicles"
                      ] })
                    ] })
                  },
                  c.id
                )) }),
                fleetClientPickerOpen && !selectedFleetId && fleetClientSearch.trim() && fleetClientSuggestions.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1 italic px-1", children: "No matching client — fill details manually below." })
              ] }),
              selectedFleetId && selectedFleetCustomer && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5", children: ["✓ Linked: ", selectedFleetCustomer.customerName] })
            ] }),
            fleetCars.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Fleet Vehicle" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: selectedFleetCarId,
                  onChange: (e) => handleFleetCarChange(e.target.value),
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden",
                  "data-lpignore": "true",
                  autoComplete: "off",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "— Select vehicle —" }),
                    fleetCars.map((car) => /* @__PURE__ */ jsx(
                      "option",
                      {
                        value: car.id || car.vehicleNumber,
                        children: [car.vehicleNumber, car.vehicleMake || car.vehicleModel ? ` — ${[car.vehicleMake, car.vehicleModel].filter(Boolean).join(" ")}` : ""].join("")
                      },
                      car.id || car.vehicleNumber
                    ))
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Customer Identifier Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: customerName,
                  onChange: (e) => setCustomerName(e.target.value),
                  placeholder: "Marcus Andrews",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Vehicle License No" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: vehicleNo,
                  onChange: (e) => setVehicleNo(e.target.value),
                  placeholder: "WASH-101",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Odometer Mileage Reading" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: mileage,
                  onChange: (e) => setMileage(e.target.value),
                  placeholder: "42,500 mi",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Contact No." }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: contactNo,
                  onChange: (e) => setContactNo(e.target.value),
                  placeholder: "+92-300-1234567",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Customer CNIC / NTN" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: customerCnic,
                  onChange: (e) => setCustomerCnic(e.target.value),
                  placeholder: "35202-1234567-1",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "E-Mail" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  value: customerEmail,
                  onChange: (e) => setCustomerEmail(e.target.value),
                  placeholder: "customer@email.com",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 lg:col-span-3", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Address" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: address,
                  onChange: (e) => setAddress(e.target.value),
                  placeholder: "Street, area, city",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Vehicle Make" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: vehicleMake,
                  onChange: (e) => setVehicleMake(e.target.value),
                  placeholder: "Toyota",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Vehicle Model" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: vehicleModel,
                  onChange: (e) => setVehicleModel(e.target.value),
                  placeholder: "Corolla",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Chassis No." }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: chassisNumber,
                  onChange: (e) => setChassisNumber(e.target.value),
                  placeholder: "e.g. JHMFC36259S012345",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Colour" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: colour,
                  onChange: (e) => setColour(e.target.value),
                  placeholder: "e.g. Pearl White",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Engine Number" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: engineNumber,
                  onChange: (e) => setEngineNumber(e.target.value),
                  placeholder: "e.g. K20A-1234567",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Required Task/Fault Description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: workRequired,
                onChange: (e) => setWorkRequired(e.target.value),
                placeholder: "Engine oil flush, spark plugs changes, periodic brakes wear maintenance check.",
                className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden",
                rows: 2
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xs font-black uppercase text-slate-450 tracking-widest border-b border-slate-100 dark:border-slate-880 pb-2 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "2. Pull Parts & Supplies" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] text-blue-500", children: "Automapped with master selling rates" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-end", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Select Spare Part" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: selectedProdId,
                  onChange: (e) => setSelectedProdId(e.target.value),
                  autoComplete: "off",
                  "data-lpignore": "true",
                  "data-1p-ignore": true,
                  "data-form-type": "other",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl outline-hidden focus:border-blue-500",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", disabled: false, children: "-- Choose Part from Inventory --" }),
                    products.filter((p) => p?.id && Number(p.quantity) > 0).map((p) => /* @__PURE__ */ jsxs("option", { value: p.id, disabled: false, children: [
                      p.productName,
                      " (Rs. ",
                      Number(p.sellingPrice || 0).toLocaleString(),
                      " - Qty: ",
                      p.quantity,
                      ")"
                    ] }, p.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-24 shrink-0", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Quantity" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "1",
                  value: prodQty,
                  onChange: (e) => setProdQty(Math.max(1, Number(e.target.value))),
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full sm:w-12 shrink-0", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleAddItem,
                className: "bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 w-full rounded-xl cursor-pointer",
                children: "\u2795"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1", children: "Outside part (not in inventory)" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: "Bahir se liya hua part yahan direct naam, qty aur price dal sakte hain." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-end", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Part name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: externalPartName,
                    onChange: (e) => setExternalPartName(e.target.value),
                    placeholder: "e.g. Outside brake pads",
                    className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl outline-hidden focus:border-amber-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-20 shrink-0", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Qty" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "1",
                    value: externalPartQty,
                    onChange: (e) => setExternalPartQty(Math.max(1, Number(e.target.value))),
                    className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl outline-hidden"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-28 shrink-0", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Price (Rs.)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "0",
                    value: externalPartPrice,
                    onChange: (e) => setExternalPartPrice(Math.max(0, Number(e.target.value))),
                    className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl outline-hidden"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full sm:w-auto shrink-0", children: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleAddExternalPart,
                  className: "bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs h-9 px-4 w-full sm:w-auto rounded-xl cursor-pointer whitespace-nowrap",
                  children: "Add outside part"
                }
              ) })
            ] })
          ] }),
          items.length > 0 && /* @__PURE__ */ jsx("div", { className: "border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mt-3", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/40 text-slate-400", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-2", children: "Spec" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-center", children: "Amount" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Unit Price" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-right font-bold", children: "Total" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-center", children: "Remove" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: items.map((it, idx) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsxs("td", { className: "p-2 font-medium", children: [
                it.productName,
                (it.isExternal || String(it.productId || "").startsWith("ext-")) && /* @__PURE__ */ jsx("span", { className: "ml-2 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded", children: "Outside" })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: it.quantity }),
              /* @__PURE__ */ jsxs("td", { className: "p-2 text-right", children: [
                "Rs. ",
                it.unitPrice.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "p-2 text-right font-bold", children: [
                "Rs. ",
                it.total.toLocaleString()
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("button", { onClick: () => handleRemoveItem(idx), className: "text-rose-500 hover:text-rose-600 cursor-pointer", children: "\u{1F5D1}\uFE0F" }) })
            ] }, idx)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-black uppercase text-slate-450 tracking-widest border-b border-slate-100 dark:border-slate-880 pb-2", children: "3. Labour & Service Rates" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-end", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Labour Task Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: labourName,
                  onChange: (e) => setLabourName(e.target.value),
                  placeholder: "e.g. Frontend Rotors turned & install",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-28 shrink-0", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Cost (Rs.)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: labourCost,
                  onChange: (e) => setLabourCost(Number(e.target.value)),
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full sm:w-12 shrink-0", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleAddLabour,
                className: "bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 w-full rounded-xl cursor-pointer",
                children: "\u2795"
              }
            ) })
          ] }),
          labours.length > 0 && /* @__PURE__ */ jsx("div", { className: "border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mt-3", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/40 text-slate-400", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-2", children: "Task" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Labour Fee" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-center", children: "Remove" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: labours.map((lb) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "p-2 font-medium", children: lb.labourName }),
              /* @__PURE__ */ jsxs("td", { className: "p-2 text-right font-bold", children: [
                "Rs. ",
                lb.labourCost.toLocaleString()
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("button", { onClick: () => handleRemoveLabour(lb.id), className: "text-rose-500 hover:text-rose-600 cursor-pointer", children: "\u{1F5D1}\uFE0F" }) })
            ] }, lb.id)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xs font-black uppercase text-slate-450 tracking-widest border-b border-slate-100 dark:border-slate-885 pb-2 flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "4. Administrative Custom Charges" }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase font-bold text-amber-500", children: "Admins Custom overrides" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-end", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Charge Name (e.g. Eco Fee)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: customName,
                  onChange: (e) => setCustomName(e.target.value),
                  placeholder: "Eco-waste disposal charge",
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-28 shrink-0", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5", children: "Charge Cost (Rs.)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: customCost,
                  onChange: (e) => setCustomCost(Number(e.target.value)),
                  className: "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-hidden"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full sm:w-12 shrink-0", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleAddCustom,
                className: "bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 w-full rounded-xl cursor-pointer",
                children: "\u2795"
              }
            ) })
          ] }),
          customs.length > 0 && /* @__PURE__ */ jsx("div", { className: "border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mt-3", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/40 text-slate-400", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-2", children: "Charge Class" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Fee Rate" }),
              /* @__PURE__ */ jsx("th", { className: "p-2 text-center", children: "Remove" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: customs.map((cc) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "p-2 font-medium", children: cc.chargeName }),
              /* @__PURE__ */ jsxs("td", { className: "p-2 text-right font-bold", children: [
                "Rs. ",
                cc.chargeCost.toLocaleString()
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("button", { onClick: () => handleRemoveCustom(cc.id), className: "text-rose-500 hover:text-rose-600 cursor-pointer", children: "\u{1F5D1}\uFE0F" }) })
            ] }, cc.id)) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-3xl space-y-4 shadow-xl", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-800 pb-2", children: "Checkout Summary" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2.5 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Products Total Parts" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Rs. ",
              productTotal.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Labour Total Hours" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Rs. ",
              labourTotal.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Administrative Charges" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Rs. ",
              customTotal.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-800 pt-3 flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Tax Factor Percentage" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: taxPercent,
                  onChange: (e) => setTaxPercent(Math.max(0, Number(e.target.value))),
                  className: "w-14 bg-slate-950 border border-slate-800 text-xs py-1 px-1.5 focus:border-blue-500 rounded text-right outline-hidden text-white"
                }
              ),
              /* @__PURE__ */ jsx("span", { children: "%" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Tax Computed" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Rs. ",
              taxAmount.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-800 pt-3 flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Enterprise Discount Amount (Rs.)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: discountAmount,
                onChange: (e) => setDiscountAmount(Math.max(0, Number(e.target.value))),
                className: "w-20 bg-slate-950 border border-slate-800 text-xs py-1 px-1.5 focus:border-blue-500 rounded text-right outline-hidden text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-800 pt-4 flex justify-between text-base font-extrabold text-blue-400", children: [
            /* @__PURE__ */ jsx("span", { children: "GRAND TOTAL" }),
            /* @__PURE__ */ jsxs("span", { className: "text-lg", children: [
              "Rs. ",
              grandTotal.toLocaleString()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 space-y-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleSaveEstimate,
              className: "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/10 cursor-pointer",
              children: editingEstimateId ? "\u{1F4BE} Update Estimate" : "\u{1F4BE} Confirm & Save Quote"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setActiveView("list"),
              className: "w-full bg-slate-800 hover:bg-slate-750 text-slate-350 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer",
              children: "Cancel"
            }
          )
        ] })
      ] }) })
    ] }),
    activeView === "invoice" && selectedEstimate && /* @__PURE__ */ jsx(WorkshopEstimatePrint, {
      mode: "estimate",
      docNumber: selectedEstimate.estimateNumber,
      dateCreated: selectedEstimate.dateCreated,
      customerName: selectedEstimate.customerName,
      contactNo: selectedEstimate.mobileNumber,
      address: selectedEstimate.address,
      customerCnic: selectedEstimate.customerCnic,
      customerEmail: selectedEstimate.customerEmail,
      vehicleMake: selectedEstimate.vehicleMake,
      vehicleModel: selectedEstimate.vehicleModel,
      vehicleNumber: selectedEstimate.vehicleNumber,
      chassisNumber: selectedEstimate.chassisNumber,
      engineNumber: selectedEstimate.engineNumber,
      colour: selectedEstimate.colour,
      vehicleMileage: selectedEstimate.vehicleMileage,
      workRequired: selectedEstimate.workRequired,
      productsUsed: selectedEstimate.productsUsed || [],
      labourCharges: selectedEstimate.labourCharges || [],
      customCharges: selectedEstimate.customCharges || [],
      calculations: selectedEstimate.calculations || {},
      onClose: () => setActiveView("list"),
      backLabel: "Cancel"
    }),
    techPromptOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-xl", children: [
      /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-1.5", children: "Convert Quote to Active Job" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-4", children: "Please assign a technician to run repair work instructions" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5", children: "Assign Technician" }),
          /* @__PURE__ */ jsx(TechnicianSelect, {
            technicians,
            value: assignedTech,
            onChange: setAssignedTech,
            placeholder: "Select technician"
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setTechPromptOpen(false),
              className: "p-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-150 dark:border-slate-800 cursor-pointer text-xs",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: confirmJobConversion,
              className: "p-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer text-xs",
              children: "Confirm Convert"
            }
          )
        ] })
      ] })
    ] }) }),
    modalProps && /* @__PURE__ */ jsx(ConfirmModal, { ...modalProps })
  ] });
}
export {
  EstimatesView as default
};
