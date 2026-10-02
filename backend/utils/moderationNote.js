function applyModerationNote(document, status, note) {
  if (note !== undefined && (typeof note !== "string" || note.trim().length > 2000)) {
    const error = new Error("Lý do kiểm duyệt tối đa 2.000 ký tự");
    error.status = 400;
    throw error;
  }
  document.moderationNote = status === "rejected"
    ? (note?.trim() || document.moderationNote || "") : "";
}
module.exports = { applyModerationNote };
