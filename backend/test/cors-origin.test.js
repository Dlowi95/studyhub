const test = require("node:test");
const assert = require("node:assert/strict");
const { createCorsOriginValidator, parseCorsOrigins } = require("../utils/corsOrigin");

const checkOrigin = (validate, origin) => new Promise((resolve, reject) => {
  validate(origin, (error, allowed) => error ? reject(error) : resolve(allowed));
});

test("production CORS allows configured frontend origins and rejects others", async () => {
  const allowedOrigins = parseCorsOrigins("https://studyhub.vercel.app/, https://preview.studyhub.app");
  const validate = createCorsOriginValidator({ allowedOrigins, isProduction: true });

  assert.equal(await checkOrigin(validate, "https://studyhub.vercel.app"), true);
  assert.equal(await checkOrigin(validate, "https://preview.studyhub.app"), true);
  assert.equal(await checkOrigin(validate, "https://unknown.example"), false);
  assert.equal(await checkOrigin(validate, undefined), true);
});

test("development CORS stays open only when no allowlist is configured", async () => {
  const validate = createCorsOriginValidator({ allowedOrigins: new Set(), isProduction: false });

  assert.equal(await checkOrigin(validate, "http://localhost:5173"), true);
});
