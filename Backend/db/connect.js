import mongoose from "mongoose";

const RETRY_ATTEMPTS = 4;
const RETRY_DELAY_MS = 2500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function friendlyMongoError(err) {
  const msg = err?.message || String(err);
  if (msg.includes("tlsv1 alert internal error") || msg.includes("ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR")) {
    return [
      "MongoDB Atlas SSL handshake failed (network/cluster issue).",
      "Fix: cloud.mongodb.com → Cluster Resume → Network Access (0.0.0.0/0) → password check → dubara npm run dev.",
    ].join(" ");
  }
  if (msg.includes("ETIMEOUT") || msg.includes("ENOTFOUND")) {
    return "MongoDB server reach nahi ho raha. Internet / VPN check karein aur Atlas cluster active ho.";
  }
  if (msg.includes("bad auth") || msg.includes("Authentication failed")) {
    return "MongoDB username/password galat hai. Atlas → Database Access se user reset karein aur .env update karein.";
  }
  return msg;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB connection URL to the .env file.");
  }

  const options = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  };

  let lastErr = null;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(uri, options);
      console.log("MongoDB connected successfully");
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS) {
        console.warn(`MongoDB connect attempt ${attempt}/${RETRY_ATTEMPTS} failed, retrying...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(friendlyMongoError(lastErr));
}
