import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { includeDeletedFor, stampCreate, stampUpdate, performDelete } from "../middleware/audit.js";

const svc = () => getServices().jobs;

export const list = asyncHandler(async (req, res) => {
  res.json(await svc().list(includeDeletedFor(req)));
});

export const create = asyncHandler(async (req, res) => {
  const jobData = req.body;
  if (!jobData.customerName || !jobData.vehicleNumber) {
    return res.status(400).json({ error: "Customer name and vehicle reference are essential for a job sheet." });
  }
  const jobs = await svc().list();
  const jobCount = jobs.length + 2001;
  const newJob = await svc().add(stampCreate(req, {
    id: `job-${Date.now()}`,
    jobNumber: `JOB-${jobCount}`,
    customerName: jobData.customerName,
    mobileNumber: jobData.mobileNumber || "",
    address: jobData.address || "",
    vehicleNumber: jobData.vehicleNumber,
    vehicleMake: jobData.vehicleMake || "",
    vehicleModel: jobData.vehicleModel || "",
    vehicleMileage: jobData.vehicleMileage || "",
    workRequired: jobData.workRequired || "",
    productsUsed: jobData.productsUsed || [],
    labourCharges: jobData.labourCharges || [],
    customCharges: jobData.customCharges || [],
    calculations: jobData.calculations || { productTotal: 0, labourTotal: 0, customTotal: 0, tax: 0, discount: 0, grandTotal: 0 },
    assignedTechnician: jobData.assignedTechnician || "Unassigned",
    workStatus: jobData.workStatus || "PENDING",
    dateCreated: new Date().toISOString(),
    dateUpdated: new Date().toISOString(),
  }));
  res.status(201).json(newJob);
});

export const update = asyncHandler(async (req, res) => {
  const updated = await svc().update(req.params.id, stampUpdate(req, req.body));
  if (!updated) return res.status(404).json({ error: "Job sheet not found in registers." });
  res.json(updated);
});

export const remove = asyncHandler(async (req, res) => {
  const success = await performDelete(
    req,
    () => svc().delete(req.params.id),
    (audit) => svc().delete(req.params.id, audit),
  );
  if (!success) return res.status(404).json({ error: "Job sheet not found." });
  res.json({ success: true });
});
