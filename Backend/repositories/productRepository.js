import { Product } from "../db/models.js";
import { activeQuery } from "./helpers.js";

export function createProductRepository() {
  return {
    async findAll(includeDeleted = false) {
      return Product.find(activeQuery(includeDeleted)).lean();
    },

    async findById(id) {
      return Product.findOne({ id }).lean();
    },

    async create(product) {
      await Product.create(product);
    },

    async update(id, updates) {
      return Product.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    },

    async softDelete(id, audit) {
      const result = await Product.updateOne({ id }, { $set: { isDeleted: true, ...audit } });
      return result.matchedCount > 0;
    },

    async hardDelete(id) {
      const result = await Product.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
