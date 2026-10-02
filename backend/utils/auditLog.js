const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

const recordAuditEvent = async ({ actor, action, entityType, entityId = null, documentId = null, reportId = null, previousStatus = "", nextStatus = "", reason = "", metadata }) => {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await AuditLog.create({
      actorId: actor?._id || null,
      actorName: actor?.name || "Hệ thống",
      actorEmail: actor?.email || "",
      actorRole: actor?.role || "",
      action,
      entityType,
      entityId,
      documentId,
      reportId,
      previousStatus,
      nextStatus,
      reason: typeof reason === "string" ? reason.trim().slice(0, 2000) : "",
      metadata,
    });
  } catch (error) {
    console.error("Không thể ghi nhật ký kiểm duyệt:", error.message);
    return null;
  }
};

module.exports = { recordAuditEvent };
