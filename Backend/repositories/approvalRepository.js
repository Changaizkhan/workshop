import { Approval } from "../db/models.js";

export function createApprovalRepository() {
  return {
    async findAll() {
      const list = await Approval.find().lean();
      return list.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    },

    async findPending(id) {
      return Approval.findOne({ id, status: "PENDING" }).lean();
    },

    async create(approval) {
      await Approval.create(approval);
    },

    async resolve(id, status, resolverName) {
      return Approval.findOneAndUpdate(
        { id },
        { $set: { status, approvedBy: resolverName, approvedAt: new Date().toISOString() } },
        { new: true },
      ).lean();
    },
  };
}
