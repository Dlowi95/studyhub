const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Document = require("../models/Document");
const subjects = require("../controllers/subjectController");
const id = "507f1f77bcf86cd799439011";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const sessionQuery = value => ({ session: async () => value });

function setup(t, name = "Lập trình Web") {
  const session = { testSession: true };
  const subject = { _id: id, name, nameKey: subjects.getSubjectNameKey(name), code: "IT01", active: true, save: t.mock.fn(async options => assert.equal(options.session, session)) };
  t.mock.method(mongoose.connection, "transaction", async callback => callback(session));
  t.mock.method(Subject, "findById", () => sessionQuery(subject));
  return { session, subject };
}

test("invalid subject edits are rejected before a database transaction", async t => {
  const transaction = t.mock.method(mongoose.connection, "transaction", () => { throw new Error("Must not query"); });
  for (const body of [{ name: " " }, { name: "Valid", code: "bad code!" }, { name: "Valid", active: "false" }, { name: "x".repeat(121) }]) {
    const res = response();
    await subjects.updateSubject({ params: { id }, body }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(transaction.mock.callCount(), 0);
});

test("rename updates linked documents and suppresses the old built-in name in one transaction", async t => {
  const { session, subject } = setup(t);
  t.mock.method(Subject, "find", () => sessionQuery([]));
  const update = t.mock.method(Document, "updateMany", async (filter, change, options) => {
    assert.equal(options.session, session);
    assert.equal(filter.$or[0].subjectId, id);
    assert.ok(new RegExp(filter.$or[1].subjectName.$regex, "i").test("Lập trình Web"));
    assert.equal(change.$set.subjectId, id);
    assert.equal(change.$set.subjectName, "Phát triển Web");
    return { modifiedCount: 3 };
  });
  const tombstone = t.mock.method(Subject, "create", async (items, options) => {
    assert.equal(options.session, session);
    assert.equal(items[0].name, "Lập trình Web");
    assert.equal(items[0].deleted, true);
  });
  const res = response();
  await subjects.updateSubject({ params: { id }, body: { name: " Phát triển   Web ", code: "it02", active: false } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.updatedDocuments, 3);
  assert.equal(subject.active, false);
  assert.equal(subject.code, "IT02");
  assert.equal(update.mock.callCount(), 1);
  assert.equal(tombstone.mock.callCount(), 1);
});

test("a duplicate name or code cannot save a subject or change linked documents", async t => {
  const { subject } = setup(t);
  t.mock.method(Subject, "find", () => sessionQuery([{ nameKey: "duplicate", deleted: false }]));
  const update = t.mock.method(Document, "updateMany", () => assert.fail("No document writes"));
  const res = response();
  await subjects.updateSubject({ params: { id }, body: { name: "Duplicate" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(subject.save.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test("a previously deleted name can be reused when undoing a rename", async t => {
  const { session, subject } = setup(t, "Phát triển Web");
  t.mock.method(Subject, "find", () => sessionQuery([{ _id: "old", nameKey: "lập trình web", deleted: true }]));
  const remove = t.mock.method(Subject, "deleteOne", async (filter, options) => {
    assert.equal(filter._id, "old"); assert.equal(options.session, session);
  });
  t.mock.method(Document, "updateMany", async () => ({ modifiedCount: 3 }));
  const res = response();
  await subjects.updateSubject({ params: { id }, body: { name: "Lập trình Web" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(subject.name, "Lập trình Web");
  assert.equal(remove.mock.callCount(), 1);
});

test("subjects with documents cannot be deleted, regardless of document status", async t => {
  const { subject } = setup(t);
  t.mock.method(Document, "countDocuments", filter => {
    assert.equal(filter.status, undefined);
    assert.equal(filter.$or[0].subjectId, id);
    return sessionQuery(2);
  });
  const res = response();
  await subjects.deleteSubject({ params: { id } }, res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /2 tài liệu/);
  assert.equal(subject.save.mock.callCount(), 0);
  assert.equal(subject.deleted, undefined);
});

test("deleting an empty subject removes it from the catalog and releases its code", async t => {
  const { subject } = setup(t);
  t.mock.method(Document, "countDocuments", () => sessionQuery(0));
  const res = response();
  await subjects.deleteSubject({ params: { id } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(subject.deleted, true);
  assert.equal(subject.active, false);
  assert.equal(subject.code, undefined);
  assert.equal(subject.save.mock.callCount(), 1);
});

test("removed default subjects never reappear in public or admin fallback lists", async t => {
  t.mock.method(Subject, "find", () => ({ sort: () => ({ lean: async () => [{ _id: id, name: "Giải tích", nameKey: "giải tích", active: false, deleted: true }] }) }));
  t.mock.method(Document, "aggregate", async () => []);
  for (const controller of [subjects.getAdminSubjects, subjects.getPublicSubjects]) {
    const res = response();
    await controller({}, res);
    assert.ok(!res.body.subjects.some(item => item.name === "Giải tích"));
  }
});

test("legacy catalog subjects can be edited and linked documents acquire their canonical id", async t => {
  const { session, subject } = setup(t, "Mạng máy tính");
  t.mock.method(Subject, "findOne", () => sessionQuery(null));
  t.mock.method(Subject, "find", filter => Object.keys(filter).length ? sessionQuery([]) : ({ sort: () => ({ lean: async () => [] }) }));
  t.mock.method(Document, "aggregate", async () => [{ _id: "Mạng máy tính", count: 1 }]);
  t.mock.method(Subject, "create", async (items, options) => {
    assert.equal(options.session, session);
    assert.equal(items[0].name, "Mạng máy tính");
    return [subject];
  });
  t.mock.method(Document, "updateMany", async () => ({ modifiedCount: 1 }));
  const res = response();
  await subjects.updateSubject({ params: { id: "legacy:mạng máy tính" }, body: { name: "Mạng máy tính", code: "NET01" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.subject._id, id);
  assert.equal(res.body.subject.code, "NET01");
});

test("subject edit/delete routes reject unauthenticated and non-admin accounts", async t => {
  const express = require("express");
  const http = require("node:http");
  const { once } = require("node:events");
  const jwt = require("jsonwebtoken");
  const User = require("../models/user");
  const app = express();
  app.use(express.json());
  app.use("/api/admin", require("../routes/adminRoutes"));
  t.mock.method(jwt, "verify", () => ({ id }));
  let role = "moderator";
  t.mock.method(User, "findById", async () => ({ _id: id, role, status: "active" }));
  const server = http.createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/admin/subjects/${id}`;
    for (const method of ["PUT", "DELETE"]) {
      assert.equal((await fetch(url, { method })).status, 401);
      for (role of ["moderator", "student"]) assert.equal((await fetch(url, { method, headers: { Authorization: "Bearer fixture" } })).status, 403);
    }
  } finally {
    server.close();
    await once(server, "close");
  }
});
