export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  });
};
