export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;

  if (error.code === 11000) {
    return res.status(409).json({
      error: "Duplicate value",
      fields: Object.keys(error.keyPattern || {}),
    });
  }

  if (error.name === "ValidationError") {
    return res.status(422).json({
      error: "Validation error",
      details: Object.values(error.errors).map((item) => item.message),
    });
  }

  res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
  });
}
