export function useGarageHandlers(mutations) {
  return {
    handleAddProduct: (p) => mutations.addProduct.mutateAsync(p),
    handleEditProduct: (id, updates) => mutations.editProduct.mutateAsync({ id, updates }),
    handleDeleteProduct: (id) => mutations.deleteProduct.mutateAsync(id),
    handleAddCustomer: (cust) => mutations.addCustomer.mutateAsync(cust),
    handleEditCustomer: (id, updates) => mutations.editCustomer.mutateAsync({ id, updates }),
    handleDeleteCustomer: (id) => mutations.deleteCustomer.mutateAsync(id),
    handleAddCustomerCar: (customerId, data) =>
      mutations.addCustomerCar.mutateAsync({ customerId, data }),
    handleCreateEstimate: (est) => mutations.createEstimate.mutateAsync(est),
    handleUpdateEstimate: (id, updates) => mutations.updateEstimate.mutateAsync({ id, updates }),
    handleDeleteEstimate: (id) => mutations.deleteEstimate.mutateAsync(id),
    handleConvertToJob: (id, technicianName) => mutations.convertToJob.mutateAsync({ id, technicianName }),
    handleUpdateJobStatus: (id, updates) => mutations.updateJobStatus.mutateAsync({ id, updates }),
    handleDeleteJob: (id) => mutations.deleteJob.mutateAsync(id),
    handleAddExpense: (exp) => mutations.addExpense.mutateAsync(exp),
    handleUpdateExpense: (id, updates) => mutations.updateExpense.mutateAsync({ id, updates }),
    handleDeleteExpense: (id) => mutations.deleteExpense.mutateAsync(id),
    handleAddInvestor: (data) => mutations.addInvestor.mutateAsync(data),
    handleUpdateInvestor: (id, updates) => mutations.updateInvestor.mutateAsync({ id, updates }),
    handleDeleteInvestor: (id) => mutations.deleteInvestor.mutateAsync(id),
    handleAddInvestorCar: (investorId, data) => mutations.addInvestorCar.mutateAsync({ investorId, data }),
    handleUpdateInvestorCar: (investorId, carId, updates) =>
      mutations.updateInvestorCar.mutateAsync({ investorId, carId, updates }),
    handleDeleteInvestorCar: (investorId, carId) =>
      mutations.deleteInvestorCar.mutateAsync({ investorId, carId }),
    handleSellInvestorCar: (investorId, carId, data) =>
      mutations.sellInvestorCar.mutateAsync({ investorId, carId, data }),
    handleDeleteSoldItem: (investorId, saleId) =>
      mutations.deleteSoldItem.mutateAsync({ investorId, saleId }),
    handleResolveApproval: (id, status, notes) =>
      mutations.resolveApproval.mutateAsync({ id, status, notes }),
    handleMarkNotificationRead: (id) => mutations.markNotificationRead.mutateAsync(id),
    handleClearNotifications: () => mutations.clearNotifications.mutateAsync(),
    handleAddTechnician: (name) => mutations.addTechnician.mutateAsync(name),
    handleDeleteTechnician: (name) => mutations.deleteTechnician.mutateAsync(name),
  };
}
