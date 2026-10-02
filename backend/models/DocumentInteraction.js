const mongoose = require("mongoose");

const documentInteractionSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
  type: { type: String, enum: ["view", "download"], required: true },
  sessionId: { type: String, required: true, maxlength: 128 },
  bucket: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 172800 },
});

documentInteractionSchema.index({ documentId: 1, type: 1, sessionId: 1, bucket: 1 }, { unique: true });

module.exports = mongoose.models.DocumentInteraction || mongoose.model("DocumentInteraction", documentInteractionSchema);
