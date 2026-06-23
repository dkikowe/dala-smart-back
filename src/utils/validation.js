export function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body?.[field] || "").trim());

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.status = 422;
    throw error;
  }
}
