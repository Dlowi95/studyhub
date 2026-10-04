const parseCorsOrigins = (value = "") => new Set(
  String(value)
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean)
);

const createCorsOriginValidator = ({ allowedOrigins = new Set(), isProduction = false } = {}) =>
  (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || (!isProduction && allowedOrigins.size === 0)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };

module.exports = { createCorsOriginValidator, parseCorsOrigins };
