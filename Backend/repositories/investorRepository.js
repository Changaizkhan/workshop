import { Investor } from "../db/models.js";
import { activeQuery } from "./helpers.js";

export function createInvestorRepository() {
  return {
    async findAll(includeDeleted = false) {
      return Investor.find(activeQuery(includeDeleted)).lean();
    },

    async findById(id, includeDeleted = false) {
      const query = { id };
      if (!includeDeleted) query.isDeleted = { $ne: true };
      return Investor.findOne(query).lean();
    },

    async create(investor) {
      await Investor.create(investor);
    },

    async update(id, set) {
      return Investor.findOneAndUpdate({ id }, { $set: set }, { new: true }).lean();
    },

    async softDelete(id, audit) {
      const result = await Investor.updateOne({ id }, { $set: { isDeleted: true, ...audit } });
      return result.matchedCount > 0;
    },

    async hardDelete(id) {
      const result = await Investor.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
