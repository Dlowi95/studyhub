const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Mỗi user chỉ được đánh giá 1 lần cho mỗi tài liệu
reviewSchema.index({ documentId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
