import { User } from "../db/models.js";
import { toPlain } from "./helpers.js";

export function createUserRepository() {
  return {
    async findAll() {
      return User.find().lean();
    },

    async findById(id) {
      return User.findOne({ id }).lean();
    },

    async create(user) {
      const created = await User.create(user);
      return toPlain(created);
    },

    async update(id, updates) {
      return User.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    },

    async delete(id) {
      const result = await User.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
