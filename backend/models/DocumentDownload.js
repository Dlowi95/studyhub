const mongoose = require("mongoose");

const documentDownloadSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

documentDownloadSchema.index({ documentId: 1, userId: 1 }, { unique: true });
documentDownloadSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.DocumentDownload || mongoose.model("DocumentDownload", documentDownloadSchema);
