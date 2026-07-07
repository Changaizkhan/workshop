export function createEstimateService(repos, customerService) {
  const { estimates, jobs, customers } = repos;

  return {
    list: (includeDeleted) => estimates.findAll(includeDeleted),

    async add(estimate) {
      const newEst = {
        ...estimate,
        id: estimate.id || `est-${Date.now()}`,
        dateCreated: estimate.dateCreated || new Date().toISOString(),
      };
      await estimates.create(newEst);
      return newEst;
    },

    async update(id, updates) {
      return estimates.update(id, updates);
    },

    async syncJobsFromEstimate(estimateId, estimateUpdates, audit = {}) {
      const invoiceFields = [
        "customerName", "mobileNumber", "address", "customerCnic", "customerEmail",
        "vehicleNumber", "vehicleMake", "vehicleModel", "vehicleMileage",
        "chassisNumber", "colour", "engineNumber", "workRequired",
        "productsUsed", "labourCharges", "customCharges", "calculations",
      ];
      const syncFields = {};
      for (const key of invoiceFields) {
        if (estimateUpdates[key] !== undefined) syncFields[key] = estimateUpdates[key];
      }
      if (!Object.keys(syncFields).length) return [];

      const { customerName, vehicleNumber } = syncFields;
      if (customerName && vehicleNumber) {
        const all = await customers.findAll();
        const customer = all.find(
          (c) => c.customerName === customerName && c.vehicleNumber === vehicleNumber,
        );
        if (customer) {
          if (!syncFields.mobileNumber) syncFields.mobileNumber = customer.mobileNumber;
          if (!syncFields.address) syncFields.address = customer.address;
          if (!syncFields.vehicleMake) syncFields.vehicleMake = customer.vehicleMake;
          if (!syncFields.vehicleModel) syncFields.vehicleModel = customer.vehicleModel;
        }
      }

      const linkedJobs = await jobs.findByEstimateId(estimateId);
      const syncedJobs = [];
      for (const job of linkedJobs) {
        const updated = await jobs.update(job.id, {
          ...syncFields,
          ...audit,
          dateUpdated: new Date().toISOString(),
        });
        if (updated) syncedJobs.push(updated);
      }
      return syncedJobs;
    },

    delete: (id, audit = null) => (audit ? estimates.softDelete(id, audit) : estimates.hardDelete(id)),

    async convert(id, assignedTechnician, jobService) {
      const all = await estimates.findAll();
      const estimate = all.find((e) => e.id === id);
      if (!estimate) return null;

      await estimates.update(id, { status: "CONVERTED" });

      const customerList = await customers.findAll();
      let customer = estimate.customerId
        ? customerList.find((c) => c.id === estimate.customerId)
        : null;
      if (!customer && estimate.customerName) {
        const nameKey = estimate.customerName.trim().toLowerCase();
        const matches = customerList.filter((c) => c.customerName?.trim().toLowerCase() === nameKey);
        customer = matches.find((c) => c.mobileNumber?.trim() === estimate.mobileNumber?.trim()) || matches[0];
      }

      const allJobs = await jobs.findAll();
      const jobCount = allJobs.length + 2001;

      return jobService.add({
        id: `job-${Date.now()}`,
        jobNumber: `JOB-${jobCount}`,
        estimateId: estimate.id,
        customerId: estimate.customerId || customer?.id || "",
        customerName: estimate.customerName,
        mobileNumber: estimate.mobileNumber || customer?.mobileNumber || "",
        address: estimate.address || customer?.address || "",
        customerCnic: estimate.customerCnic || "",
        customerEmail: estimate.customerEmail || "",
        vehicleNumber: estimate.vehicleNumber,
        vehicleMake: estimate.vehicleMake || customer?.vehicleMake || "",
        vehicleModel: estimate.vehicleModel || customer?.vehicleModel || "",
        vehicleMileage: estimate.vehicleMileage,
        chassisNumber: estimate.chassisNumber || "",
        colour: estimate.colour || "",
        engineNumber: estimate.engineNumber || "",
        workRequired: estimate.workRequired,
        productsUsed: estimate.productsUsed,
        labourCharges: estimate.labourCharges,
        customCharges: estimate.customCharges,
        calculations: estimate.calculations,
        assignedTechnician: assignedTechnician || "Unassigned",
        workStatus: "PENDING",
        dateCreated: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
      });
    },
  };
}
