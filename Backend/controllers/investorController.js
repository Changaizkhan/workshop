import { getServices } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { includeDeletedFor, stampCreate, stampUpdate, performDelete } from "../middleware/audit.js";
import { canAccessInvestor, filterInvestorsForUser } from "../middleware/investorAccess.js";

const svc = () => getServices().investors;

export const list = asyncHandler(async (req, res) => {
  const listData = await svc().list(includeDeletedFor(req));
  res.json(await filterInvestorsForUser(req, listData));
});

export const create = asyncHandler(async (req, res) => {
  const { investorName, mobileNumber, notes } = req.body;
  if (!investorName || !mobileNumber) {
    return res.status(400).json({ error: "Investor name and phone number are required." });
  }
  const investor = await svc().add(stampCreate(req, { investorName, mobileNumber, notes: notes || "", cars: [] }));
  res.status(201).json(investor);
});

export const update = asyncHandler(async (req, res) => {
  const { investorName, mobileNumber, notes } = req.body;
  const updates = stampUpdate(req, {});
  if (investorName !== undefined) updates.investorName = investorName;
  if (mobileNumber !== undefined) updates.mobileNumber = mobileNumber;
  if (notes !== undefined) updates.notes = notes;
  const updated = await svc().update(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: "Investor record not found." });
  res.json(updated);
});

export const addCar = asyncHandler(async (req, res) => {
  if (!(await canAccessInvestor(req, req.params.id))) {
    return res.status(403).json({ error: "You are not assigned to this investor." });
  }
  const { carName, partNumber, buyPrice, sellPrice, quantity, notes } = req.body;
  if (!carName || !partNumber || buyPrice === undefined || sellPrice === undefined) {
    return res.status(400).json({ error: "Car name, part number, buy price, and sell price are required." });
  }
  const result = await svc().addCar(req.params.id, stampCreate(req, {
    carName, partNumber, buyPrice: Number(buyPrice), sellPrice: Number(sellPrice),
    quantity: Number(quantity || 1), notes: notes || "",
  }));
  if (!result) return res.status(404).json({ error: "Investor not found." });
  res.status(201).json(result);
});

export const updateCar = asyncHandler(async (req, res) => {
  if (!(await canAccessInvestor(req, req.params.id))) {
    return res.status(403).json({ error: "You are not assigned to this investor." });
  }
  const { carName, partNumber, buyPrice, sellPrice, quantity, notes } = req.body;
  const updates = stampUpdate(req, {});
  if (carName !== undefined) updates.carName = carName;
  if (partNumber !== undefined) updates.partNumber = partNumber;
  if (buyPrice !== undefined) updates.buyPrice = Number(buyPrice);
  if (sellPrice !== undefined) updates.sellPrice = Number(sellPrice);
  if (quantity !== undefined) updates.quantity = Number(quantity);
  if (notes !== undefined) updates.notes = notes;
  const result = await svc().updateCar(req.params.id, req.params.carId, updates);
  if (!result) return res.status(404).json({ error: "Investor or car part not found." });
  res.json(result);
});

export const deleteCar = asyncHandler(async (req, res) => {
  if (!(await canAccessInvestor(req, req.params.id))) {
    return res.status(403).json({ error: "You are not assigned to this investor." });
  }
  const success = await svc().deleteCar(req.params.id, req.params.carId);
  if (!success) return res.status(404).json({ error: "Investor or car part not found." });
  res.json({ success: true });
});

export const sellCar = asyncHandler(async (req, res) => {
  if (!(await canAccessInvestor(req, req.params.id))) {
    return res.status(403).json({ error: "You are not assigned to this investor." });
  }
  const result = await svc().sellCar(req.params.id, req.params.carId, req.body, stampCreate(req, {}));
  if (!result) return res.status(404).json({ error: "Investor or car part not found." });
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

export const deleteSoldItem = asyncHandler(async (req, res) => {
  if (!(await canAccessInvestor(req, req.params.id))) {
    return res.status(403).json({ error: "You are not assigned to this investor." });
  }
  const investor = await svc().deleteSoldItem(req.params.id, req.params.saleId);
  if (!investor) return res.status(404).json({ error: "Investor or sold item not found." });
  res.json({ investor });
});

export const remove = asyncHandler(async (req, res) => {
  const success = await performDelete(
    req,
    () => svc().delete(req.params.id),
    (audit) => svc().delete(req.params.id, audit),
  );
  if (!success) return res.status(404).json({ error: "Investor record not found." });
  res.json({ success: true });
});
