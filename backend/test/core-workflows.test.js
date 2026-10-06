const test = require("node:test");
const assert = require("node:assert/strict");
const Document = require("../models/Document");
const DocumentDownload = require("../models/DocumentDownload");
const DocumentInteraction = require("../models/DocumentInteraction");
const Report = require("../models/report");
const Review = require("../models/review");
const ReviewReply = require("../models/ReviewReply");
const Notification = require("../models/Notification");
const Subject = require("../models/Subject");
const documents = require("../controllers/documentController");
const reviews = require("../controllers/reviewController");
const reports = require("../controllers/reportController");
const subjects = require("../controllers/subjectController");
const admin = require("../controllers/adminController");
const { buildPublicDocumentQuery } = require("../utils/documentQuery");
const { resolveSubject } = require("../utils/resolveSubject");

const id = "507f1f77bcf86cd799439011";
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test("public search stays approved, handles accents/literal input, and bounds pagination", () => {
  const { query, sort, page, limit } = buildPublicDocumentQuery({
    status: "pending", q: "giai tich C++", subject: "Lập trình C/C++", sort: "popular", page: "-1", limit: "10000",
  });
  assert.equal(query.status, "approved");
  assert.equal(page, 1);
  assert.equal(limit, 100);
  assert.equal(sort.downloadCount, -1);
  const patterns = query.$and.map((term) => new RegExp(term.$or[0].title.$regex, "i"));
  assert.ok(patterns.every((pattern) => pattern.test("Giải tích C++")));
  assert.ok(!patterns[2].test("CCC"));
  const subject = new RegExp(query.subjectName.$regex, "i");
  assert.ok(subject.test("Lập trình C/C++"));
  assert.ok(!subject.test("Lập trình C/CCC"));
});

test("list applies server search before pagination and uses one filter for total", async (t) => {
  let itemPipeline;
  let countPipeline;
  t.mock.method(Document, "aggregate", async (pipeline) => {
    if (pipeline.some((stage) => stage.$count)) { countPipeline = pipeline; return [{ total: 25 }]; }
    itemPipeline = pipeline;
    return [];
  });
  const res = response();
  await documents.getDocuments({ query: { q: "bai tap", page: "2", limit: "12", sort: "rating" } }, res);
  assert.equal(res.statusCode, 200);
  const itemFilter = itemPipeline.find((stage) => stage.$match).$match;
  const countFilter = countPipeline.find((stage) => stage.$match).$match;
  assert.equal(itemFilter.status, "approved");
  assert.equal(itemFilter.$and.length, 2);
  assert.deepEqual(itemFilter, countFilter);
  assert.ok(itemPipeline.some((stage) => stage.$skip === 12));
  assert.ok(itemPipeline.some((stage) => stage.$limit === 12));
  assert.equal(res.body.total, 25);
  assert.equal(res.body.totalPages, 3);
});

