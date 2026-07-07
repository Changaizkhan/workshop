import express from "express";
import cors from "cors";
import { ALLOWED_ORIGINS } from "./config/index.js";
import apiRoutes from "./routes/index.js";

// Allow explicitly configured origins plus any localhost / 127.0.0.1 / private LAN
// origin during development, so switching between the Vite Local and Network URLs
// doesn't trigger CORS errors.
const DEV_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.[\d.]+)(?::\d+)?$/;

function isOriginAllowed(origin) {
  if (!origin) return true; // non-browser clients (curl, same-origin, etc.)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return DEV_ORIGIN_PATTERN.test(origin);
}

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin not allowed by CORS: ${origin}`));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use("/api", apiRoutes);
  return app;
}
