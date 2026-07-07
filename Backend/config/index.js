import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || "garage-assist-production-secret-998811";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Comma-separated list of extra allowed origins (optional)
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || FRONTEND_URL)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
