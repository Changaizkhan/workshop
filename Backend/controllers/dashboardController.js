import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const stats = asyncHandler(async (req, res) => {
  res.json(await getServices().dashboard.getStats(req.query));
});

export const profitLoss = asyncHandler(async (req, res) => {
  res.json(await getServices().reports.profitLoss());
});

export const technician = asyncHandler(async (req, res) => {
  res.json(await getServices().reports.technicianPerformance());
});

export const health = (_req, res) => {
  res.json({ ok: true, service: "hpg-4.0-backend" });
};
