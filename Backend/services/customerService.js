export function createCustomerService(repos) {
  const { customers, vehicles, estimates, jobs } = repos;

  const normalizeCustomer = (customer) => {
    if (!customer) return customer;
    let cars = Array.isArray(customer.cars) ? [...customer.cars] : [];
    if (!cars.length && customer.vehicleNumber) {
      cars = [{
        id: `car-legacy-${customer.id}`,
        vehicleNumber: customer.vehicleNumber,
        vehicleMake: customer.vehicleMake || "",
        vehicleModel: customer.vehicleModel || "",
        dateAdded: customer.createdAt || new Date().toISOString(),
      }];
    }
    return { ...customer, cars };
  };

  const matchCustomerRecord = (record, customerId, customerName, customerPhone) => {
    if (!record) return false;
    if (record.customerId === customerId) return true;
    const nameKey = customerName?.trim().toLowerCase();
    if (!nameKey) return false;
    if (record.customerName?.trim().toLowerCase() !== nameKey) return false;
    const estPhone = record.mobileNumber?.trim();
    const custPhone = customerPhone?.trim();
    if (estPhone && custPhone && estPhone !== custPhone) return false;
    return true;
  };

  return {
    normalizeCustomer,
    list: async (includeDeleted) => (await customers.findAll(includeDeleted)).map(normalizeCustomer),

    async add(customer) {
      const cars = customer.cars || [];
      if (!cars.length && customer.vehicleNumber) {
        cars.push({
          id: `car-${Date.now()}`,
          vehicleNumber: customer.vehicleNumber,
          vehicleMake: customer.vehicleMake || "",
          vehicleModel: customer.vehicleModel || "",
          dateAdded: new Date().toISOString(),
        });
      }
      const newCust = {
        ...customer,
        id: customer.id || `cust-${Date.now()}`,
        cars,
        vehicleNumber: cars[0]?.vehicleNumber || customer.vehicleNumber || "",
        vehicleMake: cars[0]?.vehicleMake || customer.vehicleMake || "",
        vehicleModel: cars[0]?.vehicleModel || customer.vehicleModel || "",
      };
      await customers.create(newCust);
      const first = cars[0];
      if (first?.vehicleNumber) {
        const exists = await vehicles.findByPlate(first.vehicleNumber);
        if (!exists) {
          await vehicles.create({
            id: `veh-${Date.now()}`,
            customerId: newCust.id,
            vehicleNumber: first.vehicleNumber,
            make: first.vehicleMake,
            model: first.vehicleModel,
            year: "Unknown",
          });
        }
      }
      return normalizeCustomer(newCust);
    },

    async update(id, updates) {
      const { cars, vehicleNumber, vehicleMake, vehicleModel, ...profile } = updates;
      const set = { ...profile };
      if (cars !== undefined) set.cars = cars;
      if (vehicleNumber !== undefined) set.vehicleNumber = vehicleNumber;
      if (vehicleMake !== undefined) set.vehicleMake = vehicleMake;
      if (vehicleModel !== undefined) set.vehicleModel = vehicleModel;
      const updated = await customers.update(id, set);
      if (!updated) return null;
      return normalizeCustomer(updated);
    },

    async addCar(customerId, carData) {
      const customer = await customers.findById(customerId);
      if (!customer) return null;
      const norm = normalizeCustomer(customer);
      const plate = String(carData.vehicleNumber || "").trim();
      if (!plate) return { error: "Vehicle plate number is required." };
      const exists = norm.cars.some(
        (c) => c.vehicleNumber?.trim().toUpperCase() === plate.toUpperCase(),
      );
      if (exists) return { error: "This vehicle is already registered for this customer." };

      const car = {
        id: carData.id || `car-${Date.now()}`,
        vehicleNumber: plate,
        vehicleMake: carData.vehicleMake || "",
        vehicleModel: carData.vehicleModel || "",
        chassisNumber: carData.chassisNumber || "",
        colour: carData.colour || "",
        engineNumber: carData.engineNumber || "",
        dateAdded: new Date().toISOString(),
      };
      const cars = [...norm.cars, car];
      const updated = await customers.update(customerId, {
        cars,
        vehicleNumber: norm.cars.length ? norm.vehicleNumber : car.vehicleNumber,
        vehicleMake: norm.cars.length ? norm.vehicleMake : car.vehicleMake,
        vehicleModel: norm.cars.length ? norm.vehicleModel : car.vehicleModel,
      });

      const vehExists = await vehicles.findByPlate(plate);
      if (!vehExists) {
        await vehicles.create({
          id: `veh-${Date.now()}`,
          customerId,
          vehicleNumber: plate,
          make: car.vehicleMake,
          model: car.vehicleModel,
          year: "Unknown",
        });
      }
      return { customer: normalizeCustomer(updated), car };
    },

    async syncRecords(customerId) {
      const customer = await customers.findById(customerId);
      if (!customer) return null;
      const norm = normalizeCustomer(customer);
      const name = norm.customerName?.trim();
      const phone = norm.mobileNumber?.trim();
      if (!name) return norm;

      const [allEstimates, allJobs] = await Promise.all([
        estimates.findAll(),
        jobs.findAll(),
      ]);

      for (const est of allEstimates) {
        if (matchCustomerRecord(est, customerId, name, phone)) {
          await this.linkEstimateToCustomer(est);
        }
      }
      for (const job of allJobs) {
        if (matchCustomerRecord(job, customerId, name, phone) && job.customerId !== customerId) {
          await jobs.updateCustomerId(job.id, customerId);
        }
      }
      const refreshed = await customers.findById(customerId);
      return normalizeCustomer(refreshed);
    },

    async getProfile(id) {
      await this.syncRecords(id);
      const customer = await customers.findById(id);
      if (!customer) return null;

      const norm = normalizeCustomer(customer);
      const name = norm.customerName?.trim();
      const phone = norm.mobileNumber?.trim();

      const [allEstimates, allJobs] = await Promise.all([
        estimates.findAll(),
        jobs.findAll(),
      ]);

      const jobList = allJobs.filter((job) => matchCustomerRecord(job, id, name, phone));
      const convertedEstimateIds = new Set(jobList.map((job) => job.estimateId).filter(Boolean));
      const estimateList = allEstimates.filter((est) => {
        if (!matchCustomerRecord(est, id, name, phone)) return false;
        if (est.status === "CONVERTED") return false;
        if (convertedEstimateIds.has(est.id)) return false;
        return true;
      });

      const bucketKey = (plate) => (plate || "unknown").trim().toUpperCase();
      const vehicleMap = {};

      const ensureBucket = (plate, meta = {}) => {
        const key = bucketKey(plate);
        if (!vehicleMap[key]) {
          vehicleMap[key] = {
            car: { vehicleNumber: plate || "—", vehicleMake: meta.vehicleMake || "", vehicleModel: meta.vehicleModel || "" },
            estimates: [],
            jobs: [],
            totalProfit: 0,
          };
        }
        return vehicleMap[key];
      };

      for (const car of norm.cars) {
        ensureBucket(car.vehicleNumber, car);
        vehicleMap[bucketKey(car.vehicleNumber)].car = car;
      }

      const jobGrandTotal = (job) => Number(job.calculations?.grandTotal || 0);
      const jobProfitAmount = (job) => {
        if (job.workStatus !== "DELIVERED") return 0;
        if (job.paymentStatus === "PAID") return jobGrandTotal(job);
        return Number(job.amountPaid || 0);
      };
      const jobPaymentInfo = (job) => {
        const total = jobGrandTotal(job);
        const paid = Number(job.amountPaid || 0);
        const pending = job.workStatus === "DELIVERED"
          ? Number(job.amountPending ?? Math.max(0, total - paid))
          : 0;
        return {
          paymentStatus: job.paymentStatus || (job.workStatus === "DELIVERED" ? "PENDING" : "NONE"),
          amountPaid: paid,
          amountPending: pending,
        };
      };

      for (const est of estimateList) {
        ensureBucket(est.vehicleNumber, est).estimates.push({
          id: est.id,
          docNumber: est.estimateNumber,
          type: "ESTIMATE",
          date: est.dateCreated,
          workRequired: est.workRequired || "",
          grandTotal: Number(est.calculations?.grandTotal || 0),
          profitAmount: 0,
          countsTowardProfit: false,
          status: est.status,
        });
      }

      let totalPaid = 0;
      let totalPending = 0;

      for (const job of jobList) {
        const profitAmount = jobProfitAmount(job);
        const payment = jobPaymentInfo(job);
        if (job.workStatus === "DELIVERED") {
          totalPaid += payment.amountPaid;
          totalPending += payment.amountPending;
        }
        const b = ensureBucket(job.vehicleNumber, job);
        b.jobs.push({
          id: job.id,
          docNumber: job.jobNumber,
          type: "JOB",
          date: job.dateCreated,
          workRequired: job.workRequired || "",
          grandTotal: jobGrandTotal(job),
          profitAmount,
          countsTowardProfit: profitAmount > 0,
          status: job.workStatus,
          paymentStatus: payment.paymentStatus,
          amountPaid: payment.amountPaid,
          amountPending: payment.amountPending,
        });
        b.totalProfit += profitAmount;
      }

      const vehicleList = Object.values(vehicleMap).sort((a, b) => b.totalProfit - a.totalProfit);
      const totalProfit = vehicleList.reduce((s, v) => s + v.totalProfit, 0);

      return {
        ...norm,
        vehicles: vehicleList,
        totalProfit,
        totalPaid,
        totalPending,
        visitCount: estimateList.length + jobList.length,
      };
    },

    async linkEstimateToCustomer(estimate) {
      if (!estimate?.customerName) return estimate;
      let customer = null;
      if (estimate.customerId) {
        customer = await customers.findById(estimate.customerId);
      }
      if (!customer) {
        const nameKey = estimate.customerName.trim().toLowerCase();
        const list = await customers.findAll();
        const matches = list.filter((c) => c.customerName?.trim().toLowerCase() === nameKey);
        if (estimate.mobileNumber) {
          const phone = estimate.mobileNumber.trim();
          customer = matches.find((c) => c.mobileNumber?.trim() === phone) || matches[0];
        } else {
          customer = matches[0];
        }
      }
      if (!customer) return estimate;

      const norm = normalizeCustomer(customer);
      const plate = String(estimate.vehicleNumber || "").trim();
      let cars = [...norm.cars];
      if (plate) {
        const idx = cars.findIndex((c) => c.vehicleNumber?.trim().toUpperCase() === plate.toUpperCase());
        if (idx < 0) {
          cars.push({
            id: `car-${Date.now()}`,
            vehicleNumber: plate,
            vehicleMake: estimate.vehicleMake || "",
            vehicleModel: estimate.vehicleModel || "",
            chassisNumber: estimate.chassisNumber || "",
            colour: estimate.colour || "",
            engineNumber: estimate.engineNumber || "",
            dateAdded: new Date().toISOString(),
          });
        } else {
          cars[idx] = {
            ...cars[idx],
            vehicleMake: estimate.vehicleMake || cars[idx].vehicleMake,
            vehicleModel: estimate.vehicleModel || cars[idx].vehicleModel,
            chassisNumber: estimate.chassisNumber || cars[idx].chassisNumber,
            colour: estimate.colour || cars[idx].colour,
            engineNumber: estimate.engineNumber || cars[idx].engineNumber,
          };
        }
      }

      await customers.update(customer.id, { cars });
      if (estimate.id) {
        const linked = await estimates.updateAndReturn(estimate.id, { customerId: customer.id });
        return linked || { ...estimate, customerId: customer.id };
      }
      return { ...estimate, customerId: customer.id };
    },

    async delete(id, audit = null) {
      if (audit) return customers.softDelete(id, audit);
      const ok = await customers.hardDelete(id);
      if (ok) await vehicles.deleteByCustomerId(id);
      return ok;
    },
  };
}
