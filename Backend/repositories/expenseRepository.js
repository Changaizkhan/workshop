import { Expense } from "../db/models.js";
import { activeQuery } from "./helpers.js";

export function createExpenseRepository() {
  return {
    async findAll(includeDeleted = false) {
      return Expense.find(activeQuery(includeDeleted)).lean();
    },

    async create(expense) {
      const doc = await Expense.create(expense);
      return doc.toObject();
    },

    async update(id, set) {
      return Expense.findOneAndUpdate({ id }, { $set: set }, { new: true }).lean();
    },

    async softDelete(id, audit) {
      const result = await Expense.updateOne({ id }, { $set: { isDeleted: true, ...audit } });
      return result.matchedCount > 0;
    },

    async hardDelete(id) {
      const result = await Expense.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
