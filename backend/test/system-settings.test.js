const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const jwt = require("jsonwebtoken");
const SystemSetting = require("../models/SystemSetting");
const User = require("../models/user");
const Document = require("../models/Document");
const Report = require("../models/report");
const AuditLog = require("../models/AuditLog");
const adminRoutes = require("../routes/adminRoutes");
const adminController = require("../controllers/adminController");
const systemController = require("../controllers/systemController");
const { app } = require("../index");
const { maintenanceMode, uploadsAvailability } = require("../middleware/systemAvailability");
const { invalidateSystemSettingsCache } = require("../utils/systemSettings");

const userId = "507f1f77bcf86cd799439011";

function response() {
  return {
    statusCode: 200,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    json(body) { this.body = body; return this; },
  };
}

function mockSettingsRead(t, settings) {
  invalidateSystemSettingsCache();
  t.mock.method(SystemSetting, "findOne", () => ({ lean: async () => settings }));
}

test("maintenance middleware returns a public maintenance response and leaves health/control routes to the app", async (t) => {
  mockSettingsRead(t, { maintenanceEnabled: true, maintenanceMessage: "Đang nâng cấp", maintenanceExpectedEndAt: null });
  let nextCalled = false;
  const res = response();

  await maintenanceMode({}, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers["Retry-After"], "300");
  assert.equal(res.body.code, "SITE_MAINTENANCE");
  assert.equal(res.body.message, "Đang nâng cấp");
});

