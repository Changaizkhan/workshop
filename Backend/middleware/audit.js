export const includeDeletedFor = (req) => req.user?.role === "ADMIN";

export const stampCreate = (req, data) => ({
  ...data,
  createdBy: req.user.name,
  createdById: req.user.id,
  createdAt: new Date().toISOString(),
  updatedBy: req.user.name,
  updatedById: req.user.id,
  updatedAt: new Date().toISOString(),
});

export const stampUpdate = (req, updates) => ({
  ...updates,
  updatedBy: req.user.name,
  updatedById: req.user.id,
  updatedAt: new Date().toISOString(),
});

export const stampDelete = (req) => ({
  deletedBy: req.user.name,
  deletedById: req.user.id,
  deletedAt: new Date().toISOString(),
});

export const performDelete = async (req, hardDeleteFn, softDeleteFn) => {
  if (req.user.role === "ADMIN") {
    return hardDeleteFn();
  }
  return softDeleteFn(stampDelete(req));
};
