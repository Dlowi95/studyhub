const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const User = require("../models/user");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const DocumentInteraction = require("../models/DocumentInteraction");
const bookmarks = require("../controllers/bookmarkController");
const admin = require("../controllers/adminController");
const documents = require("../controllers/documentController");

const id = "507f1f77bcf86cd799439011";
const otherId = "507f1f77bcf86cd799439012";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("account bookmarks expose only approved documents and use set/pull updates", async (t) => {
  const savedDocument = { _id: id, title: "Giải tích", status: "approved", subjectName: "Giải tích" };
  t.mock.method(User, "findById", () => ({ populate: async () => ({ bookmarkedDocuments: [savedDocument, null] }) }));
  const listResponse = response();
  await bookmarks.getMyBookmarks({ user: { _id: otherId } }, listResponse);
  assert.equal(listResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.bookmarks.map((item) => item.id), [id]);

  let update;
  t.mock.method(Document, "findOne", () => ({ select: async () => savedDocument }));
  t.mock.method(User, "findByIdAndUpdate", async (_userId, operation) => { update = operation; });
  const addResponse = response();
  await bookmarks.addBookmark({ params: { documentId: id }, user: { _id: otherId } }, addResponse);
  assert.equal(addResponse.statusCode, 201);
  assert.deepEqual(update, { $addToSet: { bookmarkedDocuments: id } });

  const removeResponse = response();
  await bookmarks.removeBookmark({ params: { documentId: id }, user: { _id: otherId } }, removeResponse);
  assert.equal(removeResponse.statusCode, 200);
  assert.deepEqual(update, { $pull: { bookmarkedDocuments: id } });
});

test("admin audit log endpoint filters and paginates recent actions", async (t) => {
  let filter;
  const chain = {
    sort() { return this; },
    skip(value) { assert.equal(value, 10); return this; },
    limit(value) { assert.equal(value, 10); return this; },
    populate() { return this; },
    lean: async () => [{ _id: otherId, action: "document_status_changed" }],
  };
  t.mock.method(AuditLog, "find", (value) => { filter = value; return chain; });
  t.mock.method(AuditLog, "countDocuments", async (value) => { assert.deepEqual(value, filter); return 21; });
  const res = response();
  await admin.getAuditLogs({ query: { page: "2", limit: "10", action: "document_status_changed", documentId: id } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(filter, { action: "document_status_changed", documentId: id });
  assert.equal(res.body.totalPages, 3);
  assert.equal(res.body.items.length, 1);
});

test("view and download counters ignore duplicate interactions in the same window", async (t) => {
  let claims = 0;
  t.mock.method(DocumentInteraction, "create", async () => {
    claims += 1;
    if (claims === 2) throw Object.assign(new Error("duplicate"), { code: 11000 });
    return {};
  });
  let increments = 0;
  t.mock.method(Document, "findOneAndUpdate", async () => { increments += 1; return { _id: id, viewCount: 1 }; });
  const request = { params: { id }, headers: { "x-studyhub-session": "browser-1" } };
  const first = response();
  await documents.incrementView(request, first);
  const duplicate = response();
  await documents.incrementView(request, duplicate);
  assert.equal(first.body.counted, true);
  assert.equal(duplicate.body.counted, false);
  assert.equal(increments, 1);
  assert.equal(claims, 2);
  assert.ok(mongoose.isObjectIdOrHexString(id));
});
