import { connectDB } from "./connect.js";
import { createRepositories } from "../repositories/index.js";
import { createServices } from "../services/index.js";

let services = null;

export async function initDb() {
  await connectDB();
  const repos = createRepositories();
  services = createServices(repos);
  await services.technicians.ensureDefaults();
  await services.expenses.ensurePaymentStatus();
  return services;
}

export function getServices() {
  if (!services) {
    throw new Error("Database not initialized. Call initDb() before using the API.");
  }
  return services;
}

/** @deprecated Use getServices() */
export function getDb() {
  return getServices();
}
