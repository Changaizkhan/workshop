import { createUserRepository } from "./userRepository.js";
import { createCustomerRepository } from "./customerRepository.js";
import { createVehicleRepository } from "./vehicleRepository.js";
import { createProductRepository } from "./productRepository.js";
import { createEstimateRepository } from "./estimateRepository.js";
import { createJobRepository } from "./jobRepository.js";
import { createExpenseRepository } from "./expenseRepository.js";
import { createInvestorRepository } from "./investorRepository.js";
import { createNotificationRepository } from "./notificationRepository.js";
import { createApprovalRepository } from "./approvalRepository.js";
import { createTechnicianRepository } from "./technicianRepository.js";

export function createRepositories() {
  return {
    users: createUserRepository(),
    customers: createCustomerRepository(),
    vehicles: createVehicleRepository(),
    products: createProductRepository(),
    estimates: createEstimateRepository(),
    jobs: createJobRepository(),
    expenses: createExpenseRepository(),
    investors: createInvestorRepository(),
    notifications: createNotificationRepository(),
    approvals: createApprovalRepository(),
    technicians: createTechnicianRepository(),
  };
}