test("my documents filters before pagination and returns full-account statistics", async (t) => {
  let countFilter;
  let listFilter;
  let skipValue;
  t.mock.method(Document, "countDocuments", async (filter) => { countFilter = filter; return 23; });
  t.mock.method(Document, "aggregate", async (pipeline) => {
    assert.equal(String(pipeline[0].$match.uploaderId), id);
    return [{ total: 26, approved: 20, pending: 4, rejected: 2, totalViews: 91, totalDownloads: 37 }];
  });
  t.mock.method(Document, "find", (filter) => {
    listFilter = filter;
    return {
      sort() { return this; },
      skip(value) { skipValue = value; return this; },
      limit() { return this; },
      lean: async () => [{ _id: id, title: "Bài tập" }],
    };
  });

  const res = response();
  await documents.getMyDocuments({
    user: { _id: id },
    query: { q: "giai tich", status: "pending", page: "2", limit: "10" },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(listFilter, countFilter);
  assert.equal(listFilter.uploaderId, id);
  assert.equal(listFilter.status, "pending");
  assert.equal(listFilter.$and.length, 2);
  assert.equal(skipValue, 10);
  assert.equal(res.body.count, 23);
  assert.equal(res.body.page, 2);
  assert.equal(res.body.totalPages, 3);
  assert.equal(res.body.summary.total, 26);
  assert.equal(res.body.summary.totalDownloads, 37);
});

test("my documents rejects unsupported status filters", async () => {
  const res = response();
  await documents.getMyDocuments({ user: { _id: id }, query: { status: "private" } }, res);
  assert.equal(res.statusCode, 400);
});

test("pending documents cannot be opened through public detail or counters", async (t) => {
  t.mock.method(Document, "findById", () => ({ populate: async () => ({ status: "pending" }) }));
  t.mock.method(Document, "findOne", async () => null);
  t.mock.method(Document, "findOneAndUpdate", async (filter) => {
    assert.deepEqual(filter, { _id: id, status: "approved" }); return null;
  });
  for (const handler of [documents.getDocumentById, documents.incrementView, documents.incrementDownload]) {
    const res = response();
    await handler({ params: { id } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.document, undefined);
  }
});

test("an uploader can privately open their own rejected document", async (t) => {
  const rejectedDocument = {
    _id: id,
    status: "rejected",
    uploaderId: { _id: id, name: "Người đăng" },
    fileUrl: "",
    toObject() { return this; },
  };
  t.mock.method(Document, "findById", () => ({ populate: async () => rejectedDocument }));
  const res = response();
  await documents.getDocumentById({ params: { id }, user: { _id: id } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "rejected");
});

test("a rejected document stays private to everyone except its uploader", async (t) => {
  const rejectedDocument = { status: "rejected", uploaderId: id, fileName: "bai-tap.pdf", fileUrl: "" };
  t.mock.method(Document, "findById", () => ({ lean: async () => rejectedDocument }));

  const ownerResponse = response();
  await documents.previewDocument({ params: { id }, user: { _id: id } }, ownerResponse);
  assert.equal(ownerResponse.statusCode, 415);
  assert.notEqual(ownerResponse.body.message, "Tài liệu không tồn tại hoặc chưa được công khai");

  const publicResponse = response();
  await documents.previewDocument({ params: { id } }, publicResponse);
  assert.equal(publicResponse.statusCode, 404);
});

test("public statistics never aggregate pending documents; admin can see all", async (t) => {
  const matches = [];
  t.mock.method(Document, "aggregate", async (pipeline) => { matches.push(pipeline[0].$match); return []; });
  await documents.getDocumentStats({}, response());
  assert.ok(matches.every((match) => match.status === "approved"));
  matches.length = 0;
  await documents.getDocumentStats({ user: { role: "admin" } }, response());
  assert.ok(matches.slice(0, 3).every((match) => !match.status));
  assert.equal(matches[3].status, "approved");
  matches.length = 0;
  await documents.getDocumentStats({ user: { role: "moderator" } }, response());
  assert.ok(matches.slice(0, 3).every((match) => match.status === "pending"));
  assert.equal(matches[3].status, "approved");
});

test("upload rejects whitespace title before storage; subject uses canonical catalog name", async (t) => {
  const res = response();
  await documents.uploadDocument({ file: {}, body: { title: "   ", subjectName: "Mạng máy tính" }, user: {} }, res);
  assert.equal(res.statusCode, 400);
  t.mock.method(Subject, "findById", () => ({ lean: async () => ({ _id: id, name: "Mạng máy tính", active: true }) }));
  assert.deepEqual(await resolveSubject(id, "Tên khác"), { subjectId: id, subjectName: "Mạng máy tính" });
  t.mock.method(Subject, "findOne", () => ({ lean: async () => ({ active: false }) }));
  await assert.rejects(resolveSubject(null, "Đã khóa"), { status: 400 });
});

test("public subjects count only approved documents and suppress inactive catalog entries", async (t) => {
  t.mock.method(Subject, "find", () => ({ sort: () => ({ lean: async () => [{ _id: id, name: "Giải tích", nameKey: "giải tích", active: false }] }) }));
  t.mock.method(Document, "aggregate", async (pipeline) => {
    assert.equal(pipeline[0].$match.status, "approved");
    return [{ _id: "Giải tích", count: 2 }];
  });
  const res = response();
  await subjects.getPublicSubjects({}, res);
  assert.ok(!res.body.subjects.some((subject) => subject.name === "Giải tích"));
});

test("reviews reject fractional/string ratings and oversized comments", async () => {
  for (const body of [{ rating: 2.5 }, { rating: "5" }, { rating: 5, comment: "a".repeat(1001) }]) {
    const res = response();
    await reviews.createReview({ params: { documentId: id }, body, user: { _id: id } }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("report rejects whitespace reason before querying documents", async () => {
  const res = response();
  await reports.createReport({ body: { documentId: id, reason: "   " }, user: { _id: id } }, res);
  assert.equal(res.statusCode, 400);
});

test("moderator cannot use report action to delete a document", async () => {
  const res = response();
  await reports.updateReportStatus({ params: { id }, body: { action: "resolve_delete" }, user: { _id: id, role: "moderator" } }, res);
  assert.equal(res.statusCode, 403);
});

test("resolve and delete keeps report history and sends feedback after deleting document", async (t) => {
  let saved = false;
  let deleted = false;
  let preserved = false;
  let notification;
  const report = {
    _id: id, documentId: { _id: id, title: "Bài tập" }, reporterId: id, status: "pending",
    async save() { saved = true; },
  };
  t.mock.method(Report, "findById", () => ({ populate: async () => report }));
  t.mock.method(Document, "findById", async () => ({ _id: id, title: "Bài tập", fileUrl: "" }));
  t.mock.method(Report, "updateMany", async (filter, update) => {
    assert.equal(filter.documentId, id);
    assert.deepEqual(update.$set, { documentTitle: "Bài tập", documentId: null }); preserved = true;
  });
  t.mock.method(Review, "deleteMany", async () => ({}));
  t.mock.method(Review, "find", () => ({ select: async () => [] }));
  t.mock.method(ReviewReply, "deleteMany", async () => ({}));
  t.mock.method(Notification, "deleteMany", async (filter) => { assert.equal(filter.relatedReportId, null); });
  t.mock.method(Notification, "updateMany", async () => ({}));
  t.mock.method(DocumentDownload, "deleteMany", async () => ({}));
  t.mock.method(DocumentInteraction, "deleteMany", async () => ({}));
  t.mock.method(Document, "findByIdAndDelete", async () => { deleted = true; });
  t.mock.method(Notification, "findOneAndUpdate", async (_filter, update) => { notification = update.$set; });
  const res = response();
  await reports.updateReportStatus({ params: { id }, body: { action: "resolve_delete", adminFeedback: "Đã xử lý" }, user: { _id: id, role: "admin" } }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(saved && deleted && preserved);
  assert.equal(report.documentId, null);
  assert.equal(report.status, "resolved");
  assert.match(notification.message, /Bài tập/);
  assert.match(notification.message, /Đã xử lý/);
  assert.equal(notification.relatedReportId, id);
});

test("reopening a report does not automatically approve the document", async (t) => {
  const report = { status: "resolved", save: async () => {} };
  t.mock.method(Report, "findById", () => ({ populate: async () => report }));
  const find = t.mock.method(Document, "findById", () => { throw new Error("Must not change document"); });
  const res = response();
  await reports.updateReportStatus({ params: { id }, body: { status: "pending" }, user: { _id: id, role: "admin" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(find.mock.callCount(), 0);
  assert.equal(report.handledBy, null);
});

test("dismissing a report closes only the report and leaves the document approved", async (t) => {
  const document = { _id: id, title: "Bài tập", status: "approved" };
  const report = {
    _id: id,
    documentId: document,
    documentTitle: document.title,
    reporterId: id,
    status: "pending",
    async save() {},
  };
  let reportNotification;
  let documentLookups = 0;
  t.mock.method(Report, "findById", () => ({ populate: async () => report }));
  t.mock.method(Document, "findById", async () => { documentLookups += 1; return document; });
  t.mock.method(Notification, "findOneAndUpdate", async (_filter, update) => { reportNotification = update.$set; });

  const res = response();
  await reports.updateReportStatus({
    params: { id },
    body: { action: "dismiss", adminFeedback: "Không đủ căn cứ" },
    user: { _id: id, role: "admin" },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(report.status, "dismissed");
  assert.equal(document.status, "approved");
  assert.equal(documentLookups, 0);
  assert.equal(reportNotification.type, "report_dismissed");
  assert.match(reportNotification.message, /không thay đổi trạng thái duyệt của tài liệu/);
});

test("admin rejection stores the selected reason and includes it in the uploader notification", async (t) => {
  const document = {
    _id: id, title: "Bài tập", uploaderId: id, status: "pending",
    async save() {}, async populate() { return this; },
  };
  let notification;
  t.mock.method(Document, "findById", async () => document);
  t.mock.method(Notification, "findOneAndUpdate", async (_filter, update) => { notification = update.$set; });
  const res = response();
  await admin.updateDocumentStatus({ params: { id }, body: { status: "rejected", moderationNote: "  Sai học phần  " } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(document.status, "rejected");
  assert.equal(document.moderationNote, "Sai học phần");
  assert.match(notification.message, /Lý do: Sai học phần/);
});

test("invalid moderation note cannot save a changed document status", async (t) => {
  let saved = false;
  t.mock.method(Document, "findById", async () => ({ status: "pending", async save() { saved = true; } }));
  const res = response();
  await admin.updateDocumentStatus({ params: { id }, body: { status: "rejected", moderationNote: "a".repeat(2001) } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(saved, false);
});
