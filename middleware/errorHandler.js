module.exports = function errorHandler(err, req, res, next) {
  if (err && err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }

  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(400).json({ message: `${field} already in use` });
  }

  const status = err.status || 500;
  const response = { message: err.message || "Server error" };

  if (err.details) response.details = err.details;

  if (status === 500) console.error(err);

  res.status(status).json(response);
};
