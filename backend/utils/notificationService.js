const Document = require("../models/Document");
const Notification = require("../models/Notification");
const Report = require("../models/report");
const User = require("../models/user");

const upsertNotification = async ({ recipient, eventKey, ...payload }) => {
  if (!recipient || !eventKey) return null;
  return Notification.findOneAndUpdate(
    { recipient, eventKey },
    {
      $setOnInsert: {
        recipient,
        eventKey,
        read: false,
        createdAt: payload.createdAt || new Date(),
      },
      $set: {
        type: payload.type || "system",
        title: payload.title,
        message: payload.message,
        link: payload.link || "/",
        relatedDocumentId: payload.relatedDocumentId || null,
        relatedReportId: payload.relatedReportId || null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getModeratorRecipients = async () =>
  User.find({ role: { $in: ["admin", "moderator"] }, status: "active" }).distinct("_id");

const notifyModerators = async (payload) => {
  const recipients = await getModeratorRecipients();
  await Promise.allSettled(
    recipients.map((recipient) => upsertNotification({ ...payload, recipient }))
  );
};

const notifyDocumentSubmitted = async (document) => {
  if (!document?._id) return;
  await notifyModerators({
    eventKey: `document:${document._id}:submitted`,
    type: "document_submitted",
    title: "Có tài liệu mới chờ duyệt",
    message: `Tài liệu “${document.title || "Chưa có tiêu đề"}” vừa được gửi lên StudyHub.`,
    link: "/admin?tab=pending",
    relatedDocumentId: document._id,
    createdAt: document.createdAt,
  });
};

const notifyDocumentStatus = async (document, status) => {
  if (!document?._id || !document?.uploaderId || !["approved", "rejected"].includes(status)) return;
  const approved = status === "approved";
  await upsertNotification({
    recipient: document.uploaderId?._id || document.uploaderId,
    eventKey: `document:${document._id}:status:${status}`,
    type: approved ? "document_approved" : "document_rejected",
    title: approved ? "Tài liệu đã được phê duyệt" : "Tài liệu chưa được phê duyệt",
    message: approved
      ? `Tài liệu “${document.title}” đã được công khai trên StudyHub.`
      : `Tài liệu “${document.title}” đã bị từ chối. Bạn có thể kiểm tra và tải lại bản phù hợp.`,
    link: approved ? `/documents/${document._id}` : "/profile",
    relatedDocumentId: document._id,
    createdAt: document.updatedAt || new Date(),
  });
};

const notifyReportSubmitted = async (report, document) => {
  if (!report?._id) return;
  await notifyModerators({
    eventKey: `report:${report._id}:submitted`,
    type: "report_submitted",
    title: "Có báo cáo vi phạm mới",
    message: `Tài liệu “${document?.title || "Không rõ tiêu đề"}” vừa nhận một báo cáo cần xem xét.`,
    link: "/admin?tab=reports",
    relatedDocumentId: document?._id || report.documentId,
    relatedReportId: report._id,
    createdAt: report.createdAt,
  });
};

const notifyReportStatus = async (report) => {
  const status = report?.status;
  if (!report?._id || !report?.reporterId || !["resolved", "dismissed"].includes(status)) return;
  const resolved = status === "resolved";
  const documentTitle = report.documentId?.title || "Tài liệu";
  const feedback = report.adminFeedback
    ? ` Ghi chú từ quản trị viên: “${report.adminFeedback}”.`
    : "";

  await upsertNotification({
    recipient: report.reporterId?._id || report.reporterId,
    eventKey: `report:${report._id}:status:${status}`,
    type: resolved ? "report_resolved" : "report_dismissed",
    title: resolved ? "Báo cáo vi phạm đã được xử lý" : "Báo cáo vi phạm đã được xem xét",
    message: resolved
      ? `Báo cáo của bạn về tài liệu “${documentTitle}” đã được chấp thuận và xử lý.${feedback}`
      : `Báo cáo của bạn về tài liệu “${documentTitle}” đã được xem xét và bỏ qua.${feedback}`,
    link: "/my-reports",
    relatedDocumentId: report.documentId?._id || report.documentId,
    relatedReportId: report._id,
    createdAt: report.resolvedAt || new Date(),
  });
};

const syncHistoricalNotificationsForUser = async (user) => {
  if (!user?._id) return;

  const [ownedDocuments, ownedReports, pendingDocuments, pendingReports] = await Promise.all([
    Document.find({
      uploaderId: user._id,
      status: { $in: ["approved", "rejected"] },
    })
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean(),
    Report.find({
      reporterId: user._id,
      status: { $in: ["resolved", "dismissed"] },
    })
      .populate("documentId", "title")
      .sort({ resolvedAt: -1 })
      .limit(30)
      .lean(),
    ["admin", "moderator"].includes(user.role)
      ? Document.find({ status: "pending" }).sort({ createdAt: -1 }).limit(30).lean()
      : [],
    ["admin", "moderator"].includes(user.role)
      ? Report.find({ status: "pending" })
          .populate("documentId", "title")
          .sort({ createdAt: -1 })
          .limit(30)
          .lean()
      : [],
  ]);

  const tasks = [
    ...ownedDocuments.map((document) => notifyDocumentStatus(document, document.status)),
    ...ownedReports.map((report) => notifyReportStatus(report)),
    ...pendingDocuments.map((document) =>
      upsertNotification({
        recipient: user._id,
        eventKey: `document:${document._id}:submitted`,
        type: "document_submitted",
        title: "Có tài liệu mới chờ duyệt",
        message: `Tài liệu “${document.title || "Chưa có tiêu đề"}” đang chờ kiểm duyệt.`,
        link: "/admin?tab=pending",
        relatedDocumentId: document._id,
        createdAt: document.createdAt,
      })
    ),
    ...pendingReports.map((report) =>
      upsertNotification({
        recipient: user._id,
        eventKey: `report:${report._id}:submitted`,
        type: "report_submitted",
        title: "Có báo cáo vi phạm đang chờ xử lý",
        message: `Tài liệu “${report.documentId?.title || "Không rõ tiêu đề"}” có báo cáo cần xem xét.`,
        link: "/admin?tab=reports",
        relatedDocumentId: report.documentId?._id || report.documentId,
        relatedReportId: report._id,
        createdAt: report.createdAt,
      })
    ),
  ];

  await Promise.allSettled(tasks);
};

module.exports = {
  notifyDocumentStatus,
  notifyDocumentSubmitted,
  notifyModerators,
  notifyReportStatus,
  notifyReportSubmitted,
  syncHistoricalNotificationsForUser,
  upsertNotification,
};
