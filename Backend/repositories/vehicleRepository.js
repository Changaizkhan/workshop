import { Vehicle } from "../db/models.js";

export function createVehicleRepository() {
  return {
    async findAll() {
      return Vehicle.find().lean();
    },

    async findByPlate(vehicleNumber) {
      return Vehicle.findOne({ vehicleNumber }).lean();
    },

    async create(vehicle) {
      await Vehicle.create(vehicle);
    },

    async deleteByCustomerId(customerId) {
      await Vehicle.deleteMany({ customerId });
    },
  };
}
