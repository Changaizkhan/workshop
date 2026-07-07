import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { includeDeletedFor, stampCreate, stampUpdate, performDelete } from "../middleware/audit.js";

const svc = () => getServices().expenses;

export const list = asyncHandler(async (req, res) => {
  res.json(await svc().list(includeDeletedFor(req)));
});

export const create = asyncHandler(async (req, res) => {
  const expenseData = req.body;
  if (!expenseData.expenseName || expenseData.amount === undefined || !expenseData.category) {
    return res.status(400).json({ error: "Expense description, category, and real cash valuation are required." });
  }
  const expense = await svc().add(stampCreate(req, expenseData));
  res.status(201).json(expense);
});

export const update = asyncHandler(async (req, res) => {
  const updated = await svc().update(req.params.id, stampUpdate(req, req.body));
  if (!updated) return res.status(404).json({ error: "Expense log not found." });
  res.json(updated);
});

export const remove = asyncHandler(async (req, res) => {
  const success = await performDelete(
    req,
    () => svc().delete(req.params.id),
    (audit) => svc().delete(req.params.id, audit),
  );
  if (!success) return res.status(404).json({ error: "Expense log not found." });
  res.json({ success: true });
});
