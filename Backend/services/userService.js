import { hashPassword } from "../db/password.js";
import { HttpError } from "../utils/httpError.js";

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role,
  permissions: u.permissions || [],
  assignedInvestorIds: u.assignedInvestorIds || [],
});

export function createUserService(repos) {
  const { users } = repos;

  return {
    async create({ username, password, name, role, permissions, assignedInvestorIds }) {
      if (!username || !password || !name || !role) {
        throw new HttpError(400, "Missing user fields.");
      }
      const all = await users.findAll();
      if (all.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        throw new HttpError(400, "Username is already taken.");
      }
      const newUser = await users.create({
        id: `usr-${Date.now()}`,
        username,
        name,
        role,
        password: await hashPassword(password),
        permissions: permissions || ["dashboard", "inventory", "customers", "estimates", "jobs", "expenses", "investor", "reports"],
        assignedInvestorIds: Array.isArray(assignedInvestorIds) ? assignedInvestorIds : [],
      });
      return { message: "User created successfully", user: publicUser(newUser) };
    },

    async list({ page = 1, limit = 15, search = "" }) {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(50, Math.max(5, parseInt(limit, 10) || 15));
      const q = String(search || "").trim().toLowerCase();

      let list = await users.findAll();
      if (q) {
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q),
        );
      }

      const total = list.length;
      const start = (p - 1) * l;
      return {
        items: list.slice(start, start + l).map(publicUser),
        total,
        page: p,
        limit: l,
        summary: {
          total,
          admin: list.filter((u) => u.role === "ADMIN").length,
          manager: list.filter((u) => u.role === "MANAGER").length,
          staff: list.filter((u) => u.role === "STAFF" || u.role === "USER").length,
        },
      };
    },

    async update(id, body, actorId) {
      const { username, name, role, password, permissions, assignedInvestorIds } = body;
      const all = await users.findAll();
      const existing = all.find((u) => u.id === id);
      if (!existing) throw new HttpError(404, "User not found.");

      if (username && username.toLowerCase() !== existing.username.toLowerCase()) {
        if (all.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          throw new HttpError(400, "Username is already taken.");
        }
      }
      if (existing.id === actorId && role && role !== "ADMIN") {
        throw new HttpError(400, "Admins cannot remove their own ADMIN role.");
      }

      const updates = {
        username: username || existing.username,
        name: name || existing.name,
        role: role || existing.role,
        permissions: permissions !== undefined ? permissions : existing.permissions,
        assignedInvestorIds: assignedInvestorIds !== undefined ? assignedInvestorIds : existing.assignedInvestorIds || [],
      };
      if (password && String(password).trim()) {
        updates.password = await hashPassword(password);
      }

      const updated = await users.update(id, updates);
      return {
        message: "User updated successfully",
        user: publicUser(updated),
      };
    },

    async delete(id, actorId) {
      if (id === actorId) {
        throw new HttpError(400, "You cannot delete your own admin account.");
      }
      const success = await users.delete(id);
      if (!success) throw new HttpError(404, "User not found.");
      return { success: true, message: "User deleted successfully" };
    },

    async getAssignedInvestorIds(userId) {
      const all = await users.findAll();
      return all.find((u) => u.id === userId)?.assignedInvestorIds || [];
    },
  };
}
