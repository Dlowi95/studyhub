const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorName: { type: String, trim: true, default: "Hệ thống" },
    actorEmail: { type: String, trim: true, default: "" },
    actorRole: { type: String, trim: true, default: "" },
    action: {
      type: String,
      enum: [
        "document_status_changed",
        "report_status_changed",
        "document_deleted",
        "document_created",
        "document_updated",
        "user_role_changed",
        "user_status_changed",
        "subject_created",
        "subject_updated",
        "subject_deleted",
        "system_settings_updated",
      ],
      required: true,
      index: true,
    },
    entityType: { type: String, enum: ["Document", "Report", "User", "Subject", "SystemSetting"], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null, index: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", default: null },
    previousStatus: { type: String, default: "" },
    nextStatus: { type: String, default: "" },
    reason: { type: String, trim: true, maxlength: 2000, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ documentId: 1, createdAt: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
