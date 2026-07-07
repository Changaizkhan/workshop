import { hashPassword, verifyPassword, isPasswordHashed } from "../db/password.js";
import { JWT_SECRET } from "../config/index.js";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/httpError.js";

const buildAuthUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  name: user.name,
  permissions: user.permissions || [],
  assignedInvestorIds: user.assignedInvestorIds || [],
});

const signToken = (user) => jwt.sign(buildAuthUser(user), JWT_SECRET, { expiresIn: "24h" });

export function createAuthService(repos) {
  const { users } = repos;

  return {
    async setup({ username, password, name }) {
      const all = await users.findAll();
      if (all.length > 0) {
        throw new HttpError(403, "Setup already completed. Use login instead.");
      }
      const u = String(username || "").trim();
      const p = String(password || "").trim();
      const n = String(name || "").trim();
      if (!u || !p || !n) {
        throw new HttpError(400, "Username, password, and name are required.");
      }
      const newUser = await users.create({
        id: `usr-${Date.now()}`,
        username: u,
        name: n,
        role: "ADMIN",
        password: await hashPassword(p),
        permissions: ["dashboard", "inventory", "customers", "estimates", "jobs", "expenses", "investor", "reports", "approvals"],
        assignedInvestorIds: [],
      });
      return { message: "Admin account created successfully.", token: signToken(newUser), user: buildAuthUser(newUser) };
    },

    async login({ username, password }) {
      const u = String(username || "").trim();
      const p = String(password || "").trim();
      if (!u || !p) {
        throw new HttpError(400, "Please enter both username and password.");
      }
      const all = await users.findAll();
      const user = all.find((x) => x.username.toLowerCase() === u.toLowerCase());
      if (!user) {
        throw new HttpError(401, "Invalid username or password.");
      }
      const valid = await verifyPassword(p, user.password);
      if (!valid) {
        throw new HttpError(401, "Invalid username or password.");
      }
      if (!isPasswordHashed(user.password)) {
        await users.update(user.id, { password: await hashPassword(p) });
      }
      return { token: signToken(user), user: buildAuthUser(user) };
    },

    async me(userId, fallback) {
      const all = await users.findAll();
      const dbUser = all.find((u) => u.id === userId);
      return { user: dbUser ? buildAuthUser(dbUser) : fallback };
    },

    buildAuthUser,
  };
}
