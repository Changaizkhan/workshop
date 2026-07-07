import express from "express";
import cors from "cors";
import { FRONTEND_URL } from "./config/index.js";
import apiRoutes from "./routes/index.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use("/api", apiRoutes);
  return app;
}
