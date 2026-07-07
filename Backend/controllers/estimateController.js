import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { includeDeletedFor, stampCreate, stampUpdate, performDelete } from "../middleware/audit.js";

const estimates = () => getServices().estimates;
const customers = () => getServices().customers;

export const list = asyncHandler(async (req, res) => {
  res.json(await estimates().list(includeDeletedFor(req)));
});

export const create = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!body.customerName || !body.vehicleNumber || !body.vehicleMileage) {
    return res.status(400).json({ error: "Estimate requires customer info and vehicle identification mileage." });
  }
  const all = await estimates().list();
  const estCount = all.length + 1001;
  const estimate = await estimates().add(stampCreate(req, {
    id: `est-${Date.now()}`,
    estimateNumber: `EST-${estCount}`,
    customerId: body.customerId || "",
    customerName: body.customerName,
    mobileNumber: body.mobileNumber || "",
    address: body.address || "",
    customerCnic: body.customerCnic || "",
    customerEmail: body.customerEmail || "",
    vehicleNumber: body.vehicleNumber,
    vehicleMake: body.vehicleMake || "",
    vehicleModel: body.vehicleModel || "",
    vehicleMileage: body.vehicleMileage,
    chassisNumber: body.chassisNumber || "",
    colour: body.colour || "",
    engineNumber: body.engineNumber || "",
    workRequired: body.workRequired || "",
    productsUsed: body.productsUsed || [],
    labourCharges: body.labourCharges || [],
    customCharges: body.customCharges || [],
    calculations: body.calculations || { productTotal: 0, labourTotal: 0, customTotal: 0, tax: 0, discount: 0, grandTotal: 0 },
    status: "PENDING",
    dateCreated: new Date().toISOString(),
  }));
  const linked = await customers().linkEstimateToCustomer(estimate);
  res.status(201).json(linked);
});

export const update = asyncHandler(async (req, res) => {
  const updated = await estimates().update(req.params.id, stampUpdate(req, req.body));
  if (!updated) return res.status(404).json({ error: "Estimate sheet not found." });
  const syncedJobs = await estimates().syncJobsFromEstimate(req.params.id, req.body, {
    updatedBy: req.user.name,
    updatedById: req.user.id,
    updatedAt: new Date().toISOString(),
  });
  const linked = await customers().linkEstimateToCustomer(updated);
  res.json({ ...linked, syncedJobs });
});

export const remove = asyncHandler(async (req, res) => {
  const success = await performDelete(
    req,
    () => estimates().delete(req.params.id),
    (audit) => estimates().delete(req.params.id, audit),
  );
  if (!success) return res.status(404).json({ error: "Estimate not found." });
  res.json({ success: true });
});

export const convert = asyncHandler(async (req, res) => {
  const newJob = await estimates().convert(req.params.id, req.body.assignedTechnician, getServices().jobs);
  if (!newJob) return res.status(404).json({ error: "Estimate to convert not found in system registers." });
  res.status(201).json(newJob);
});
