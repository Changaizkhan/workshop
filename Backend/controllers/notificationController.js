import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const svc = () => getServices().notifications;

export const list = asyncHandler(async (req, res) => {
  res.json(await svc().list());
});

export const markRead = asyncHandler(async (req, res) => {
  const success = await svc().markRead(req.params.id);
  res.json({ success });
});

export const clear = asyncHandler(async (req, res) => {
  await svc().clearAll();
  res.json({ success: true });
});
