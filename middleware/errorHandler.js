module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const response = { message: err.message || "Server error" };

  if (err.details) response.details = err.details;

  if (status === 500) console.error(err);

  res.status(status).json(response);
};
