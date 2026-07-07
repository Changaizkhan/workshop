import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { includeDeletedFor, stampCreate, stampUpdate, performDelete } from "../middleware/audit.js";

const svc = () => getServices().products;

export const list = asyncHandler(async (req, res) => {
  res.json(await svc().list(includeDeletedFor(req)));
});

export const create = asyncHandler(async (req, res) => {
  const productData = req.body;
  if (!productData.productName || !productData.productCategory || productData.costPrice === undefined || productData.sellingPrice === undefined) {
    return res.status(400).json({ error: "Please enter all required product specifications." });
  }
  const product = await svc().add(stampCreate(req, productData));
  res.status(201).json({ success: true, product });
});

export const update = asyncHandler(async (req, res) => {
  const products = await svc().list(true);
  const existing = products.find((p) => p.id === req.params.id && !p.isDeleted);
  if (!existing) return res.status(404).json({ error: "Product not found." });
  const product = await svc().update(req.params.id, stampUpdate(req, req.body));
  res.json({ success: true, product });
});

export const remove = asyncHandler(async (req, res) => {
  const success = await performDelete(
    req,
    () => svc().delete(req.params.id),
    (audit) => svc().delete(req.params.id, audit),
  );
  if (!success) return res.status(404).json({ error: "Product not found." });
  res.json({
    success: true,
    message: req.user.role === "ADMIN" ? "Product permanently deleted." : "Product removed (admin can see who deleted it).",
  });
});
