import { Router } from "express";
import { authenticate, restrictAdmin, restrictAdminOrManager } from "../middleware/auth.js";
import * as authController from "../controllers/authController.js";
import * as userController from "../controllers/userController.js";
import * as inventoryController from "../controllers/inventoryController.js";
import * as customerController from "../controllers/customerController.js";
import * as estimateController from "../controllers/estimateController.js";
import * as jobController from "../controllers/jobController.js";
import * as expenseController from "../controllers/expenseController.js";
import * as investorController from "../controllers/investorController.js";
import * as technicianController from "../controllers/technicianController.js";
import * as notificationController from "../controllers/notificationController.js";
import * as approvalController from "../controllers/approvalController.js";
import * as dashboardController from "../controllers/dashboardController.js";

const router = Router();

router.get("/health", dashboardController.health);

router.post("/auth/setup", authController.setup);
router.post("/auth/login", authController.login);
router.get("/auth/me", authenticate, authController.me);

router.post("/users", authenticate, restrictAdmin, userController.create);
router.get("/users", authenticate, restrictAdmin, userController.list);
router.put("/users/:id", authenticate, restrictAdmin, userController.update);
router.delete("/users/:id", authenticate, restrictAdmin, userController.remove);

router.get("/inventory", authenticate, inventoryController.list);
router.post("/inventory", authenticate, inventoryController.create);
router.put("/inventory/:id", authenticate, inventoryController.update);
router.delete("/inventory/:id", authenticate, inventoryController.remove);

router.get("/customers", authenticate, customerController.list);
router.post("/customers", authenticate, customerController.create);
router.get("/customers/:id/profile", authenticate, customerController.profile);
router.post("/customers/:id/cars", authenticate, customerController.addCar);
router.put("/customers/:id", authenticate, customerController.update);
router.delete("/customers/:id", authenticate, customerController.remove);

router.get("/estimates", authenticate, estimateController.list);
router.post("/estimates", authenticate, estimateController.create);
router.put("/estimates/:id", authenticate, estimateController.update);
router.delete("/estimates/:id", authenticate, estimateController.remove);
router.post("/estimates/:id/convert", authenticate, estimateController.convert);

router.get("/jobs", authenticate, jobController.list);
router.post("/jobs", authenticate, jobController.create);
router.put("/jobs/:id", authenticate, jobController.update);
router.delete("/jobs/:id", authenticate, jobController.remove);

router.get("/expenses", authenticate, expenseController.list);
router.post("/expenses", authenticate, expenseController.create);
router.put("/expenses/:id", authenticate, expenseController.update);
router.delete("/expenses/:id", authenticate, expenseController.remove);

router.get("/investors", authenticate, investorController.list);
router.post("/investors", authenticate, restrictAdmin, investorController.create);
router.put("/investors/:id", authenticate, restrictAdmin, investorController.update);
router.post("/investors/:id/cars", authenticate, investorController.addCar);
router.put("/investors/:id/cars/:carId", authenticate, investorController.updateCar);
router.delete("/investors/:id/cars/:carId", authenticate, investorController.deleteCar);
router.post("/investors/:id/cars/:carId/sell", authenticate, investorController.sellCar);
router.delete("/investors/:id/sold/:saleId", authenticate, investorController.deleteSoldItem);
router.delete("/investors/:id", authenticate, restrictAdmin, investorController.remove);

router.get("/technicians", authenticate, technicianController.list);
router.post("/technicians", authenticate, restrictAdminOrManager, technicianController.create);
router.delete("/technicians/:name", authenticate, restrictAdminOrManager, technicianController.remove);

router.get("/notifications", authenticate, notificationController.list);
router.post("/notifications/read/:id", authenticate, notificationController.markRead);
router.post("/notifications/clear", authenticate, notificationController.clear);

router.get("/approvals", authenticate, approvalController.list);
router.post("/approvals/:id/resolve", authenticate, restrictAdmin, approvalController.resolve);

router.get("/dashboard/stats", authenticate, dashboardController.stats);
router.get("/reports/profit-loss", authenticate, restrictAdminOrManager, dashboardController.profitLoss);
router.get("/reports/technician", authenticate, restrictAdminOrManager, dashboardController.technician);

export default router;
