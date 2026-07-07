import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Access token is missing." });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden. Access token is expired or invalid." });
    }
    req.user = user;
    next();
  });
};

export const restrictAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Access Denied. Admins only can perform this action." });
  }
  next();
};

export const restrictAdminOrManager = (req, res, next) => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "MANAGER") {
    return res.status(403).json({ error: "Access Denied. Admins or Managers only can perform this action." });
  }
  next();
};
