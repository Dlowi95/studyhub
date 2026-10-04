const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    storageProvider: {
      type: String,
      enum: ["cloudinary", "gridfs", "local", "external"],
      default: undefined,
    },
    storageKey: {
      type: String,
      default: undefined,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    subjectName: {
      type: String,
      default: "Khác",
    },
    variantGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
      index: true,
    },
    variantFormatKey: {
      type: String,
      default: undefined,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderationNote: { type: String, trim: true, maxlength: 2000, default: "" },
    viewCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

documentSchema.index({ title: 'text', description: 'text', tags: 'text', subjectName: 'text' });
documentSchema.index({ uploaderId: 1, createdAt: -1, _id: -1 });
documentSchema.index({ uploaderId: 1, status: 1, createdAt: -1, _id: -1 });
documentSchema.index({ status: 1, createdAt: -1 });
documentSchema.index({ subjectName: 1, fileType: 1 });
documentSchema.index({ viewCount: -1, downloadCount: -1 });
documentSchema.index(
  { variantGroupId: 1, variantFormatKey: 1 },
  { unique: true, partialFilterExpression: { variantFormatKey: { $type: "string" } } }
);

module.exports = mongoose.model("Document", documentSchema);
