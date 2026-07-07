import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const create = asyncHandler(async (req, res) => {
  const result = await getServices().users.create(req.body);
  res.status(201).json(result);
});

export const list = asyncHandler(async (req, res) => {
  const result = await getServices().users.list(req.query);
  res.json(result);
});

export const update = asyncHandler(async (req, res) => {
  const result = await getServices().users.update(req.params.id, req.body, req.user.id);
  res.json(result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await getServices().users.delete(req.params.id, req.user.id);
  res.json(result);
});
