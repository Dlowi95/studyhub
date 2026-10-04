const mongoose = require('mongoose');

const reviewReplySchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  replyToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

reviewReplySchema.index({ reviewId: 1, createdAt: 1 });
module.exports = mongoose.models.ReviewReply || mongoose.model('ReviewReply', reviewReplySchema);
