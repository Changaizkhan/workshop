import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const setup = asyncHandler(async (req, res) => {
  const result = await getServices().auth.setup(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await getServices().auth.login(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const result = await getServices().auth.me(req.user.id, req.user);
  res.json(result);
});
