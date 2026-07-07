export function createJobService(repos, notifications, productService) {
  const { jobs } = repos;

  const jobCollectedAmount = (job) => {
    if (job?.workStatus !== "DELIVERED") return 0;
    const total = Number(job.calculations?.grandTotal || 0);
    if (job.paymentStatus === "PAID") return total;
    const paid = Number(job.amountPaid || 0);
    if (paid > 0) return paid;
    if (!job.paymentStatus && paid === 0 && !job.amountPending) return total;
    return 0;
  };

  return {
    jobCollectedAmount,

    list: (includeDeleted) => jobs.findAll(includeDeleted),

    async add(job) {
      const newJob = {
        ...job,
        id: job.id || `job-${Date.now()}`,
        dateCreated: job.dateCreated || new Date().toISOString(),
        dateUpdated: job.dateUpdated || new Date().toISOString(),
      };
      await jobs.create(newJob);
      if (newJob.workStatus === "COMPLETED" || newJob.workStatus === "DELIVERED") {
        await productService.deductStock(newJob.productsUsed);
      }
      await notifications.add({
        type: "JOB_COMPLETED",
        title: "New Job Active",
        message: `Job ${newJob.jobNumber} created for ${newJob.customerName} (${newJob.vehicleNumber}).`,
      });
      return newJob;
    },

    async update(id, updates) {
      const existing = await jobs.findById(id);
      if (!existing) return null;

      const prevStatus = existing.workStatus;
      const now = new Date().toISOString();
      const set = { ...updates, dateUpdated: now };

      if (updates.workStatus === "DELIVERED" && prevStatus !== "DELIVERED") {
        set.deliveredAt = now;
      }

      const prevPaid = Number(existing.amountPaid || 0);
      const nextPaid = updates.amountPaid !== undefined ? Number(updates.amountPaid) : prevPaid;
      if (nextPaid > prevPaid || (updates.paymentStatus && updates.paymentStatus !== existing.paymentStatus)) {
        set.lastPaymentAt = now;
      }

      const updated = await jobs.update(id, set);
      if (
        prevStatus !== "COMPLETED" &&
        prevStatus !== "DELIVERED" &&
        (updated.workStatus === "COMPLETED" || updated.workStatus === "DELIVERED")
      ) {
        await productService.deductStock(updated.productsUsed);
        await notifications.add({
          type: "JOB_COMPLETED",
          title: "Job Completed",
          message: `Job sheet ${updated.jobNumber} for ${updated.customerName} marked COMPLETED/DELIVERED.`,
        });
      }
      return updated;
    },

    delete: (id, audit = null) => (audit ? jobs.softDelete(id, audit) : jobs.hardDelete(id)),
  };
}
