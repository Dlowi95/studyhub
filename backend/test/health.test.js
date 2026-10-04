const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const mongoose = require("mongoose");
const { app } = require("../index");

test("GET /api/health returns the service status", async () => {
  const server = http.createServer(app).listen(0, "127.0.0.1");

  try {
    await once(server, "listening");
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const body = await response.json();

    const mongoConnected = mongoose.connection.readyState === 1;
    assert.equal(response.status, mongoConnected ? 200 : 503);
    assert.equal(body.status, mongoConnected ? "ok" : "unavailable");
    assert.ok(["connected", "disconnected"].includes(body.mongo));
    const adminStats = await fetch(`http://127.0.0.1:${port}/api/admin/stats`);
    assert.equal(adminStats.status, 401);
  } finally {
    server.close();
    await once(server, "close");
  }
});
