const todayIso = () => new Date().toISOString().substring(0, 10);

export const estimateDateKey = (est) =>
  String(est.dateCreated || est.createdAt || "").substring(0, 10);

export function filterEstimatesByDate(estimates, mode, from = "", to = "") {
  const today = todayIso();
  return estimates.filter((est) => {
    if (est.isDeleted) return false;
    const d = estimateDateKey(est);
    if (mode === "all") return true;
    if (mode === "today") return d === today;
    if (mode === "custom" && from && to) return d >= from && d <= to;
    return true;
  });
}

const csvCell = (value) => {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export function exportEstimatesToExcel(estimates, label = "estimates") {
  if (!estimates.length) return false;

  const header = [
    "Estimate No",
    "Date",
    "Customer Name",
    "Phone",
    "Address",
    "Vehicle Plate",
    "Make",
    "Model",
    "Mileage",
    "Status",
    "Products Total (Rs.)",
    "Labour Total (Rs.)",
    "Custom Total (Rs.)",
    "Tax (Rs.)",
    "Discount (Rs.)",
    "Grand Total (Rs.)",
    "Work Required",
    "Created By",
  ];

  const rows = estimates.map((est) => {
    const calc = est.calculations || {};
    return [
      est.estimateNumber,
      estimateDateKey(est) || new Date(est.dateCreated).toLocaleDateString(),
      est.customerName,
      est.mobileNumber,
      est.address,
      est.vehicleNumber,
      est.vehicleMake,
      est.vehicleModel,
      est.vehicleMileage,
      est.status,
      Number(calc.productTotal || 0),
      Number(calc.labourTotal || 0),
      Number(calc.customTotal || 0),
      Number(calc.tax || 0),
      Number(calc.discount || 0),
      Number(calc.grandTotal || 0),
      est.workRequired,
      est.createdBy || "",
    ].map(csvCell).join(",");
  });

  const csv = [header.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hpg-estimates-${label}-${todayIso()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
