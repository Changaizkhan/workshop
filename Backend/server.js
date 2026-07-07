import { initDb } from "./db/db.js";
import { createApp } from "./app.js";
import { PORT, FRONTEND_URL } from "./config/index.js";

initDb()
  .then(() => {
    const app = createApp();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`HPG 4.0 - Backend API on port ${PORT}`);
      console.log(`CORS allowed for: ${FRONTEND_URL}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
