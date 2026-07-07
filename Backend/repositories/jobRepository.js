import { Job } from "../db/models.js";
import { activeQuery } from "./helpers.js";

export function createJobRepository() {
  return {
    async findAll(includeDeleted = false) {
      return Job.find(activeQuery(includeDeleted)).lean();
    },

    async findById(id) {
      return Job.findOne({ id }).lean();
    },

    async findByEstimateId(estimateId) {
      return Job.find({ estimateId, isDeleted: { $ne: true } }).lean();
    },

    async create(job) {
      await Job.create(job);
    },

    async update(id, set) {
      return Job.findOneAndUpdate({ id }, { $set: set }, { returnDocument: "after" }).lean();
    },

    async updateCustomerId(id, customerId) {
      await Job.updateOne({ id }, { $set: { customerId } });
    },

    async softDelete(id, audit) {
      const result = await Job.updateOne({ id }, { $set: { isDeleted: true, ...audit } });
      return result.matchedCount > 0;
    },

    async hardDelete(id) {
      const result = await Job.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
