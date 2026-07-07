import { Technician } from "../db/models.js";

const DEFAULT_TECHNICIAN_NAMES = ["Waseem", "Awais", "Fizan", "Mohsin", "Shafeeq"];

export function createTechnicianRepository() {
  return {
    DEFAULT_NAMES: DEFAULT_TECHNICIAN_NAMES,

    async findAll() {
      const list = await Technician.find().sort({ name: 1 }).lean();
      return list.map((t) => t.name);
    },

    async findByName(name) {
      return Technician.findOne({ name }).lean();
    },

    async create(technician) {
      await Technician.create(technician);
    },

    async delete(name) {
      const result = await Technician.deleteOne({ name });
      return result.deletedCount > 0;
    },
  };
}
