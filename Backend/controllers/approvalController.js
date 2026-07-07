import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const svc = () => getServices().approvals;

export const list = asyncHandler(async (req, res) => {
  res.json(await svc().list());
});

export const resolve = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
    return res.status(400).json({ error: 'Please choose "APPROVED" or "REJECTED".' });
  }
  const resolved = await svc().resolve(req.params.id, status, req.user.name);
  if (!resolved) return res.status(404).json({ error: "Approval request inactive or already resolved." });
  res.json({ success: true, request: resolved });
});