test("maintenance middleware passes requests when maintenance is off", async (t) => {
  mockSettingsRead(t, { maintenanceEnabled: false });
  let nextCalled = false;

  await maintenanceMode({}, response(), () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test("maintenance is enforced before public APIs and local file serving but leaves status and admin routes reachable", async (t) => {
  mockSettingsRead(t, { maintenanceEnabled: true, maintenanceMessage: "Đang nâng cấp" });
  const server = http.createServer(app).listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const publicResponse = await fetch(`http://127.0.0.1:${port}/api/documents`);
    assert.equal(publicResponse.status, 503);
    assert.equal((await publicResponse.json()).code, "SITE_MAINTENANCE");

    const fileResponse = await fetch(`http://127.0.0.1:${port}/uploads/nonexistent.pdf`);
    assert.equal(fileResponse.status, 503);

    const statusResponse = await fetch(`http://127.0.0.1:${port}/api/system/status`);
    assert.equal(statusResponse.status, 200);
    assert.equal((await statusResponse.json()).maintenanceEnabled, true);

    const healthResponse = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.ok([200, 503].includes(healthResponse.status));
    assert.notEqual((await healthResponse.json()).code, "SITE_MAINTENANCE");

    const adminResponse = await fetch(`http://127.0.0.1:${port}/api/admin/stats`);
    assert.equal(adminResponse.status, 401);
    const adminReportsResponse = await fetch(`http://127.0.0.1:${port}/api/admin/reports`);
    assert.equal(adminReportsResponse.status, 401);
  } finally {
    server.close();
    await new Promise((resolve) => server.once("close", resolve));
  }
});

test("upload middleware blocks new file uploads when the admin pauses them", async (t) => {
  mockSettingsRead(t, { uploadsEnabled: false, uploadsMessage: "Tạm dừng nhận bài" });
  let nextCalled = false;
  const res = response();

  await uploadsAvailability({}, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, "UPLOADS_PAUSED");
  assert.equal(res.body.message, "Tạm dừng nhận bài");
});

test("admin settings validation rejects non-boolean switches before touching storage", async (t) => {
  const findOne = t.mock.method(SystemSetting, "findOne", () => { throw new Error("Storage must not be called"); });
  const res = response();

  await systemController.updateAdminSettings({ body: { maintenanceEnabled: "true" }, user: { _id: userId } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(findOne.mock.callCount(), 0);
});

test("admin can update persisted site switches and invalidates the cached state", async (t) => {
  invalidateSystemSettingsCache();
  t.mock.method(AuditLog, "create", async (event) => event);
  t.mock.method(SystemSetting, "findOne", () => ({ lean: async () => null }));
  t.mock.method(SystemSetting, "findOneAndUpdate", async (filter, update, options) => {
    assert.deepEqual(filter, { key: "global" });
    assert.equal(update.$set.maintenanceEnabled, true);
    assert.equal(update.$set.uploadsEnabled, false);
    assert.equal(options.runValidators, true);
    return {
      _id: userId,
      toObject: () => ({
        key: "global",
        maintenanceEnabled: true,
        maintenanceMessage: "Đang bảo trì",
        maintenanceExpectedEndAt: null,
        uploadsEnabled: false,
        uploadsMessage: "Tạm dừng nhận bài",
        updatedBy: userId,
      }),
    };
  });
  const res = response();

  await systemController.updateAdminSettings({
    body: { maintenanceEnabled: true, maintenanceMessage: " Đang bảo trì ", uploadsEnabled: false, uploadsMessage: " Tạm dừng nhận bài " },
    user: { _id: userId, role: "admin", name: "Admin" },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.settings.maintenanceEnabled, true);
  assert.equal(res.body.settings.uploadsEnabled, false);
  assert.equal(res.body.settings.maintenanceMessage, "Đang bảo trì");
});

test("moderators cannot fetch global user lists, audit logs, or system settings", async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = previousSecret || "studyhub-permission-test-secret";
  const moderator = { _id: userId, role: "moderator", status: "active" };
  t.mock.method(User, "findById", async () => moderator);
  const app = express();
  app.use("/api/admin", adminRoutes);
  const server = http.createServer(app).listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    const { port } = server.address();
    for (const path of ["/users", "/audit-logs", "/subjects", "/stats", "/system-settings"]) {
      const result = await fetch(`http://127.0.0.1:${port}/api/admin${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(result.status, 403, `${path} must be admin-only`);
    }
  } finally {
    server.close();
    await new Promise((resolve) => server.once("close", resolve));
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test("moderator document catalog is forced to pending documents only", async (t) => {
  let query;
  let uploaderSelection;
  t.mock.method(Document, "find", (filter) => {
    query = filter;
    return { populate(field, selection) { uploaderSelection = { field, selection }; return this; }, sort: async () => [] };
  });
  const res = response();

  await adminController.getAllDocuments({ query: { status: "approved" }, user: { role: "moderator" } }, res);

  assert.deepEqual(query, { status: "pending" });
  assert.deepEqual(uploaderSelection, { field: "uploaderId", selection: "name" });
  assert.deepEqual(res.body, []);
});

test("moderators cannot inspect or change documents outside the pending queue", async (t) => {
  let inspecting = true;
  t.mock.method(Document, "findById", () => inspecting
    ? ({ populate: async () => ({ status: "approved" }) })
    : Promise.resolve({ status: "approved" }));
  const readRes = response();
  await adminController.getDocumentById({ params: { id: userId }, user: { role: "moderator" } }, readRes);
  assert.equal(readRes.statusCode, 404);

  inspecting = false;
  const updateRes = response();
  await adminController.updateDocumentStatus({
    params: { id: userId }, body: { status: "rejected" }, user: { _id: userId, role: "moderator" },
  }, updateRes);
  assert.equal(updateRes.statusCode, 403);
});

test("moderators see only pending reports and cannot reopen processed reports", async (t) => {
  let listFilter;
  t.mock.method(Report, "find", (filter) => {
    listFilter = filter;
    return { populate() { return this; }, sort: async () => [] };
  });
  const listRes = response();
  await require("../controllers/reportController").getAllReports({ query: {}, user: { role: "moderator" } }, listRes);
  assert.deepEqual(listFilter, { status: "pending" });

  const processedReport = { status: "resolved", populate: async () => null };
  t.mock.method(Report, "findById", () => ({ populate: async () => processedReport }));
  const updateRes = response();
  await require("../controllers/reportController").updateReportStatus({
    params: { id: userId }, body: { status: "pending" }, user: { _id: userId, role: "moderator" },
  }, updateRes);
  assert.equal(updateRes.statusCode, 403);
});
