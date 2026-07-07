import mongoose from "mongoose";

const { Schema } = mongoose;

const opts = { timestamps: false, versionKey: false };

export const User = mongoose.model(
  "User",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      username: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      password: { type: String, required: true },
      permissions: { type: [String], default: [] },
      assignedInvestorIds: { type: [String], default: [] },
    },
    opts,
  ),
);

export const Customer = mongoose.model(
  "Customer",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      customerName: String,
      mobileNumber: String,
      address: String,
      vehicleNumber: String,
      vehicleMake: String,
      vehicleModel: String,
      cars: { type: Array, default: [] },
      isDeleted: Boolean,
      createdBy: String,
      createdById: String,
      createdAt: String,
      updatedBy: String,
      updatedById: String,
      updatedAt: String,
      deletedBy: String,
      deletedById: String,
      deletedAt: String,
    },
    opts,
  ),
);

export const Vehicle = mongoose.model(
  "Vehicle",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      customerId: String,
      vehicleNumber: String,
      make: String,
      model: String,
      year: String,
    },
    opts,
  ),
);

export const Product = mongoose.model(
  "Product",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      productName: String,
      productCategory: String,
      brand: String,
      supplierName: String,
      supplierPhone: String,
      costPrice: Number,
      sellingPrice: Number,
      quantity: Number,
      lowStockAlert: Number,
      dateAdded: String,
      notes: String,
      isDeleted: Boolean,
      createdBy: String,
      createdById: String,
      createdAt: String,
      updatedBy: String,
      updatedById: String,
      updatedAt: String,
      deletedBy: String,
      deletedById: String,
      deletedAt: String,
    },
    opts,
  ),
);

export const Estimate = mongoose.model(
  "Estimate",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      estimateNumber: String,
      customerId: String,
      customerName: String,
      mobileNumber: String,
      address: String,
      customerCnic: String,
      customerEmail: String,
      vehicleNumber: String,
      vehicleMake: String,
      vehicleModel: String,
      vehicleMileage: String,
      chassisNumber: String,
      colour: String,
      engineNumber: String,
      workRequired: String,
      productsUsed: { type: Array, default: [] },
      labourCharges: { type: Array, default: [] },
      customCharges: { type: Array, default: [] },
      calculations: { type: Object, default: {} },
      status: String,
      dateCreated: String,
      createdBy: String,
      createdById: String,
      createdAt: String,
      updatedBy: String,
      updatedById: String,
      updatedAt: String,
      isDeleted: Boolean,
      deletedBy: String,
      deletedById: String,
      deletedAt: String,
    },
    opts,
  ),
);

export const Job = mongoose.model(
  "Job",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      jobNumber: String,
      estimateId: String,
      customerId: String,
      customerName: String,
      mobileNumber: String,
      address: String,
      customerCnic: String,
      customerEmail: String,
      vehicleNumber: String,
      vehicleMake: String,
      vehicleModel: String,
      vehicleMileage: String,
      chassisNumber: String,
      colour: String,
      engineNumber: String,
      workRequired: String,
      productsUsed: { type: Array, default: [] },
      labourCharges: { type: Array, default: [] },
      customCharges: { type: Array, default: [] },
      calculations: { type: Object, default: {} },
      assignedTechnician: String,
      workStatus: String,
      paymentStatus: String,
      amountPaid: { type: Number, default: 0 },
      amountPending: { type: Number, default: 0 },
      deliveredAt: String,
      lastPaymentAt: String,
      dateCreated: String,
      dateUpdated: String,
      createdBy: String,
      createdById: String,
      createdAt: String,
      updatedBy: String,
      updatedById: String,
      updatedAt: String,
      isDeleted: Boolean,
      deletedBy: String,
      deletedById: String,
      deletedAt: String,
    },
    opts,
  ),
);

export const Expense = mongoose.model(
  "Expense",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      expenseName: String,
      category: String,
      amount: Number,
      date: String,
      notes: String,
      paymentStatus: String,
      isDeleted: Boolean,
      createdBy: String,
      createdById: String,
      createdAt: String,
      updatedBy: String,
      updatedById: String,
      updatedAt: String,
      deletedBy: String,
      deletedById: String,
      deletedAt: String,
    },
    opts,
  ),
);

export const Investor = mongoose.model(
  "Investor",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      investorName: String,
      mobileNumber: String,
      notes: String,
      cars: { type: Array, default: [] },
      soldItems: { type: Array, default: [] },
      isDeleted: Boolean,
      createdBy: String,
      createdById: String,
      createdAt: String,
      updatedBy: String,
      updatedById: String,
      updatedAt: String,
      deletedBy: String,
      deletedById: String,
      deletedAt: String,
    },
    opts,
  ),
);

export const Notification = mongoose.model(
  "Notification",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      type: String,
      title: String,
      message: String,
      date: String,
      isRead: { type: Boolean, default: false },
    },
    opts,
  ),
);

export const Approval = mongoose.model(
  "Approval",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      type: String,
      requestedBy: String,
      requestedAt: String,
      status: String,
      details: { type: Object, default: {} },
      approvedBy: String,
      approvedAt: String,
      notes: String,
    },
    opts,
  ),
);

export const Technician = mongoose.model(
  "Technician",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true, unique: true },
    },
    opts,
  ),
);
