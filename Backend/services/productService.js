export function createProductService(repos, notifications) {
  const { products } = repos;

  const checkStockAlert = async (product) => {
    if (product.quantity <= product.lowStockAlert) {
      const dup = await repos.notifications.findUnreadDuplicate("LOW_STOCK", product.productName);
      if (!dup) {
        await notifications.add({
          type: "LOW_STOCK",
          title: "Low Stock Alert",
          message: `Product "${product.productName}" is at low stock (${product.quantity} remaining). Threshold is ${product.lowStockAlert}.`,
        });
      }
    }
  };

  return {
    list: (includeDeleted) => products.findAll(includeDeleted),

    async add(product) {
      const newProd = {
        ...product,
        id: product.id || `prod-${Date.now()}`,
        dateAdded: product.dateAdded || new Date().toISOString(),
      };
      await products.create(newProd);
      await checkStockAlert(newProd);
      return newProd;
    },

    async update(id, updates) {
      const updated = await products.update(id, updates);
      if (updated) await checkStockAlert(updated);
      return updated;
    },

    async delete(id, audit = null) {
      if (audit) return products.softDelete(id, audit);
      return products.hardDelete(id);
    },

    async deductStock(items) {
      if (!items) return;
      for (const item of items) {
        if (!item.productId) continue;
        const product = await products.findById(item.productId);
        if (product) {
          const newQty = Math.max(0, product.quantity - Number(item.quantity));
          const updated = await products.update(item.productId, { quantity: newQty });
          if (updated) await checkStockAlert(updated);
        }
      }
    },
  };
}
