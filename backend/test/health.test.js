const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { app } = require("../index");

test("GET /api/health returns the service status", async () => {
  const server = http.createServer(app).listen(0, "127.0.0.1");

  try {
    await once(server, "listening");
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.ok(["connected", "disconnected"].includes(body.mongo));
  } finally {
    server.close();
    await once(server, "close");
  }
});
