import { Customer } from "../db/models.js";
import { activeQuery } from "./helpers.js";

export function createCustomerRepository() {
  return {
    async findAll(includeDeleted = false) {
      return Customer.find(activeQuery(includeDeleted)).lean();
    },

    async findById(id, includeDeleted = false) {
      const query = { id };
      if (!includeDeleted) query.isDeleted = { $ne: true };
      return Customer.findOne(query).lean();
    },

    async create(customer) {
      await Customer.create(customer);
    },

    async update(id, set) {
      return Customer.findOneAndUpdate({ id }, { $set: set }, { new: true }).lean();
    },

    async softDelete(id, audit) {
      const result = await Customer.updateOne({ id }, { $set: { isDeleted: true, ...audit } });
      return result.matchedCount > 0;
    },

    async hardDelete(id) {
      const result = await Customer.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
