const todayIso = () => new Date().toISOString().substring(0, 10);

export const jobDateKey = (job) =>
  String(job.dateCreated || job.createdAt || "").substring(0, 10);

export function filterJobsByDate(jobs, mode, from = "", to = "") {
  const today = todayIso();
  return jobs.filter((job) => {
    if (job.isDeleted) return false;
    const d = jobDateKey(job);
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

export function exportJobsToExcel(jobs, label = "jobs") {
  if (!jobs.length) return false;

  const header = [
    "Job No",
    "Date",
    "Customer Name",
    "Phone",
    "Address",
    "Vehicle Plate",
    "Make",
    "Model",
    "Mileage",
    "Technician Name",
    "Car Delivered",
    "Work Status",
    "Payment Status",
    "Products Total (Rs.)",
    "Labour Total (Rs.)",
    "Custom Total (Rs.)",
    "Tax (Rs.)",
    "Discount (Rs.)",
    "Grand Total (Rs.)",
    "Amount Paid (Rs.)",
    "Amount Pending (Rs.)",
    "Delivered Date",
    "Work Required",
    "Created By",
  ];

  const rows = jobs.map((job) => {
    const calc = job.calculations || {};
    const total = Number(calc.grandTotal || 0);
    const paid = Number(job.amountPaid || 0);
    const pending = Number(job.amountPending ?? Math.max(0, total - paid));
    const isDelivered = job.workStatus === "DELIVERED";
    return [
      job.jobNumber,
      jobDateKey(job) || new Date(job.dateCreated).toLocaleDateString(),
      job.customerName,
      job.mobileNumber,
      job.address,
      job.vehicleNumber,
      job.vehicleMake,
      job.vehicleModel,
      job.vehicleMileage,
      job.assignedTechnician || "Unassigned",
      isDelivered ? "Yes" : "No",
      job.workStatus,
      job.paymentStatus || (isDelivered ? "PENDING" : ""),
      Number(calc.productTotal || 0),
      Number(calc.labourTotal || 0),
      Number(calc.customTotal || 0),
      Number(calc.tax || 0),
      Number(calc.discount || 0),
      total,
      paid,
      pending,
      job.deliveredAt ? jobDateKey({ dateCreated: job.deliveredAt }) : "",
      job.workRequired,
      job.createdBy || "",
    ].map(csvCell).join(",");
  });

  const csv = [header.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hpg-bay-jobs-${label}-${todayIso()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
