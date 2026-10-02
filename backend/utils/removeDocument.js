const Document = require("../models/Document");
const Report = require("../models/report");
const Review = require("../models/review");
const Notification = require("../models/Notification");
const { deleteDocumentPhysicalFile } = require("./fileCleanup");

// Keep the report and its title available after removing the original document.
async function removeDocument(document) {
  const id = document._id;
  await Report.updateMany({ documentId: id }, {
    $set: { documentTitle: document.title, documentId: null },
  });
  await Notification.deleteMany({ relatedDocumentId: id, relatedReportId: null });
  await Notification.updateMany({ relatedDocumentId: id }, { $set: { relatedDocumentId: null } });
  await Review.deleteMany({ documentId: id });
  await Document.findByIdAndDelete(id);
  await deleteDocumentPhysicalFile(document);
}
module.exports = { removeDocument };
