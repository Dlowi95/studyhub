const Document = require("../models/Document");
const Report = require("../models/report");
const Review = require("../models/review");
const ReviewReply = require("../models/ReviewReply");
const Notification = require("../models/Notification");
const DocumentDownload = require("../models/DocumentDownload");
const DocumentInteraction = require("../models/DocumentInteraction");
const { deleteDocumentPhysicalFile } = require("./fileCleanup");

// Keep the report and its title available after removing the original document.
async function removeDocument(document) {
  const id = document._id;
  if (String(document.variantGroupId || "") === String(id)) {
    const siblings = await Document.find({ variantGroupId: id, _id: { $ne: id } })
      .sort({ status: 1, createdAt: 1 })
      .select("_id status");
    const promoted = siblings.find((sibling) => sibling.status === "approved") || siblings[0];
    if (promoted) {
      await Document.updateOne({ _id: promoted._id }, { $set: { variantGroupId: promoted._id } });
      await Document.updateMany(
        { variantGroupId: id, _id: { $ne: promoted._id } },
        { $set: { variantGroupId: promoted._id } }
      );
    }
  }
  await Report.updateMany({ documentId: id }, {
    $set: { documentTitle: document.title, documentId: null },
  });
  await Notification.deleteMany({ relatedDocumentId: id, relatedReportId: null });
  await Notification.updateMany({ relatedDocumentId: id }, { $set: { relatedDocumentId: null } });
  await Promise.all([
    DocumentDownload.deleteMany({ documentId: id }),
    DocumentInteraction.deleteMany({ documentId: id }),
  ]);
  const reviews = await Review.find({ documentId: id }).select("_id");
  if (reviews.length) await ReviewReply.deleteMany({ reviewId: { $in: reviews.map((review) => review._id) } });
  await Review.deleteMany({ documentId: id });
  await Document.findByIdAndDelete(id);
  await deleteDocumentPhysicalFile(document);
}
module.exports = { removeDocument };
