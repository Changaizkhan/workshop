import { createNotificationService } from "./notificationService.js";
import { createAuthService } from "./authService.js";
import { createUserService } from "./userService.js";
import { createProductService } from "./productService.js";
import { createJobService } from "./jobService.js";
import { createExpenseService } from "./expenseService.js";
import { createTechnicianService } from "./technicianService.js";
import { createCustomerService } from "./customerService.js";
import { createEstimateService } from "./estimateService.js";
import { createInvestorService } from "./investorService.js";
import { createApprovalService } from "./approvalService.js";
import { createDashboardService } from "./dashboardService.js";
import { createReportService } from "./reportService.js";

export function createServices(repos) {
  const notifications = createNotificationService(repos);
  const products = createProductService(repos, notifications);
  const jobs = createJobService(repos, notifications, products);
  const expenses = createExpenseService(repos, notifications);
  const customers = createCustomerService(repos);
  const estimates = createEstimateService(repos, customers);
  const investors = createInvestorService(repos);
  const technicians = createTechnicianService(repos);
  const approvals = createApprovalService(repos, notifications, products, expenses);
  const auth = createAuthService(repos);
  const users = createUserService(repos);
  const dashboard = createDashboardService(repos, jobs);
  const reports = createReportService(repos);

  return {
    notifications,
    products,
    jobs,
    expenses,
    customers,
    estimates,
    investors,
    technicians,
    approvals,
    auth,
    users,
    dashboard,
    reports,
  };
}
