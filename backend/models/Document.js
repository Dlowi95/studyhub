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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    subjectName: {
      type: String,
      default: "Khác",
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
documentSchema.index({ status: 1, createdAt: -1 });
documentSchema.index({ subjectName: 1, fileType: 1 });
documentSchema.index({ viewCount: -1, downloadCount: -1 });

module.exports = mongoose.model("Document", documentSchema);