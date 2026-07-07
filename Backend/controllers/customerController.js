import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { includeDeletedFor, stampCreate, stampUpdate, performDelete } from "../middleware/audit.js";

const svc = () => getServices().customers;

export const list = asyncHandler(async (req, res) => {
  res.json(await svc().list(includeDeletedFor(req)));
});

export const create = asyncHandler(async (req, res) => {
  const { customerName, mobileNumber, address, vehicleNumber, vehicleMake, vehicleModel, cars } = req.body;
  if (!customerName || !mobileNumber) {
    return res.status(400).json({ error: "Customer name and phone number are required." });
  }
  const customer = await svc().add(stampCreate(req, {
    id: `cust-${Date.now()}`,
    customerName,
    mobileNumber,
    address: address || "",
    vehicleNumber: vehicleNumber || "",
    vehicleMake: vehicleMake || "",
    vehicleModel: vehicleModel || "",
    cars: cars || [],
  }));
  res.status(201).json(customer);
});

export const profile = asyncHandler(async (req, res) => {
  const profileData = await svc().getProfile(req.params.id);
  if (!profileData) return res.status(404).json({ error: "Customer not found." });
  res.json(profileData);
});

export const addCar = asyncHandler(async (req, res) => {
  const result = await svc().addCar(req.params.id, req.body);
  if (!result) return res.status(404).json({ error: "Customer not found." });
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

export const update = asyncHandler(async (req, res) => {
  const updated = await svc().update(req.params.id, stampUpdate(req, req.body));
  if (!updated) return res.status(404).json({ error: "Customer not found." });
  res.json(updated);
});

export const remove = asyncHandler(async (req, res) => {
  const success = await performDelete(
    req,
    () => svc().delete(req.params.id),
    (audit) => svc().delete(req.params.id, audit),
  );
  if (!success) return res.status(404).json({ error: "Customer card not found." });
  res.json({ success: true });
});
