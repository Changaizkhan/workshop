export function createApprovalService(repos, notifications, productService, expenseService) {
  const { approvals } = repos;

  const executeApprovedAction = async (req) => {
    switch (req.type) {
      case "ADD_PRODUCT":
        if (req.details.productData) await productService.add(req.details.productData);
        break;
      case "EDIT_PRODUCT":
        if (req.details.productId && req.details.productData) {
          await productService.update(req.details.productId, req.details.productData);
        }
        break;
      case "EDIT_QUANTITY":
        if (req.details.inventoryChange) {
          const { productId, newQuantity } = req.details.inventoryChange;
          await productService.update(productId, { quantity: newQuantity });
        }
        break;
      case "CREATE_EXPENSE":
        if (req.details.expenseData) await expenseService.add(req.details.expenseData);
        break;
      default:
        break;
    }
  };

  return {
    list: () => approvals.findAll(),

    async resolve(id, status, resolverName) {
      const appr = await approvals.findPending(id);
      if (!appr) return null;
      const updated = await approvals.resolve(id, status, resolverName);
      if (status === "APPROVED") await executeApprovedAction(updated);
      return updated;
    },
  };
}
