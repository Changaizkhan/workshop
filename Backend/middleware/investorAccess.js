import { getServices } from "../db/db.js";

export const canAccessInvestor = async (req, investorId) => {
  if (req.user?.role === "ADMIN") return true;
  const ids = await getServices().users.getAssignedInvestorIds(req.user?.id);
  return ids.includes(investorId);
};

export const filterInvestorsForUser = async (req, list) => {
  if (req.user?.role === "ADMIN") return list;
  const ids = await getServices().users.getAssignedInvestorIds(req.user?.id);
  if (ids.length === 0) return [];
  return list.filter((inv) => ids.includes(inv.id));
};
