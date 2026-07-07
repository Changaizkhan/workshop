export function createInvestorService(repos) {
  const { investors } = repos;

  const withDefaults = (inv) => ({
    ...inv,
    cars: inv.cars || [],
    soldItems: inv.soldItems || [],
  });

  return {
    list: async (includeDeleted) => (await investors.findAll(includeDeleted)).map(withDefaults),

    async add(investor) {
      const newInv = {
        ...investor,
        id: investor.id || `inv-${Date.now()}`,
        cars: investor.cars || [],
      };
      await investors.create(newInv);
      return newInv;
    },

    async update(id, updates) {
      const { cars, ...rest } = updates;
      const set = { ...rest };
      if (cars !== undefined) set.cars = cars;
      return investors.update(id, set);
    },

    async addCar(investorId, carData) {
      const investor = await investors.findById(investorId);
      if (!investor) return null;
      const car = {
        id: carData.id || `icar-${Date.now()}`,
        carName: carData.carName || "",
        partNumber: carData.partNumber || "",
        buyPrice: Number(carData.buyPrice || 0),
        sellPrice: Number(carData.sellPrice || 0),
        quantity: Number(carData.quantity || 1),
        notes: carData.notes || "",
        ...carData,
      };
      const cars = [...(investor.cars || []), car];
      const updated = await investors.update(investorId, { cars });
      return { investor: updated, car };
    },

    async updateCar(investorId, carId, updates) {
      const investor = await investors.findById(investorId, true);
      if (!investor) return null;
      const cars = investor.cars || [];
      const cIdx = cars.findIndex((c) => c.id === carId);
      if (cIdx === -1) return null;
      cars[cIdx] = { ...cars[cIdx], ...updates };
      const updated = await investors.update(investorId, { cars });
      return { investor: updated, car: cars[cIdx] };
    },

    async deleteCar(investorId, carId) {
      const investor = await investors.findById(investorId, true);
      if (!investor) return false;
      const cars = investor.cars || [];
      const next = cars.filter((c) => c.id !== carId);
      if (next.length === cars.length) return false;
      await investors.update(investorId, { cars: next });
      return true;
    },

    async sellCar(investorId, carId, saleData, audit = {}) {
      const investor = await investors.findById(investorId);
      if (!investor) return null;

      const cars = [...(investor.cars || [])];
      const cIdx = cars.findIndex((c) => c.id === carId);
      if (cIdx === -1) return null;

      const car = cars[cIdx];
      const qty = Number(saleData.quantity || 1);
      const available = Number(car.quantity || 1);
      const unitPrice = Number(saleData.sellPrice ?? car.sellPrice ?? 0);

      if (qty <= 0) return { error: "Sell quantity must be at least 1." };
      if (qty > available) return { error: `Only ${available} unit(s) available to sell.` };
      if (unitPrice < 0) return { error: "Sell price cannot be negative." };

      cars[cIdx] = { ...car, quantity: available - qty };
      const sale = {
        id: `isale-${Date.now()}`,
        carId,
        carName: car.carName,
        partNumber: car.partNumber,
        quantity: qty,
        unitPrice,
        totalPrice: qty * unitPrice,
        buyPrice: Number(car.buyPrice || 0),
        soldAt: new Date().toISOString(),
        ...audit,
      };

      const soldItems = [...(investor.soldItems || []), sale];
      const updated = await investors.update(investorId, { cars, soldItems });
      return { investor: withDefaults(updated), sale };
    },

    async deleteSoldItem(investorId, saleId) {
      const investor = await investors.findById(investorId);
      if (!investor) return null;

      const soldItems = investor.soldItems || [];
      const sale = soldItems.find((s) => s.id === saleId);
      if (!sale) return null;

      const nextSold = soldItems.filter((s) => s.id !== saleId);
      const cars = [...(investor.cars || [])];
      const cIdx = cars.findIndex((c) => c.id === sale.carId);
      if (cIdx >= 0) {
        cars[cIdx] = {
          ...cars[cIdx],
          quantity: Number(cars[cIdx].quantity || 0) + Number(sale.quantity || 0),
        };
      }

      const updated = await investors.update(investorId, { cars, soldItems: nextSold });
      return withDefaults(updated);
    },

    delete: (id, audit = null) => (audit ? investors.softDelete(id, audit) : investors.hardDelete(id)),
  };
}
