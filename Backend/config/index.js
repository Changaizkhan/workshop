import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || "garage-assist-production-secret-998811";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
