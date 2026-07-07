import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const svc = () => getServices().technicians;

export const list = asyncHandler(async (req, res) => {
  res.json(await svc().list());
});

export const create = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Technician name is required." });
  }
  const added = await svc().add(String(name).trim());
  if (!added) return res.status(400).json({ error: "Technician name is required." });
  res.status(201).json({ success: true, name: added, technicians: await svc().list() });
});

export const remove = asyncHandler(async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const success = await svc().delete(name);
  if (!success) return res.status(404).json({ error: "Technician not found." });
  res.json({ success: true, technicians: await svc().list() });
});
