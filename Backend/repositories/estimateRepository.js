import { Estimate } from "../db/models.js";
import { activeQuery } from "./helpers.js";

export function createEstimateRepository() {
  return {
    async findAll(includeDeleted = false) {
      return Estimate.find(activeQuery(includeDeleted)).lean();
    },

    async findById(id) {
      return Estimate.findOne({ id }).lean();
    },

    async create(estimate) {
      await Estimate.create(estimate);
    },

    async update(id, updates) {
      return Estimate.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    },

    async updateAndReturn(id, updates) {
      return Estimate.findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: "after" },
      ).lean();
    },

    async softDelete(id, audit) {
      const result = await Estimate.updateOne({ id }, { $set: { isDeleted: true, ...audit } });
      return result.matchedCount > 0;
    },

    async hardDelete(id) {
      const result = await Estimate.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
