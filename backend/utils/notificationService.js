const Document = require("../models/Document");
const Notification = require("../models/Notification");
const Report = require("../models/report");
const User = require("../models/user");
const Follow = require("../models/Follow");

const sameId = (first, second) => String(first?._id || first || "") === String(second?._id || second || "");

const notifyReviewComment = async (review, document) => {
  const recipient = document?.uploaderId?._id || document?.uploaderId;
  if (!review?._id || !recipient || !review.comment?.trim() || sameId(recipient, review.userId)) return;
  await upsertNotification({
    recipient,
    eventKey: `review:${review._id}:comment`,
    type: "review_received",
    title: "Tài liệu của bạn có nhận xét mới",
    message: `${review.userId?.name || "Một sinh viên"} đã để lại nhận xét cho tài liệu “${document.title || "Tài liệu"}”.`,
    link: `/documents/${document._id}#review-${review._id}`,
    relatedDocumentId: document._id,
    createdAt: review.createdAt,
  });
};

const notifyReviewReply = async (reply, review, document) => {
  if (!reply?._id || !review?._id || !document?._id) return;
  const uploaderId = document.uploaderId?._id || document.uploaderId;
  const reviewerId = review.userId?._id || review.userId;
  const recipients = new Map();
  if (reviewerId && !sameId(reviewerId, reply.userId)) recipients.set(String(reviewerId), {
    title: "Có người đã trả lời nhận xét của bạn",
    message: `${reply.userId?.name || "Một sinh viên"} đã phản hồi nhận xét của bạn về “${document.title || "Tài liệu"}”.`,
  });
  if (uploaderId && !sameId(uploaderId, reply.userId)) recipients.set(String(uploaderId), {
    title: "Tài liệu của bạn có phản hồi mới",
    message: `${reply.userId?.name || "Một sinh viên"} đã trả lời nhận xét trong “${document.title || "Tài liệu"}”.`,
  });
  await Promise.allSettled([...recipients].map(([recipient, copy]) => upsertNotification({
    recipient,
    eventKey: `review:${review._id}:reply:${reply._id}:${recipient}`,
    type: "review_reply",
    ...copy,
    link: `/documents/${document._id}#review-${review._id}`,
    relatedDocumentId: document._id,
    createdAt: reply.createdAt,
  })));
};

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
  const uploaderNotification = upsertNotification({
    recipient: document.uploaderId?._id || document.uploaderId,
    eventKey: `document:${document._id}:status:${status}`,
    type: approved ? "document_approved" : "document_rejected",
    title: approved ? "Tài liệu đã được phê duyệt" : "Tài liệu chưa được phê duyệt",
    message: approved
      ? `Tài liệu “${document.title}” đã được công khai trên StudyHub.`
      : `Tài liệu “${document.title}” đã bị từ chối.${document.moderationNote ? ` Lý do: ${document.moderationNote}.` : ""} Bạn có thể kiểm tra và tải lại bản phù hợp.`,
    link: approved ? `/documents/${document._id}` : "/profile",
    relatedDocumentId: document._id,
    createdAt: document.updatedAt || new Date(),
  });
  return uploaderNotification;
};

const notifyFollowersOfNewDocument = async (document) => {
  if (!document?._id || !document?.uploaderId) return;
  const uploaderId = document.uploaderId?._id || document.uploaderId;
  const [followers, uploader] = await Promise.all([
    Follow.find({ followingId: uploaderId }).distinct("followerId"),
    User.findById(uploaderId).select("name").lean(),
  ]);
  const isAdditionalFormat = Boolean(document.variantGroupId) && String(document.variantGroupId) !== String(document._id);
  await Promise.allSettled(followers.map((recipient) => upsertNotification({
    recipient,
    eventKey: `document:${document._id}:from-following:${recipient}`,
    type: "document_from_following",
    title: isAdditionalFormat ? "Tài liệu bạn theo dõi có định dạng mới" : "Người bạn theo dõi vừa đăng tài liệu",
    message: isAdditionalFormat
      ? `Bản ${document.fileType || "tệp mới"} của “${document.title || "tài liệu"}” đã được duyệt, do ${uploader?.name || "người bạn theo dõi"} chia sẻ.`
      : `${document.title || "Một tài liệu mới"} đã được duyệt và chia sẻ bởi ${uploader?.name || "người bạn theo dõi"}.`,
    link: `/documents/${document._id}`,
    relatedDocumentId: document._id,
    createdAt: document.updatedAt || new Date(),
  })));
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
  const documentTitle = report.documentId?.title || report.documentTitle || "Tài liệu";
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
      : `Báo cáo của bạn về tài liệu “${documentTitle}” đã được xem xét và bỏ qua. Thao tác này chỉ đóng báo cáo, không thay đổi trạng thái duyệt của tài liệu.${feedback}`,
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
        message: `Tài liệu “${report.documentId?.title || report.documentTitle || "Không rõ tiêu đề"}” có báo cáo cần xem xét.`,
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
  notifyFollowersOfNewDocument,
  notifyDocumentSubmitted,
  notifyModerators,
  notifyReportStatus,
  notifyReportSubmitted,
  notifyReviewComment,
  notifyReviewReply,
  syncHistoricalNotificationsForUser,
  upsertNotification,
};
