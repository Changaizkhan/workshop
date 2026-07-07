export const toPlain = (doc) => (doc?.toObject ? doc.toObject() : doc);

export const activeQuery = (includeDeleted) =>
  includeDeleted ? {} : { isDeleted: { $ne: true } };

export const filterActive = (items) => items.filter((item) => !item.isDeleted);
